"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import SearchResults from "@/components/search-results"
import Hero from "@/components/hero"

export default function Home() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError("")
    setResults(null)

    try {
      const response = await fetch("/api/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch fact-check results")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {!results ? (
        <Hero query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for claims to verify..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="gap-2">
                <Search className="w-4 h-4" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </form>
          </div>

          {error && <Card className="p-4 bg-destructive/10 border-destructive/20 text-destructive">{error}</Card>}

          {results && <SearchResults data={results} />}
        </div>
      )}
    </main>
  )
}
