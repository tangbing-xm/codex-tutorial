"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LogOut, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, signout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      const checkAvailability = async () => {
        const response = await fetch("/api/auth/availability");
        if (!response.ok) {
          router.replace("/signin");
          return;
        }
        const data = (await response.json()) as {
          allowInitialSignup: boolean;
        };
        router.replace(data.allowInitialSignup ? "/signup" : "/signin");
      };
      void checkAvailability();
    }
  }, [isLoaded, router, user]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-md border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          正在加载数据...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems =
    user.role === "system"
      ? [
          {
            href: "/books",
            label: "单词书管理",
            icon: BookOpen,
          },
          {
            href: "/admin-users",
            label: "管理员管理",
            icon: Users,
          },
        ]
      : [
          {
            href: "/books",
            label: "单词书管理",
            icon: BookOpen,
          },
        ];

  return (
    <div className="flex min-h-screen bg-muted/40 text-foreground">
      <aside className="hidden min-h-screen w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
        <div className="px-2">
          <span className="text-lg font-semibold tracking-tight">词书后台</span>
          <p className="mt-1 text-sm text-muted-foreground">管理系统控制台</p>
        </div>
        <nav className="mt-8 flex flex-1 flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-4">
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="outline"
              className="justify-start gap-2 text-sm"
              onClick={async () => {
                await signout();
                router.replace("/signin");
              }}
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-4 lg:hidden">
          <div>
            <p className="text-base font-semibold">词书后台</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signout();
              router.replace("/signin");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出
          </Button>
        </header>
        <main className="flex-1 bg-background px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
