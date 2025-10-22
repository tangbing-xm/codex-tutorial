import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { books } from "@/db/schema";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-service";
import { BooksClient } from "./books-client";

const toTimestamp = (value: unknown) => {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
};

export default async function BooksPage() {
  // Server-side authentication check
  const user = await getSessionUser();
  
  if (!user) {
    redirect("/signin");
  }

  // Direct database query on the server
  const result = await db
    .select({
      id: books.bookId,
      title: books.title,
      wordCount: books.wordCount,
      coverUrl: books.coverUrl,
      tags: books.tags,
      createdAt: books.createdAt,
      updatedAt: books.updatedAt,
    })
    .from(books)
    .orderBy(desc(books.createdAt));

  const booksList = result.map((book) => ({
    id: book.id,
    title: book.title,
    wordCount: book.wordCount,
    coverUrl: book.coverUrl ?? "",
    tags: book.tags ?? [],
    createdAt: toTimestamp(book.createdAt),
    updatedAt: toTimestamp(book.updatedAt),
  }));

  return <BooksClient initialBooks={booksList} />;
}
