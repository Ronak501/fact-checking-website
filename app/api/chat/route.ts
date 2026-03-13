import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/utils/supabase/server"
import { extractGeminiUsage, logUsageEvent } from "@/lib/usage-tracking"

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-1.5-pro"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Missing Gemini API key" },
      { status: 500 },
    )
  }

  try {
    const body = (await request.json()) as {
      prompt?: string
      messages?: ChatMessage[]
    }

    const prompt = String(body.prompt ?? "").trim()
    const messages = Array.isArray(body.messages) ? body.messages : []

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const historyText = messages
      .slice(-10)
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n")

    const finalPrompt = [
      "You are FactCheck AI assistant.",
      "Be concise, factual, and transparent about uncertainty.",
      historyText ? `Conversation:\n${historyText}` : "",
      `USER: ${prompt}`,
    ]
      .filter(Boolean)
      .join("\n\n")

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL })
    const result = await model.generateContent(finalPrompt)

    const response = result.response
    const text = response.text()
    const usage = extractGeminiUsage((response as unknown as { usageMetadata?: unknown }).usageMetadata)

    await logUsageEvent({
      userId: user.id,
      requestType: "chat",
      model: CHAT_MODEL,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      latencyMs: Date.now() - startedAt,
      status: "success",
      estimated: usage.estimated,
      metadata: {
        historyCount: messages.length,
      },
    })

    return NextResponse.json({
      message: text,
      usage,
    })
  } catch (error: any) {
    await logUsageEvent({
      userId: user.id,
      requestType: "chat",
      model: CHAT_MODEL,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: Date.now() - startedAt,
      status: "error",
      estimated: true,
      metadata: {
        error: String(error?.message ?? "Unknown error"),
      },
    })

    return NextResponse.json(
      { error: "Chat request failed" },
      { status: 500 },
    )
  }
}
