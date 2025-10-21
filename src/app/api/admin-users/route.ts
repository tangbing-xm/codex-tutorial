import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { adminUsers } from "@/db/schema";
import { db } from "@/lib/db";
import { createAdminUser, requireSessionUser } from "@/lib/auth-service";

const createSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  email: z.string().email("请输入正确的邮箱"),
  password: z.string().min(6, "密码至少需要 6 位"),
  role: z.enum(["system", "admin"]).default("admin"),
});

export async function GET() {
  const user = await requireSessionUser().catch(() => null);
  if (!user || user.role !== "system") {
    return NextResponse.json(
      { error: "无权访问管理员列表" },
      { status: 403 },
    );
  }

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

  return NextResponse.json({
    users: admins.map((item) => ({
      ...item,
      createdAt: item.createdAt?.getTime?.() ?? 0,
      updatedAt: item.updatedAt?.getTime?.() ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireSessionUser().catch(() => null);
  if (!user || user.role !== "system") {
    return NextResponse.json(
      { error: "只有系统管理员可以新增管理员" },
      { status: 403 },
    );
  }

  const data = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "请求参数不合法" },
      { status: 400 },
    );
  }

  const { name, email, password, role } = parsed.data;

  try {
    const newUser = await createAdminUser({
      name,
      email,
      password,
      role,
    });

    return NextResponse.json(
      {
        user: newUser,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("unique") ||
        error.message.toLowerCase().includes("duplicate"))
    ) {
      return NextResponse.json(
        { error: "该邮箱已存在" },
        { status: 409 },
      );
    }
    throw error;
  }
}
