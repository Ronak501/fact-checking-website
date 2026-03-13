import { cn } from "@/lib/utils";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function ChatMessage({
  role,
  content,
  timestamp,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm md:max-w-[75%]",
          isUser
            ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
            : "border border-blue-100 bg-blue-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </p>
        <p
          className={cn(
            "mt-2 text-[10px]",
            isUser ? "text-blue-100" : "text-slate-500 dark:text-slate-400",
          )}
        >
          {timestamp}
        </p>
      </div>
    </div>
  );
}
