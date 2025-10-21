import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { books } from "@/db/schema";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth-service";

const createBookSchema = z.object({
  bookId: z
    .string({ required_error: "Book ID 不能为空" })
    .trim()
    .min(1, "Book ID 不能为空")
    .max(128, "Book ID 过长"),
  title: z
    .string({ required_error: "标题不能为空" })
    .trim()
    .min(1, "标题不能为空")
    .max(256, "标题过长"),
  wordCount: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    },
    z
      .number({ invalid_type_error: "单词数量必须是数字" })
      .int("单词数量必须是整数")
      .min(0, "单词数量不能为负"),
  ),
  coverUrl: z
    .string()
    .trim()
    .url("封面链接格式不正确")
    .optional()
    .or(z.literal("")),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "标签不能为空")
        .max(32, "标签长度过长"),
    )
    .max(10, "最多支持 10 个标签")
    .optional(),
});

const bookSelection = {
  id: books.id,
  bookId: books.bookId,
  title: books.title,
  wordCount: books.wordCount,
  coverUrl: books.coverUrl,
  tags: books.tags,
  createdAt: books.createdAt,
  updatedAt: books.updatedAt,
};

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

export async function GET() {
  const user = await requireSessionUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const result = await db.select(bookSelection).from(books).orderBy(desc(books.createdAt));

  const payload = result.map((book) => ({
    id: book.bookId,
    title: book.title,
    wordCount: book.wordCount,
    coverUrl: book.coverUrl ?? "",
    tags: book.tags ?? [],
    createdAt: toTimestamp(book.createdAt),
    updatedAt: toTimestamp(book.updatedAt),
  }));

  return NextResponse.json({
    success: true,
    books: payload,
  });
}

export async function POST(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const data = await request.json().catch(() => null);
  const dataRecord =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  const normalizedData = dataRecord
    ? {
        ...dataRecord,
        bookId: (() => {
          const rawBookId = dataRecord["bookId"];
          const rawId = dataRecord["id"];
          if (typeof rawBookId === "string" && rawBookId.trim().length > 0) {
            return rawBookId;
          }
          if (typeof rawId === "string") {
            return rawId;
          }
          return rawBookId;
        })(),
      }
    : data;

  const parsed = createBookSchema.safeParse(normalizedData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数不合法" },
      { status: 400 },
    );
  }

  const { bookId, title, wordCount, coverUrl, tags } = parsed.data;
  const sanitizedBookId = bookId.trim();
  const sanitizedTitle = title.trim();
  const sanitizedCoverUrl =
    typeof coverUrl === "string" && coverUrl.trim().length > 0
      ? coverUrl.trim()
      : null;
  const sanitizedTags = (tags ?? []).map((tag) => tag.trim()).filter(Boolean);

  try {
    const [record] = await db
      .insert(books)
      .values({
        bookId: sanitizedBookId,
        title: sanitizedTitle,
        wordCount,
        coverUrl: sanitizedCoverUrl,
        tags: sanitizedTags,
      })
      .returning(bookSelection);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "创建单词书失败" },
        { status: 500 },
      );
    }

    const bookPayload = {
      id: record.bookId,
      title: record.title,
      wordCount: record.wordCount,
      coverUrl: record.coverUrl ?? "",
      tags: record.tags ?? [],
      createdAt: toTimestamp(record.createdAt),
      updatedAt: toTimestamp(record.updatedAt),
    };

    return NextResponse.json({ success: true, book: bookPayload }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("unique") ||
        error.message.toLowerCase().includes("duplicate"))
    ) {
      return NextResponse.json(
        { success: false, error: "该单词书 ID 已存在" },
        { status: 409 },
      );
    }
    console.error("Create book error:", error);
    return NextResponse.json(
      { success: false, error: "创建单词书失败" },
      { status: 500 },
    );
  }
}
