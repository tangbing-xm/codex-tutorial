import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminUsers } from "@/db/schema";
import { db } from "@/lib/db";
import { findUserById, requireSessionUser, updateAdminUser } from "@/lib/auth-service";

const updateSchema = z
  .object({
    name: z.string().min(1, "姓名不能为空").optional(),
    role: z.enum(["system", "admin"]).optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.role !== undefined,
    "至少需要修改一项内容",
  );

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const currentUser = await requireSessionUser().catch(() => null);
  if (!currentUser || currentUser.role !== "system") {
    return NextResponse.json(
      { error: "只有系统管理员可以修改管理员信息" },
      { status: 403 },
    );
  }

  const data = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "请求参数不合法" },
      { status: 400 },
    );
  }

  const target = await findUserById(id);
  if (!target) {
    return NextResponse.json(
      { error: "管理员不存在" },
      { status: 404 },
    );
  }

  if (target.id === currentUser.id) {
    return NextResponse.json(
      { error: "无法修改当前登录账号" },
      { status: 400 },
    );
  }

  if (parsed.data.role && parsed.data.role !== target.role) {
    if (target.role === "system" && parsed.data.role === "admin") {
      const systemCount = await db
        .select({ value: adminUsers.id })
        .from(adminUsers)
        .where(eq(adminUsers.role, "system"));

      if (systemCount.length <= 1) {
        return NextResponse.json(
          { error: "至少保留一位系统管理员" },
          { status: 400 },
        );
      }
    }
  }

  await updateAdminUser(target.id, parsed.data);

  const updated = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, target.id))
    .limit(1);

  const user = updated[0];
  return NextResponse.json({
    user: user
      ? {
          ...user,
          createdAt: user.createdAt?.getTime?.() ?? 0,
          updatedAt: user.updatedAt?.getTime?.() ?? 0,
        }
      : null,
  });
}
