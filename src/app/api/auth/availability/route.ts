import { NextResponse } from "next/server";
import { countAdminUsers } from "@/lib/auth-service";

export async function GET() {
  const count = await countAdminUsers();
  return NextResponse.json({
    allowInitialSignup: count === 0,
    adminCount: count,
  });
}

