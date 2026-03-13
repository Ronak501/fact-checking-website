"use client";

import { useEffect, useRef } from "react";
import ChatMessage from "@/components/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type ChatThreadProps = {
  messages: Message[];
  loading: boolean;
};

export default function ChatThread({ messages, loading }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  return (
    <ScrollArea className="h-[calc(100vh-260px)] w-full rounded-xl border border-blue-100 bg-white dark:border-slate-800 dark:bg-slate-900/80">
      <div className="space-y-4 p-4 md:p-6">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/70 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Ask for claim checks, source verification, media authenticity, or a
            summary of findings.
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
