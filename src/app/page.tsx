import Link from "next/link";
import { redirect } from "next/navigation";
import { countAdminUsers } from "@/lib/auth-service";

export default async function Home() {
  const adminCount = await countAdminUsers();
  if (adminCount === 0) {
    redirect("/signup");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          欢迎来到单词书管理后台
        </h1>
        <p className="text-base text-muted-foreground">
          请先登录管理员账号以访问单词书和管理员管理功能。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signin"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            登录后台
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            注册管理员
          </Link>
        </div>
      </div>
    </div>
  );
}
