import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { adminSessions, adminUsers, words } from "../db/schema";

const schema = {
  adminUsers,
  adminSessions,
  words,
};

type DrizzleDb = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  drizzleDb?: DrizzleDb;
  drizzleClient?: ReturnType<typeof postgres>;
};

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl) {
    throw new Error("DATABASE_URL 未配置，无法连接 Supabase");
  }
  if (envUrl.includes("sslmode=")) {
    return envUrl;
  }
  const separator = envUrl.includes("?") ? "&" : "?";
  return `${envUrl}${separator}sslmode=require`;
}

function initialize(): DrizzleDb {
  if (globalForDb.drizzleDb) {
    return globalForDb.drizzleDb;
  }

  const databaseUrl = resolveDatabaseUrl();
  const client = postgres(databaseUrl, {
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
    prepare: false,
  });

  const db = drizzle(client, { schema });
  globalForDb.drizzleDb = db;
  globalForDb.drizzleClient = client;
  return db;
}

export const db = initialize();

export type DatabaseClient = DrizzleDb;
