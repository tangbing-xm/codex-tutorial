"use client";

import { useMemo, useState } from "react";
import { Mail, Pencil, Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SessionUser } from "@/lib/auth-service";

type AdminListItem = {
  id: string;
  name: string;
  email: string;
  role: "system" | "admin";
  createdAt: number;
  updatedAt: number;
};

const ROLE_LABEL: Record<AdminListItem["role"], string> = {
  system: "系统管理员",
  admin: "普通管理员",
};

export function AdminUsersClient({
  initialAdmins,
  currentUser,
}: {
  initialAdmins: AdminListItem[];
  currentUser: SessionUser;
}) {
  const [admins, setAdmins] = useState<AdminListItem[]>(initialAdmins);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as AdminListItem["role"],
  });
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminListItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "admin" as AdminListItem["role"],
  });
  const [editError, setEditError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      email: "",
      password: "",
      role: "admin",
    });
    setCreateError("");
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");
    setIsCreating(true);
    const response = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    setIsCreating(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setCreateError(data.error ?? "新增管理员失败");
      return;
    }
    const data = (await response.json()) as { user: AdminListItem };
    setAdmins((prev) => [...prev, data.user]);
    resetCreateForm();
    setCreateDialogOpen(false);
  };

  const openEditDialog = (target: AdminListItem) => {
    if (target.id === currentUser.id) {
      return;
    }
    setEditTarget(target);
    setEditForm({
      name: target.name,
      role: target.role,
    });
    setEditError("");
    setEditDialogOpen(true);
  };

  const handleEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) {
      return;
    }
    if (editTarget.id === currentUser.id) {
      setEditError("无法修改当前登录账号");
      return;
    }
    const payload: Record<string, unknown> = {};
    if (editForm.name.trim() !== editTarget.name) {
      payload.name = editForm.name.trim();
    }
    if (editForm.role !== editTarget.role) {
      payload.role = editForm.role;
    }
    if (Object.keys(payload).length === 0) {
      setEditDialogOpen(false);
      return;
    }
    setIsUpdating(true);
    const response = await fetch(`/api/admin-users/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setIsUpdating(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setEditError(data.error ?? "保存失败，请稍后重试");
      return;
    }
    const data = (await response.json()) as {
      user: AdminListItem;
    };
    setAdmins((prev) =>
      prev.map((item) => (item.id === data.user.id ? data.user : item)),
    );
    setEditDialogOpen(false);
    setEditTarget(null);
  };

  const readableTime = useMemo(
    () => (timestamp: number) =>
      new Date(timestamp).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">管理员管理</h1>
          <p className="text-sm text-muted-foreground">
            系统管理员可以新增或维护后台账号。当前账号无法自行编辑以维持安全。
          </p>
        </div>
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              resetCreateForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              新建管理员
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建管理员</DialogTitle>
              <DialogDescription>
                输入管理员信息，确认后即会创建新的后台账号。
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="create-name">姓名</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">邮箱</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">临时密码</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">角色</Label>
                <select
                  id="create-role"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      role: event.target.value as AdminListItem["role"],
                    }))
                  }
                >
                  <option value="admin">普通管理员</option>
                  <option value="system">系统管理员</option>
                </select>
              </div>
              {createError ? (
                <p className="text-sm text-destructive">{createError}</p>
              ) : null}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "创建中..." : "确认创建"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>管理员列表</CardTitle>
          <CardDescription>
            查看所有后台账号，编辑将通过弹窗完成。当前登录账号无法编辑。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {admins.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              目前暂无管理员账号，请先创建。
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => {
                const isCurrentUser = admin.id === currentUser.id;
                return (
                  <div
                    key={admin.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="text-base font-medium text-foreground">
                        {admin.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{admin.email}</span>
                        <span>•</span>
                        {admin.role === "system" ? (
                          <ShieldAlert className="h-4 w-4 text-blue-600" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        )}
                        <span>{ROLE_LABEL[admin.role]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        最近更新：{readableTime(admin.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(admin)}
                        disabled={isCurrentUser}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {isCurrentUser ? "当前账号" : "编辑"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditTarget(null);
            setEditError("");
            setIsUpdating(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑管理员</DialogTitle>
            <DialogDescription>更新管理员的姓名或角色。</DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <form className="space-y-4" onSubmit={handleEdit}>
              <div className="space-y-2">
                <Label htmlFor="edit-name">姓名</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">角色</Label>
                <select
                  id="edit-role"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      role: event.target.value as AdminListItem["role"],
                    }))
                  }
                >
                  <option value="admin">普通管理员</option>
                  <option value="system">系统管理员</option>
                </select>
              </div>
              <div className="rounded-md border border-dashed border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                账号邮箱：{editTarget.email}
              </div>
              {editError ? (
                <p className="text-sm text-destructive">{editError}</p>
              ) : null}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "保存中..." : "保存修改"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

