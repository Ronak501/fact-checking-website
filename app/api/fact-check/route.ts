import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { extractGeminiUsage, logUsageEvent } from "@/lib/usage-tracking"

// API KEYS
const FACT_API_KEY = process.env.NEXT_PUBLIC_FACT_API_KEY!
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!
const FACT_API = process.env.NEXT_PUBLIC_FACT_API!
const GEMINI_API = process.env.NEXT_PUBLIC_GEMINI_API!

export async function POST(request: Request) {
  const startedAt = Date.now()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  async function processTextWithGemini(query: string): Promise<{
    claim: string
    usageMetadata?: unknown
  }> {
    const geminiUrl = `${GEMINI_API}?key=${GEMINI_API_KEY}`

    const body = {
      contents: [
        {
          parts: [
            {
              text: `Rewrite the user's message into ONE short, clear, fact-checkable claim.
              RULES:
              - Output ONLY the claim
              - Max 15 words
              - No explanation

              User input: "${query}"

              Return only the claim:`,
            },
          ],
        },
      ],
    }

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    const claim = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!claim) throw new Error("Gemini NLP failed")

    return {
      claim,
      usageMetadata: data.usageMetadata,
    }
  }

  async function processMediaWithGemini(
    file: File,
    type: "image" | "video"
  ): Promise<string> {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const geminiUrl = `${GEMINI_API}?key=${GEMINI_API_KEY}`

    const body = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64,
              },
            },
            {
              text: `Extract ONE clear, factual claim from this ${type}.
              - Output ONLY the claim
              - Max 15 words
              - No explanation`,
            },
          ],
        },
      ],
    }

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    const claim = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!claim) throw new Error("Gemini Vision failed")

    return claim
  }

  async function detectAIGeneratedMedia(
    file: File,
    type: "image" | "video"
  ): Promise<{
    verdict: "AI_GENERATED" | "LIKELY_REAL" | "UNCERTAIN"
    confidence: number
    explanation: string
    usageMetadata?: unknown
  }> {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const geminiUrl = `${GEMINI_API}?key=${GEMINI_API_KEY}`

    const body = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64,
              },
            },
            {
              text: `
  Analyze this ${type} and determine if it is AI-generated.

  RULES:
  - Respond ONLY in JSON
  - Do NOT add markdown
  - Use this exact format:

  {
    "verdict": "AI_GENERATED | LIKELY_REAL | UNCERTAIN",
    "confidence": number (0-100),
    "explanation": string (max 2 sentences)
  }
              `,
            },
          ],
        },
      ],
    }

    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!raw) throw new Error("AI detection failed")

    return {
      ...JSON.parse(raw),
      usageMetadata: data.usageMetadata,
    }
  }

  try {
    const formData = await request.formData()

    const type = formData.get("type") as string
    const query = formData.get("query") as string | null
    const file = formData.get("file") as File | null

    if (!type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      )
    }

    // -----------------------------------
    // 1. HANDLE TEXT / LINK
    // -----------------------------------
    let finalClaim = ""
    let promptTokens = 0
    let completionTokens = 0
    let totalTokens = 0
    let estimated = false

    if (type === "text" || type === "link") {
      if (!query) {
        return NextResponse.json(
          { error: "Query is required" },
          { status: 400 }
        )
      }

      const textResult = await processTextWithGemini(query)
      finalClaim = textResult.claim

      const usage = extractGeminiUsage(textResult.usageMetadata)
      promptTokens += usage.promptTokens
      completionTokens += usage.completionTokens
      totalTokens += usage.totalTokens
      estimated = estimated || usage.estimated
    }

    // -----------------------------------
    // 2. HANDLE IMAGE / VIDEO
    // -----------------------------------
    if (type === "image" || type === "video") {
      if (!file) {
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 }
        )
      }

      const aiDetection = await detectAIGeneratedMedia(file, type)

      const usage = extractGeminiUsage(aiDetection.usageMetadata)
      await logUsageEvent({
        userId: user.id,
        requestType: "fact-check-media",
        model: "gemini-1.5-pro",
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        latencyMs: Date.now() - startedAt,
        status: "success",
        estimated: usage.estimated,
        metadata: {
          inputType: type,
          fileType: file.type,
          fileSize: file.size,
          verdict: aiDetection.verdict,
          confidence: aiDetection.confidence,
        },
      })

      return NextResponse.json({
        input_type: type,
        ai_generated_check: aiDetection,
      })
    }

    // -----------------------------------
    // 3. GOOGLE FACT CHECK API
    // -----------------------------------
    const factUrl = new URL(FACT_API)
    factUrl.searchParams.append("query", finalClaim)
    factUrl.searchParams.append("key", FACT_API_KEY)

    const factResponse = await fetch(factUrl.toString())

    if (!factResponse.ok) {
      throw new Error("Fact Check API failed")
    }

    const factData = await factResponse.json()

    await logUsageEvent({
      userId: user.id,
      requestType: "fact-check-text",
      model: "gemini-1.5-pro",
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs: Date.now() - startedAt,
      status: "success",
      estimated,
      metadata: {
        inputType: type,
        claim: finalClaim,
        factResponseClaims: Array.isArray(factData?.claims)
          ? factData.claims.length
          : 0,
      },
    })

    return NextResponse.json({
      input_type: type,
      extracted_claim: finalClaim,
      fact_check_results: factData,
    })
  } catch (error: any) {
    console.error("API ERROR:", error)

    await logUsageEvent({
      userId: user.id,
      requestType: "fact-check-text",
      model: "gemini-1.5-pro",
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
      { error: "Fact check failed", details: error.message },
      { status: 500 }
    )
  }
}
