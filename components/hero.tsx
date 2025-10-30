"use client"

import type React from "react"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface HeroProps {
  query: string
  setQuery: (query: string) => void
  onSearch: (e: React.FormEvent) => void
  loading: boolean
}

export default function Hero({ query, setQuery, onSearch, loading }: HeroProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">Verify the Truth</h1>
          <p className="text-xl text-muted-foreground">
            Search claims and get fact-checked results from trusted publishers worldwide
          </p>
        </div>

        <form onSubmit={onSearch} className="flex gap-2 w-full">
          <Input
            type="text"
            placeholder="Enter a claim to fact-check..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 text-base"
            autoFocus
          />
          <Button type="submit" disabled={loading} size="lg" className="gap-2 px-6">
            <Search className="w-5 h-5" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">100+</div>
            <p className="text-muted-foreground">Fact-checking publishers</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">Millions</div>
            <p className="text-muted-foreground">Claims verified</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">Real-time</div>
            <p className="text-muted-foreground">Updated results</p>
          </div>
        </div>
      </div>
    </div>
  )
}
