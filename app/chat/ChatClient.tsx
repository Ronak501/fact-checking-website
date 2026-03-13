"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Bot,
  ChartNoAxesCombined,
  MessagesSquare,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ChatThread from "@/components/chat-thread";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type UsageSummary = {
  rangeDays: number;
  totals: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requests: number;
    successRate: number;
  };
};

type UserLike = {
  email?: string;
};

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatClient({ user }: { user: UserLike | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const res = await fetch("/api/usage?range=30");
        if (!res.ok) return;
        const data = (await res.json()) as UsageSummary;
        setUsage(data);
      } catch {
        // Keep UI responsive even when usage data is unavailable.
      }
    };

    loadUsage();
  }, []);

  const sendPrompt = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: nowLabel(),
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setPrompt("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmed,
          messages: currentMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(String(data.error ?? "Chat failed"));
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: String(data.message ?? ""),
        timestamp: nowLabel(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data?.usage) {
        setUsage((prev) => {
          if (!prev) {
            return {
              rangeDays: 30,
              totals: {
                promptTokens: Number(data.usage.promptTokens ?? 0),
                completionTokens: Number(data.usage.completionTokens ?? 0),
                totalTokens: Number(data.usage.totalTokens ?? 0),
                requests: 1,
                successRate: 100,
              },
            };
          }

          return {
            ...prev,
            totals: {
              ...prev.totals,
              promptTokens:
                prev.totals.promptTokens + Number(data.usage.promptTokens ?? 0),
              completionTokens:
                prev.totals.completionTokens +
                Number(data.usage.completionTokens ?? 0),
              totalTokens:
                prev.totals.totalTokens + Number(data.usage.totalTokens ?? 0),
              requests: prev.totals.requests + 1,
            },
          };
        });
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_40%),linear-gradient(180deg,#ffffff,#eff6ff)] px-3 py-3 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_40%),linear-gradient(180deg,#05070b,#0a0f1a)] md:px-6 md:py-5">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
        <aside className="hidden rounded-2xl border border-blue-100 bg-white/95 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:flex md:flex-col">
          <Button className="w-full justify-start gap-2" variant="secondary">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>

          <div className="mt-5 space-y-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Workspace
            </p>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/80">
              <p className="font-medium">FactCheck AI</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {user?.email ?? "Unknown user"}
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <Button variant="ghost" asChild className="justify-start gap-2">
              <Link href="/">
                <MessagesSquare className="h-4 w-4" />
                Classic Fact Check
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start gap-2">
              <Link href="/pricing">
                <ChartNoAxesCombined className="h-4 w-4" />
                Pricing
              </Link>
            </Button>
          </div>
        </aside>

        <section className="rounded-2xl border border-blue-100 bg-white/95 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:p-4">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold md:text-base">
                  FactCheck Assistant
                </h1>
                <p className="text-xs text-muted-foreground">
                  Chat-style investigation for claims, links, and media
                  evidence.
                </p>
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              <Card className="gap-1 rounded-lg border-blue-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-muted-foreground">30d Tokens</p>
                <p className="font-semibold">
                  {usage?.totals.totalTokens ?? 0}
                </p>
              </Card>
              <Card className="gap-1 rounded-lg border-blue-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-muted-foreground">Requests</p>
                <p className="font-semibold">{usage?.totals.requests ?? 0}</p>
              </Card>
            </div>
          </header>

          {error && (
            <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <ChatThread messages={messages} loading={loading} />

          <form
            onSubmit={sendPrompt}
            className="mt-3 flex items-end gap-2 rounded-xl border border-blue-100 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask to verify a claim, compare sources, or inspect media authenticity..."
              className="min-h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !prompt.trim()}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
