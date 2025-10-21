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
  const [allowSignup, setAllowSignup] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/books");
    }
  }, [isLoaded, router, user]);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch("/api/auth/availability");
        if (!response.ok) {
          setAllowSignup(false);
          return;
        }
        const data = (await response.json()) as {
          allowInitialSignup: boolean;
        };
        setAllowSignup(data.allowInitialSignup);
      } catch {
        setAllowSignup(false);
      }
    };
    void checkAvailability();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (allowSignup === false) {
      setError("当前不允许直接注册，请联系系统管理员");
      return;
    }
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
          {allowSignup === false ? (
            <div className="mb-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              系统已存在管理员，无法直接在此注册新的账号。请返回登录页或联系系统管理员协助创建。
            </div>
          ) : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="rounded-md border border-dashed border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              仅当系统尚未创建管理员时，才可以在此处注册首个系统管理员。如果已有管理员存在，请使用登录入口或联系系统管理员协助创建。
            </div>
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
            <Button
              className="w-full"
              type="submit"
              disabled={isSubmitting || allowSignup === false || allowSignup === null}
            >
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
