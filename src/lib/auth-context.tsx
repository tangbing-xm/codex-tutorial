"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "system" | "admin";
};

type AuthResult = { success: true } | { success: false; message: string };

type AuthContextValue = {
  user: AuthUser | null;
  isLoaded: boolean;
  signin: (email: string, password: string) => Promise<AuthResult>;
  signup: (
    payload: Pick<AuthUser, "name" | "email"> & { password: string },
  ) => Promise<AuthResult>;
  signout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readSession(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { user?: AuthUser | null };
  return data.user ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const sessionUser = await readSession();
      setUser(sessionUser);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signin = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        user?: AuthUser;
        error?: string;
      };
      if (!response.ok || !data.user) {
        return {
          success: false,
          message: data.error ?? "邮箱或密码错误",
        };
      }
      setUser(data.user);
      return { success: true };
    },
    [],
  );

  const signup = useCallback(
    async ({
      name,
      email,
      password,
    }: Pick<AuthUser, "name" | "email"> & { password: string }): Promise<AuthResult> => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        user?: AuthUser;
        error?: string;
      };
      if (!response.ok || !data.user) {
        return {
          success: false,
          message: data.error ?? "注册失败，请稍后再试",
        };
      }
      setUser(data.user);
      return { success: true };
    },
    [],
  );

  const signout = useCallback(async () => {
    await fetch("/api/auth/signout", {
      method: "POST",
    });
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoaded,
      signin,
      signup,
      signout,
      refresh,
    }),
    [isLoaded, refresh, signin, signup, signout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth 必须在 AuthProvider 中使用");
  }
  return context;
}
