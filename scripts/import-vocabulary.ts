import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { words } from "../src/db/schema";

interface WordEntry {
  wordRank: number;
  headWord: string;
  content: {
    word: {
      wordHead: string;
      wordId: string;
      content: Record<string, unknown>;
    };
  };
  bookId?: string; // Optional, will extract from wordId if not present
}

async function importVocabularyBook(filePath: string) {
  console.log(`📚 Starting import from file`);
  console.log(`📂 Reading file: ${filePath}`);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read entire file
  const fileContent = fs.readFileSync(filePath, "utf-8");
  
  // Split by }{ pattern to separate JSON objects
  const jsonStrings = fileContent
    .split(/\}\s*\{/)
    .map((str, index, array) => {
      // Add back the braces that were removed during split
      if (index === 0) return str + "}";
      if (index === array.length - 1) return "{" + str;
      return "{" + str + "}";
    })
    .filter((str) => str.trim().length > 2); // Filter out empty strings

  console.log(`📄 Found ${jsonStrings.length} JSON objects in file`);

  const wordsArray: WordEntry[] = [];
  let bookId = "";

  for (let i = 0; i < jsonStrings.length; i++) {
    try {
      const wordEntry: WordEntry = JSON.parse(jsonStrings[i]);
      
      // Extract bookId from wordId if not present
      // e.g., "CET4luan_1_1" -> "CET4luan_1"
      if (!wordEntry.bookId && wordEntry.content?.word?.wordId) {
        const wordId = wordEntry.content.word.wordId;
        const parts = wordId.split('_');
        if (parts.length >= 2) {
          // Remove the last part (word number) to get bookId
          wordEntry.bookId = parts.slice(0, -1).join('_');
        }
      }
      
      wordsArray.push(wordEntry);

      if (!bookId && wordEntry.bookId) {
        bookId = wordEntry.bookId;
      }

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r⏳ Parsed ${i + 1}/${jsonStrings.length} words...`);
      }
    } catch (error) {
      console.error(`\n❌ Error parsing object ${i + 1}:`, error);
      console.error("First 100 chars:", jsonStrings[i].substring(0, 100));
    }
  }

  console.log(`\n✅ Successfully parsed ${wordsArray.length} words from file`);

  if (wordsArray.length === 0) {
    console.log("⚠️  No words found in file");
    return;
  }

  // Connect to database
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not configured");
  }

  const client = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  const db = drizzle(client, { schema: { words } });

  console.log("🔗 Connected to database");

  // Prepare word records for insertion
  const wordRecords = wordsArray.map((word) => ({
    wordRank: word.wordRank,
    headWord: word.headWord,
    content: word.content,
    bookId: word.bookId || bookId, // Use extracted bookId as fallback
  }));

  // Insert words in batches of 50
  const batchSize = 50;
  let insertedCount = 0;

  try {
    for (let i = 0; i < wordRecords.length; i += batchSize) {
      const batch = wordRecords.slice(i, i + batchSize);
      await db.insert(words).values(batch);
      insertedCount += batch.length;
      process.stdout.write(`\r💾 Inserted ${insertedCount}/${wordRecords.length} words...`);
    }

    console.log(`\n✅ Successfully imported all words!`);
    console.log(`   Book ID: ${bookId}`);
    console.log(`   Total Words: ${insertedCount}`);
  } catch (error) {
    console.error("\n❌ Error inserting data:", error);
    throw error;
  } finally {
    await client.end();
    console.log("🔌 Database connection closed");
  }
}

// Main execution
const args = process.argv.slice(2);
const filePath = args[0] || path.join(__dirname, "../temp/PEPXiaoXue3_1.json");

importVocabularyBook(filePath)
  .then(() => {
    console.log("\n🎉 Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Import failed:", error);
    process.exit(1);
  });
