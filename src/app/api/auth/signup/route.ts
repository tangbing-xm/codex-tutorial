import { NextResponse } from "next/server";
import { z } from "zod";
import {
  countAdminUsers,
  createAdminUser,
  createSession,
  findUserByEmail,
  requireSessionUser,
  setSessionCookie,
} from "@/lib/auth-service";

const signupSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  email: z.string().email("请填写正确的邮箱"),
  password: z.string().min(6, "密码至少需要 6 位"),
  role: z.enum(["system", "admin"]).optional(),
});

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "请求参数不合法" },
      { status: 400 },
    );
  }

  const { name, email, password, role } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "该邮箱已被注册" },
      { status: 409 },
    );
  }

  const currentCount = await countAdminUsers();

  if (currentCount === 0) {
    const user = await createAdminUser({
      name,
      email,
      password,
      role: "system",
    });
    const { sessionId, expiresAt } = await createSession(user.id);
    await setSessionCookie({ sessionId, expiresAt });
    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  }

  try {
    const currentUser = await requireSessionUser();
    if (currentUser.role !== "system") {
      return NextResponse.json(
        { error: "只有系统管理员可以创建新的管理员" },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "当前环境不允许直接注册，请联系系统管理员" },
      { status: 403 },
    );
  }

  const newRole = role ?? "admin";
  let user: Awaited<ReturnType<typeof createAdminUser>>;
  try {
    user = await createAdminUser({
      name,
      email,
      password,
      role: newRole,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("duplicate") ||
        error.message.toLowerCase().includes("unique") ||
        // @ts-expect-error drizzle postgres error code
        error.code === "23505")
    ) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    { status: 201 },
  );
}
