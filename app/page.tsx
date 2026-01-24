"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import SearchResults from "@/components/search-results"
import Hero from "@/components/hero"

export default function Home() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (
    e: React.FormEvent,
    type: string,
    file?: File | null
  ) => {
    e.preventDefault()

    if ((type === "text" || type === "link") && !query.trim()) return
    if ((type === "image" || type === "video") && !file) return

    setLoading(true)
    setError("")
    setResults(null)

    try {
      const formData = new FormData()
      formData.append("type", type)

      if (query) formData.append("query", query)
      if (file) formData.append("file", file)

      const response = await fetch("/api/fact-check", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch fact-check results")
      }

      setResults(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const resetSearch = () => {
    setResults(null)
    setQuery("")
    setError("")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {!results ? (
        <Hero
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          loading={loading}
        />
      ) : (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold">Fact Check Results</h2>

            <Button variant="outline" onClick={resetSearch} disabled={loading}>
              Search another claim
            </Button>
          </div>

          {error && (
            <Card className="p-4 mb-6 bg-destructive/10 border-destructive/20 text-destructive">
              {error}
            </Card>
          )}

          {results && <SearchResults data={results} />}
        </div>
      )}
    </main>
  )
}
