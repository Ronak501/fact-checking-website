"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Search,
  ImageIcon,
  Video,
  Link2,
  FileText,
  LogIn,
  UserPlus,
  Upload,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HeroProps {
  query: string
  setQuery: (query: string) => void
  onSearch: (e: React.FormEvent, type: string, file?: File | null) => void
  loading: boolean
}

export default function Hero({
  query,
  setQuery,
  onSearch,
  loading,
}: HeroProps) {
  const [type, setType] = useState("text")
  const [file, setFile] = useState<File | null>(null)

  const placeholderMap: Record<string, string> = {
    text: "Enter a claim to fact-check...",
    link: "Paste article or social media link...",
  }

  return (
    <div className="min-h-[90vh] flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="w-full px-6 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Welcome to <span className="font-medium text-foreground">FactCheck AI</span>
        </span>

        <div className="flex gap-2">

          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Pricing
            </Link>
          </Button>

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
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-6">
          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold">
              Verify the Truth
            </h1>
            <p className="text-lg text-muted-foreground">
              Fact-check text, images, videos, and links using trusted sources
            </p>
          </div>

          {/* Tabs */}
          <Tabs
            defaultValue="text"
            onValueChange={(val) => {
              setType(val)
              setFile(null)
              setQuery("")
            }}
            className="flex justify-center"
          >
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="text" className="gap-2">
                <FileText className="w-4 h-4" /> Text
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2">
                <ImageIcon className="w-4 h-4" /> Image
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="w-4 h-4" /> Video
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-2">
                <Link2 className="w-4 h-4" /> Link
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Form */}
          <form
            onSubmit={(e) => onSearch(e, type, file)}
            className="space-y-4"
          >
            {(type === "text" || type === "link") && (
              <Input
                type="text"
                placeholder={placeholderMap[type]}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 text-base"
              />
            )}

            {(type === "image" || type === "video") && (
              <label className="border-2 border-dashed rounded-lg p-5 cursor-pointer hover:bg-muted transition block">
                <input
                  type="file"
                  accept={type === "image" ? "image/*" : "video/*"}
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-6 h-6" />
                  <span>
                    {file
                      ? file.name
                      : type === "image"
                      ? "Upload an image"
                      : "Upload a video"}
                  </span>
                </div>
              </label>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={loading || (type !== "text" && type !== "link" && !file)}
            >
              <Search className="w-5 h-5" />
              {loading ? "Checking..." : "Verify"}
            </Button>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-sm">
            <div>
              <div className="text-xl font-bold text-primary">100+</div>
              <p className="text-muted-foreground">Publishers</p>
            </div>
            <div>
              <div className="text-xl font-bold text-primary">AI</div>
              <p className="text-muted-foreground">Multi-modal</p>
            </div>
            <div>
              <div className="text-xl font-bold text-primary">Real-time</div>
              <p className="text-muted-foreground">Results</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
