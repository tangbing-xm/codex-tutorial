"use client";

import { useCallback, useMemo, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";

type BookItem = {
  id: string;
  title: string;
  wordCount: number;
  coverUrl: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

function formatDate(timestamp: number) {
  if (!timestamp) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "—";
  }
}

export function BooksClient({ initialBooks }: { initialBooks: BookItem[] }) {
  const [books, setBooks] = useState<BookItem[]>(initialBooks);
  const [searchTerm, setSearchTerm] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    id: "",
    title: "",
    wordCount: "",
    coverUrl: "",
    tags: "",
  });
  const [createError, setCreateError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const stats = useMemo(() => {
    if (books.length === 0) {
      return {
        total: 0,
        totalWords: 0,
        latestUpdatedAt: 0,
      };
    }
    const totalWords = books.reduce((acc, book) => acc + (book.wordCount ?? 0), 0);
    const latestUpdatedAt = books.reduce(
      (latest, book) => (book.updatedAt > latest ? book.updatedAt : latest),
      0,
    );
    return {
      total: books.length,
      totalWords,
      latestUpdatedAt,
    };
  }, [books]);

  const filteredBooks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return books;
    }
    return books.filter((book) => {
      if (book.title.toLowerCase().includes(keyword)) {
        return true;
      }
      if (book.id.toLowerCase().includes(keyword)) {
        return true;
      }
      return book.tags.some((tag) => tag.toLowerCase().includes(keyword));
    });
  }, [books, searchTerm]);

  const resetCreateForm = useCallback(() => {
    setCreateForm({
      id: "",
      title: "",
      wordCount: "",
      coverUrl: "",
      tags: "",
    });
    setCreateError("");
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");

    const payload = {
      id: createForm.id.trim(),
      title: createForm.title.trim(),
      wordCount: Number.parseInt(createForm.wordCount, 10),
      coverUrl: createForm.coverUrl.trim(),
      tags: createForm.tags
        .split(/[,，\s]+/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (!Number.isFinite(payload.wordCount)) {
      setCreateError("单词数量必须是数字");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        coverUrl: payload.coverUrl.length > 0 ? payload.coverUrl : undefined,
      }),
    });
    setIsSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setCreateError(data.error ?? "创建单词书失败，请稍后重试");
      return;
    }

    const data = (await response.json()) as { book: BookItem };
    setBooks((prev) => {
      const next = [...prev, data.book];
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      return next;
    });
    setCreateDialogOpen(false);
    resetCreateForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">单词书管理</h1>
          <p className="text-sm text-muted-foreground">
            创建并维护单词书信息，实时查看封面、词量与标签。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>单词书总数</CardDescription>
              <CardTitle className="text-3xl font-bold">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                当前后台收录的全部单词书数量。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>收录词数</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {stats.totalWords.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                单词书覆盖的单词总数量。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>最近更新</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {stats.latestUpdatedAt ? formatDate(stats.latestUpdatedAt) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                最近一次单词书创建或更新的日期。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>单词书列表</CardTitle>
            <CardDescription>管理单词书信息并创建新的词书。</CardDescription>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="搜索标题、ID 或标签..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
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
                  新建单词书
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建单词书</DialogTitle>
                  <DialogDescription>
                    完成以下信息后即可录入单词书，标签可使用逗号或空格分隔多个条目。
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreate}>
                  <div className="space-y-2">
                    <Label htmlFor="book-id">单词书 ID</Label>
                    <Input
                      id="book-id"
                      required
                      placeholder="例如 PEPXiaoXue3_1"
                      value={createForm.id}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          id: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book-title">单词书标题</Label>
                    <Input
                      id="book-title"
                      required
                      placeholder="请输入标题"
                      value={createForm.title}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book-word-count">单词数量</Label>
                    <Input
                      id="book-word-count"
                      type="number"
                      min={0}
                      required
                      placeholder="请输入单词总数"
                      value={createForm.wordCount}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          wordCount: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book-cover-url">封面链接（可选）</Label>
                    <Input
                      id="book-cover-url"
                      placeholder="https://example.com/cover.png"
                      value={createForm.coverUrl}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          coverUrl: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book-tags">标签（可选）</Label>
                    <Input
                      id="book-tags"
                      placeholder="小学, 三年级, 词汇"
                      value={createForm.tags}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          tags: event.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      多个标签可使用逗号、顿号或空格分隔。
                    </p>
                  </div>
                  {createError ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {createError}
                    </div>
                  ) : null}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        取消
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "保存中..." : "确认创建"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-t border-border text-sm">
            <thead>
              <tr className="bg-muted/60 text-left">
                <th className="px-4 py-3 font-medium">单词书</th>
                <th className="px-4 py-3 font-medium">词汇量</th>
                <th className="px-4 py-3 font-medium">标签</th>
                <th className="px-4 py-3 font-medium">最近更新</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
                    {books.length === 0 ? "暂无单词书记录" : "没有匹配的单词书"}
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-border bg-muted"
                          style={
                            book.coverUrl
                              ? {
                                  backgroundImage: `url(${book.coverUrl})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : undefined
                          }
                        >
                          {book.coverUrl ? null : (
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {book.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            ID: {book.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{book.wordCount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {book.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {book.tags.map((tag) => (
                            <span
                              key={`${book.id}-${tag}`}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(book.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

