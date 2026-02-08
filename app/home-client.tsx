"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import SearchResults from "@/components/search-results"
import Hero from "@/components/hero"

export default function HomeClient({ todos }: { todos: any[] }) {
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
    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("type", type)
      if (query) formData.append("query", query)
      if (file) formData.append("file", file)

      const res = await fetch("/api/fact-check", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <ul className="mb-6">
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>

      {!results ? (
        <Hero
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          loading={loading}
        />
      ) : (
        <Card>{results && <SearchResults data={results} />}</Card>
      )}
    </main>
  )
}
