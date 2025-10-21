import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { adminSessions, adminUsers } from "../db/schema";
import { db } from "./db";

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "system" | "admin";
};

export async function countAdminUsers() {
  const result = await db
    .select({ value: sql<number>`count(*)` })
    .from(adminUsers);
  const rawValue = result[0]?.value ?? 0;
  const count = Number(rawValue);
  return Number.isNaN(count) ? 0 : count;
}

export async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  return result[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createAdminUser({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role: "system" | "admin";
}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  const [record] = await db
    .insert(adminUsers)
    .values({
      id: userId,
      name,
      email,
      passwordHash,
      role,
    })
    .returning({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
    });

  if (!record) {
    throw new Error("创建管理员失败");
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role as SessionUser["role"],
  } as SessionUser;
}

export async function updateAdminUser(
  id: string,
  update: Partial<Pick<SessionUser, "name" | "role">>,
) {
  const now = new Date();
  const payload: Record<string, unknown> = {
    updatedAt: now,
  };
  if (update.name !== undefined) {
    payload.name = update.name;
  }
  if (update.role !== undefined) {
    payload.role = update.role;
  }
  if (Object.keys(payload).length <= 1) {
    return;
  }
  await db
    .update(adminUsers)
    .set({
      ...payload,
    })
    .where(eq(adminUsers.id, id));
}

export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(adminSessions).values({
    id: sessionId,
    userId,
    expiresAt,
    createdAt: new Date(),
  });
  return { sessionId, expiresAt: expiresAt.getTime() };
}

export async function deleteSession(sessionId: string) {
  await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return null;
  }
  const result = await db
    .select({
      sessionId: adminSessions.id,
      expiresAt: adminSessions.expiresAt,
      userId: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
  })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(eq(adminSessions.id, sessionId))
    .limit(1);

  const record = result[0];
  if (!record) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await deleteSession(sessionId);
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    id: record.userId,
    name: record.name,
    email: record.email,
    role: record.role as SessionUser["role"],
  };
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function setSessionCookie({
  sessionId,
  expiresAt,
}: {
  sessionId: string;
  expiresAt: number;
}) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
