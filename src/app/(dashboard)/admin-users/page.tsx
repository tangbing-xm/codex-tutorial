import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { adminUsers } from "@/db/schema";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-service";
import { AdminUsersClient } from "./admin-users-client";

export default async function AdminUsersPage() {
  // Server-side authentication and authorization check
  const user = await getSessionUser();

  if (!user) {
    redirect("/signin");
  }

  if (user.role !== "system") {
    redirect("/books");
  }

  // Direct database query on the server
  const admins = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));

  const adminsList = admins.map((item) => ({
    ...item,
    role: item.role as "system" | "admin",
    createdAt: item.createdAt?.getTime?.() ?? 0,
    updatedAt: item.updatedAt?.getTime?.() ?? 0,
  }));

  return <AdminUsersClient initialAdmins={adminsList} currentUser={user} />;
}
