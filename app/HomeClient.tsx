"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import SearchResults from "@/components/search-results";
import Hero from "@/components/hero";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, LogIn, UserPlus, User } from "lucide-react";

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
    <main className="bg-gradient-to-b from-white to-gray-100 px-6 py-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-semibold text-gray-800">FactCheck AI</h1>

          {user && (
            <p className="text-sm text-gray-600">
              Welcome, <span className="font-medium">{user.email}</span>
            </p>
          )}

          <div className="flex gap-2">
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
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </Button>
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
          <div className="flex justify-center">
            <Card className="w-full max-w-2xl p-6 bg-white/70 backdrop-blur-xl border border-gray-200 shadow-md rounded-xl">
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
            <Card className="p-4 bg-white/70 backdrop-blur-lg border border-gray-200 rounded-lg">
              <p className="text-gray-600 animate-pulse text-sm">
                FactCheck AI is analyzing the claim...
              </p>
            </Card>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="mt-4">
            <Card className="p-5 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl shadow">
              <SearchResults data={results} />
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
