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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Heading */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
          Verify the Truth
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">
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
        <TabsList className="grid w-full max-w-md grid-cols-4 rounded-xl border border-blue-100 bg-blue-50/80 p-1 dark:border-slate-800 dark:bg-slate-900/80">
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
      <form onSubmit={(e) => onSearch(e, type, file)} className="space-y-4">
        {(type === "text" || type === "link") && (
          <div className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-2xl border border-blue-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Input
              type="text"
              placeholder={placeholderMap[type]}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              className="gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              disabled={loading}
            >
              <Search className="h-4 w-4" />
              {loading ? "Checking..." : "Verify"}
            </Button>
          </div>
        )}

        {(type === "image" || type === "video") && (
          <label className="mx-auto block w-full max-w-xl cursor-pointer rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5 transition hover:bg-blue-100/70 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
            <input
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <div className="flex flex-col items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
              <Upload className="h-5 w-5" />

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

        {(type === "image" || type === "video") && (
          <Button
            type="submit"
            className="mx-auto flex w-full max-w-xl gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            disabled={loading || !file}
          >
            <Search className="w-4 h-4" />
            {loading ? "Checking..." : "Verify"}
          </Button>
        )}
      </form>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="font-semibold text-blue-700 dark:text-blue-300">
            100+
          </div>
          <p className="text-slate-600 dark:text-slate-400">Publishers</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="font-semibold text-blue-700 dark:text-blue-300">
            AI
          </div>
          <p className="text-slate-600 dark:text-slate-400">Multi-modal</p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="font-semibold text-blue-700 dark:text-blue-300">
            Real-time
          </div>
          <p className="text-slate-600 dark:text-slate-400">Results</p>
        </div>
      </div>
    </div>
  );
}
