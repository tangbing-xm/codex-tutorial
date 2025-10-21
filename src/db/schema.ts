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

export const vocabularyBooks = pgTable(
  "vocabulary_books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookId: text("book_id").notNull(),
    bookName: text("book_name").notNull(),
    grade: text("grade"),
    semester: text("semester"),
    publisher: text("publisher"),
    totalWords: integer("total_words").notNull(),
    coverImageUrl: text("cover_image_url"),
    wordsData: jsonb("words_data").notNull(),
    tags: text("tags").array(),
    status: text("status").notNull().default("active"),
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
    bookIdUnique: uniqueIndex("vocabulary_books_book_id_unique").on(table.bookId),
    statusIdx: index("vocabulary_books_status_idx").on(table.status),
  }),
);

export type VocabularyBook = typeof vocabularyBooks.$inferSelect;
export type VocabularyBookInsert = typeof vocabularyBooks.$inferInsert;

