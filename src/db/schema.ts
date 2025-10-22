import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull(), // "system" | "admin"
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("admin_users_email_unique").on(table.email),
    roleIdx: index("admin_users_role_idx").on(table.role),
  }),
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("admin_sessions_user_idx").on(table.userId),
    expiresIdx: index("admin_sessions_expires_idx").on(table.expiresAt),
  }),
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type AdminUserInsert = typeof adminUsers.$inferInsert;
export type AdminSession = typeof adminSessions.$inferSelect;
export type AdminSessionInsert = typeof adminSessions.$inferInsert;

export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookId: text("book_id").notNull().unique(),
    title: text("title").notNull(),
    wordCount: integer("word_count").notNull(),
    coverUrl: text("cover_url"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    bookIdUnique: uniqueIndex("books_book_id_unique").on(table.bookId),
    titleIdx: index("books_title_idx").on(table.title),
  }),
);

export type Book = typeof books.$inferSelect;
export type BookInsert = typeof books.$inferInsert;

export const words = pgTable(
  "words",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wordRank: integer("word_rank").notNull(),
    headWord: text("head_word").notNull(),
    content: jsonb("content").notNull(),
    bookId: text("book_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    bookIdIdx: index("words_book_id_idx").on(table.bookId),
    headWordIdx: index("words_head_word_idx").on(table.headWord),
    wordRankIdx: index("words_word_rank_idx").on(table.bookId, table.wordRank),
  }),
);

export type Word = typeof words.$inferSelect;
export type WordInsert = typeof words.$inferInsert;
