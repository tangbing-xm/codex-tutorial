import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSession,
  findUserByEmail,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth-service";

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const parsed = signinSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "请求参数不合法" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const userRecord = await findUserByEmail(email);

  if (!userRecord) {
    return NextResponse.json(
      { error: "邮箱或密码错误" },
      { status: 401 },
    );
  }

  const match = await verifyPassword(password, userRecord.passwordHash);

  if (!match) {
    return NextResponse.json(
      { error: "邮箱或密码错误" },
      { status: 401 },
    );
  }

  const { sessionId, expiresAt } = await createSession(userRecord.id);
  await setSessionCookie({ sessionId, expiresAt });

  return NextResponse.json({
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
    },
  });
}
