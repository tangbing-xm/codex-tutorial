"use client";

import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function AdminUsersPage() {
  const { adminUsers } = useAuth();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">管理员管理</h1>
          <p className="text-sm text-muted-foreground">
            查看系统管理员列表，维护登录权限。
          </p>
        </div>
        <Button
          onClick={() => router.push("/signup")}
          className="w-full sm:w-auto"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          新增管理员
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>管理员用户</CardTitle>
          <CardDescription>
            所有有权访问后台的账号。新注册的管理员会自动出现在这里。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {adminUsers.length === 0 ? (
            <div className="flex items-center justify-between rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              当前还没有管理员。点击右上角按钮创建第一个管理员。
            </div>
          ) : (
            <div className="space-y-3">
              {adminUsers.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground">
                      {admin.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                    拥有后台访问权限
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
