import { NextResponse } from "next/server"

// API KEYS
const FACT_API_KEY = process.env.NEXT_PUBLIC_FACT_API_KEY!
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!
const FACT_API = process.env.NEXT_PUBLIC_FACT_API!
const GEMINI_API = process.env.NEXT_PUBLIC_GEMINI_API!

export async function POST(request: Request) {

  async function processTextWithGemini(query: string): Promise<string> {
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

    return claim
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

    return JSON.parse(raw)
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

    if (type === "text" || type === "link") {
      if (!query) {
        return NextResponse.json(
          { error: "Query is required" },
          { status: 400 }
        )
      }

      finalClaim = await processTextWithGemini(query)
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

    return NextResponse.json({
      input_type: type,
      extracted_claim: finalClaim,
      fact_check_results: factData,
    })
  } catch (error: any) {
    console.error("API ERROR:", error)
    return NextResponse.json(
      { error: "Fact check failed", details: error.message },
      { status: 500 }
    )
  }
}
