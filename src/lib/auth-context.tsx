"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type StoredAdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type AuthUser = Omit<StoredAdminUser, "password">;

type AuthResult = { success: true } | { success: false; message: string };

type AuthContextValue = {
  user: AuthUser | null;
  isLoaded: boolean;
  adminUsers: AuthUser[];
  signin: (email: string, password: string) => Promise<AuthResult>;
  signup: (
    payload: Pick<StoredAdminUser, "name" | "email" | "password">,
  ) => Promise<AuthResult>;
  signout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ADMIN_USERS_KEY = "shadcn-admin-users";
const CURRENT_USER_KEY = "shadcn-admin-current-user";

function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function sanitizeUsers(users: StoredAdminUser[]): AuthUser[] {
  return users.map(({ password: _password, ...rest }) => {
    void _password;
    return rest;
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<StoredAdminUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedUsers = readFromStorage<StoredAdminUser[]>(ADMIN_USERS_KEY, []);
    const storedCurrent = readFromStorage<AuthUser | null>(
      CURRENT_USER_KEY,
      null,
    );
    setAdminUsers(storedUsers);
    setUser(storedCurrent);
    setIsLoaded(true);
  }, []);

  const persistUsers = useCallback((users: StoredAdminUser[]) => {
    setAdminUsers(users);
    writeToStorage(ADMIN_USERS_KEY, users);
  }, []);

  const signin = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const match = adminUsers.find(
        (item) => item.email === email && item.password === password,
      );
      if (!match) {
        return { success: false, message: "邮箱或密码错误" };
      }
      const sanitized: AuthUser = {
        id: match.id,
        email: match.email,
        name: match.name,
      };
      setUser(sanitized);
      writeToStorage(CURRENT_USER_KEY, sanitized);
      return { success: true };
    },
    [adminUsers],
  );

  const signup = useCallback(
    async ({
      name,
      email,
      password,
    }: Pick<StoredAdminUser, "name" | "email" | "password">): Promise<AuthResult> => {
      const exists = adminUsers.some((item) => item.email === email);
      if (exists) {
        return { success: false, message: "该邮箱已被注册" };
      }
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `admin-${Date.now()}`;
      const newUser: StoredAdminUser = {
        id,
        name,
        email,
        password,
      };
      const nextUsers = [...adminUsers, newUser];
      persistUsers(nextUsers);
      const sanitized: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      };
      setUser(sanitized);
      writeToStorage(CURRENT_USER_KEY, sanitized);
      return { success: true };
    },
    [adminUsers, persistUsers],
  );

  const signout = useCallback(() => {
    setUser(null);
    writeToStorage(CURRENT_USER_KEY, null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoaded,
      adminUsers: sanitizeUsers(adminUsers),
      signin,
      signup,
      signout,
    }),
    [adminUsers, isLoaded, signin, signup, signout, user],
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
