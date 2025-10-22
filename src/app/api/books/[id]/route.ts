import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { books } from "@/db/schema";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth-service";

const updateBookSchema = z
  .object({
    bookId: z
      .string()
      .trim()
      .min(1, "单词书 ID 不能为空")
      .max(128, "单词书 ID 过长")
      .optional(),
    title: z
      .string()
      .trim()
      .min(1, "标题不能为空")
      .max(256, "标题过长")
      .optional(),
    wordCount: z
      .preprocess(
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
      )
      .optional(),
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
  })
  .refine(
    (data) =>
      data.bookId !== undefined ||
      data.title !== undefined ||
      data.wordCount !== undefined ||
      data.coverUrl !== undefined ||
      data.tags !== undefined,
    "至少需要修改一项内容",
  );

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const currentBookId = rawId?.trim();
  if (!currentBookId) {
    return NextResponse.json({ error: "单词书 ID 不合法" }, { status: 400 });
  }

  const data = await request.json().catch(() => null);
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  const normalizedData = record
    ? {
        ...record,
        bookId: (() => {
          const rawBookId = record["bookId"];
          const rawId = record["id"];
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

  const parsed = updateBookSchema.safeParse(normalizedData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数不合法" },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (payload.bookId !== undefined) {
    updates.bookId = payload.bookId.trim();
  }
  if (payload.title !== undefined) {
    updates.title = payload.title.trim();
  }
  if (payload.wordCount !== undefined) {
    updates.wordCount = payload.wordCount;
  }
  if (payload.coverUrl !== undefined) {
    const normalized =
      typeof payload.coverUrl === "string" && payload.coverUrl.trim().length > 0
        ? payload.coverUrl.trim()
        : null;
    updates.coverUrl = normalized;
  }
  if (payload.tags !== undefined) {
    updates.tags = payload.tags.map((tag) => tag.trim()).filter(Boolean);
  }

  try {
    const [recordUpdated] = await db
      .update(books)
      .set(updates)
      .where(eq(books.bookId, currentBookId))
      .returning(bookSelection);

    if (!recordUpdated) {
      return NextResponse.json({ error: "单词书不存在" }, { status: 404 });
    }

    const responsePayload = {
      id: recordUpdated.bookId,
      title: recordUpdated.title,
      wordCount: recordUpdated.wordCount,
      coverUrl: recordUpdated.coverUrl ?? "",
      tags: recordUpdated.tags ?? [],
      createdAt: toTimestamp(recordUpdated.createdAt),
      updatedAt: toTimestamp(recordUpdated.updatedAt),
    };

    return NextResponse.json({ book: responsePayload });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("unique") ||
        error.message.toLowerCase().includes("duplicate"))
    ) {
      return NextResponse.json(
        { error: "该单词书 ID 已存在" },
        { status: 409 },
      );
    }
    console.error("Update book error:", error);
    return NextResponse.json(
      { error: "更新单词书失败" },
      { status: 500 },
    );
  }
}
