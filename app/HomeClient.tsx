"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import SearchResults from "@/components/search-results";
import Hero from "@/components/hero";
import ThemeToggle from "../components/theme-toggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  LogIn,
  UserPlus,
  User,
  MessageSquare,
} from "lucide-react";

export default function HomeClient({ user }: { user: any }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (
    e: React.FormEvent,
    type: string,
    file?: File | null,
  ) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("type", type);
      if (query) formData.append("query", query);
      if (file) formData.append("file", file);

      const res = await fetch("/api/fact-check", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_45%),linear-gradient(180deg,#ffffff,#eff6ff)] px-4 py-4 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_40%),linear-gradient(180deg,#05070b,#0a0f1a)] md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl flex-col">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-2 rounded-xl border border-blue-100 bg-white/90 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            FactCheck AI
          </h1>

          {user && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Welcome, <span className="font-medium">{user.email}</span>
            </p>
          )}

          <div className="flex gap-2">
            <ThemeToggle />

            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Pricing
              </Link>
            </Button>

            {!user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login" className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                </Button>

                <Button size="sm" asChild>
                  <Link href="/signup" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/chat" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-300 text-red-600 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Hero Section */}
        {!results && (
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-3xl rounded-2xl border border-blue-100 bg-white/95 p-6 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 md:p-8">
              <Hero
                query={query}
                setQuery={setQuery}
                onSearch={handleSearch}
                loading={loading}
              />
            </Card>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center mt-4">
            <Card className="rounded-lg border border-blue-100 bg-white/90 p-4 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
              <p className="animate-pulse text-sm text-slate-600 dark:text-slate-300">
                FactCheck AI is analyzing the claim...
              </p>
            </Card>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-4 flex-1">
            <Card className="rounded-xl border border-blue-100 bg-white/95 p-5 shadow dark:border-slate-800 dark:bg-slate-950/80">
              <SearchResults data={results} />
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
