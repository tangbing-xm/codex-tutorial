"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const router = useRouter();
  const { signup, user, isLoaded } = useAuth();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/books");
    }
  }, [isLoaded, router, user]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formState.password !== formState.confirm) {
      setError("密码与确认密码不一致");
      return;
    }
    setError("");
    setIsSubmitting(true);
    const result = await signup({
      name: formState.name,
      email: formState.email,
      password: formState.password,
    });
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    router.replace("/books");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-muted to-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>创建系统管理员</CardTitle>
          <CardDescription>填写信息以创建第一个管理员账户。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                autoComplete="name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">确认密码</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={formState.confirm}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    confirm: event.target.value,
                  }))
                }
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "正在创建..." : "注册"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            已经有账号？{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/signin">
              返回登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

