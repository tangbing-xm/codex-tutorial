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

export default function SignInPage() {
  const router = useRouter();
  const { signin, user, isLoaded } = useAuth();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowInitialSignup, setAllowInitialSignup] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/books");
    }
  }, [isLoaded, router, user]);

  useEffect(() => {
    const checkAvailability = async () => {
      const response = await fetch("/api/auth/availability");
      if (!response.ok) {
        setAllowInitialSignup(false);
        return;
      }
      const data = (await response.json()) as {
        allowInitialSignup: boolean;
      };
      setAllowInitialSignup(data.allowInitialSignup);
      if (data.allowInitialSignup) {
        router.replace("/signup");
      }
    };
    void checkAvailability();
  }, [router]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await signin(formState.email, formState.password);
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
          <CardTitle>管理员登录</CardTitle>
          <CardDescription>
            使用注册的邮箱和密码登录管理后台。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
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
                autoComplete="current-password"
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
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "正在登录..." : "登录"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {allowInitialSignup === true ? (
              <>
                还没有账号？{" "}
                <Link
                  className="text-primary underline-offset-4 hover:underline"
                  href="/signup"
                >
                  立即注册
                </Link>
              </>
            ) : allowInitialSignup === false ? (
              "请联系系统管理员创建新的后台账号"
            ) : (
              "正在检测系统状态..."
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
