"use client";

import type React from "react";
import { useState } from "react";
import {
  Search,
  ImageIcon,
  Video,
  Link2,
  FileText,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HeroProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: (e: React.FormEvent, type: string, file?: File | null) => void;
  loading: boolean;
}

export default function Hero({
  query,
  setQuery,
  onSearch,
  loading,
}: HeroProps) {
  const [type, setType] = useState("text");
  const [file, setFile] = useState<File | null>(null);

  const placeholderMap: Record<string, string> = {
    text: "Enter a claim to fact-check...",
    link: "Paste article or social media link...",
  };

  return (
    <div className="w-full space-y-5">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold">Verify the Truth</h1>

        <p className="text-sm text-muted-foreground">
          Fact-check text, images, videos, and links using trusted sources
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="text"
        onValueChange={(val) => {
          setType(val);
          setFile(null);
          setQuery("");
        }}
        className="flex justify-center"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-sm">
          <TabsTrigger value="text" className="gap-1 text-xs">
            <FileText className="w-3 h-3" /> Text
          </TabsTrigger>

          <TabsTrigger value="image" className="gap-1 text-xs">
            <ImageIcon className="w-3 h-3" /> Image
          </TabsTrigger>

          <TabsTrigger value="video" className="gap-1 text-xs">
            <Video className="w-3 h-3" /> Video
          </TabsTrigger>

          <TabsTrigger value="link" className="gap-1 text-xs">
            <Link2 className="w-3 h-3" /> Link
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Form */}
      <form onSubmit={(e) => onSearch(e, type, file)} className="space-y-3">
        {(type === "text" || type === "link") && (
          <Input
            type="text"
            placeholder={placeholderMap[type]}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10"
          />
        )}

        {(type === "image" || type === "video") && (
          <label className="border border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted transition block">
            <input
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <div className="flex flex-col items-center gap-1 text-muted-foreground text-sm">
              <Upload className="w-5 h-5" />

              <span>
                {file
                  ? file.name
                  : type === "image"
                    ? "Upload image"
                    : "Upload video"}
              </span>
            </div>
          </label>
        )}

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={loading || (type !== "text" && type !== "link" && !file)}
        >
          <Search className="w-4 h-4" />
          {loading ? "Checking..." : "Verify"}
        </Button>
      </form>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 text-xs text-center">
        <div>
          <div className="font-semibold text-primary">100+</div>
          <p className="text-muted-foreground">Publishers</p>
        </div>

        <div>
          <div className="font-semibold text-primary">AI</div>
          <p className="text-muted-foreground">Multi-modal</p>
        </div>

        <div>
          <div className="font-semibold text-primary">Real-time</div>
          <p className="text-muted-foreground">Results</p>
        </div>
      </div>
    </div>
  );
}
