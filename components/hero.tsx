"use client"

import type React from "react"
import { useState } from "react"
import { Search, ImageIcon, Video, Link2, FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs" 

interface HeroProps {
  query: string
  setQuery: (query: string) => void
  onSearch: (
    e: React.FormEvent,
    type: string,
    file?: File | null
  ) => void
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-8">

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold">
            Verify the Truth
          </h1>
          <p className="text-xl text-muted-foreground">
            Fact-check text, images, videos, and links using trusted sources
          </p>
        </div>

        {/* Toggle Navigation */}
        <Tabs
          defaultValue="text"
          onValueChange={(val) => {
            setType(val)
            setFile(null)
            setQuery("")
          }}
          className="w-full flex justify-center"
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

        {/* Search / Upload Form */}
        <form
          onSubmit={(e) => onSearch(e, type, file)}
          className="flex flex-col gap-4 w-full"
        >

          {/* Text & Link Input */}
          {(type === "text" || type === "link") && (
            <Input
              type="text"
              placeholder={placeholderMap[type]}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
          )}

          {/* Image Upload */}
          {type === "image" && (
            <label className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-6 h-6" />
                <span>
                  {file ? file.name : "Upload an image (PNG, JPG)"}
                </span>
              </div>
            </label>
          )}

          {/* Video Upload */}
          {type === "video" && (
            <label className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted transition">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-6 h-6" />
                <span>
                  {file ? file.name : "Upload a video (MP4, WebM)"}
                </span>
              </div>
            </label>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || (type !== "text" && type !== "link" && !file)}
            size="lg"
            className="gap-2 px-6"
          >
            <Search className="w-5 h-5" />
            {loading ? "Checking..." : "Verify"}
          </Button>
        </form>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div>
            <div className="text-3xl font-bold text-primary">100+</div>
            <p className="text-muted-foreground">Trusted publishers</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">AI Powered</div>
            <p className="text-muted-foreground">Multi-modal verification</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">Real-time</div>
            <p className="text-muted-foreground">Instant results</p>
          </div>
        </div>

      </div>
    </div>
  )
}
