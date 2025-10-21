"use client";

import { useMemo } from "react";
import { Plus, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Book = {
  id: string;
  name: string;
  level: string;
  words: number;
  status: "草稿" | "已发布";
  updatedAt: string;
};

const SAMPLE_BOOKS: Book[] = [
  {
    id: "1",
    name: "基础词汇 1500",
    level: "初级",
    words: 1500,
    status: "已发布",
    updatedAt: "2024-10-20",
  },
  {
    id: "2",
    name: "雅思核心词汇",
    level: "高级",
    words: 2200,
    status: "草稿",
    updatedAt: "2024-09-18",
  },
  {
    id: "3",
    name: "商务英语精选",
    level: "中级",
    words: 1800,
    status: "已发布",
    updatedAt: "2024-07-31",
  },
];

export default function BooksPage() {
  const stats = useMemo(() => {
    const total = SAMPLE_BOOKS.length;
    const published = SAMPLE_BOOKS.filter((book) => book.status === "已发布")
      .length;
    const words = SAMPLE_BOOKS.reduce((acc, book) => acc + book.words, 0);
    return { total, published, words };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">单词书管理</h1>
          <p className="text-sm text-muted-foreground">
            查看单词书状态、词量以及最近的更新时间。
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
                包含已发布与草稿的全部单词书。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>已发布</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {stats.published}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                当前用户可见的单词书数量。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总词量</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {stats.words.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                当前单词书收录的词汇总数。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>单词书列表</CardTitle>
            <CardDescription>管理词书发布状态与基础信息。</CardDescription>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="搜索单词书..." />
            </div>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              新建单词书
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-t border-border text-sm">
            <thead>
              <tr className="bg-muted/60 text-left">
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium">难度</th>
                <th className="px-4 py-3 font-medium">词汇量</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">最近更新</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_BOOKS.map((book) => (
                <tr key={book.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {book.name}
                  </td>
                  <td className="px-4 py-3">{book.level}</td>
                  <td className="px-4 py-3">{book.words.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cnBadge(
                        book.status === "已发布" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {book.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {book.updatedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function cnBadge(className: string) {
  return `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`;
}

