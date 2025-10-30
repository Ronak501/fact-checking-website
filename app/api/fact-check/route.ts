import { type NextRequest, NextResponse } from "next/server"

const GOOGLE_API_KEY = "AIzaSyATm3waKotHFsyylcZ7mypGLKrBRTsw6vs";
const API_ENDPOINT = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const url = new URL(API_ENDPOINT)
    url.searchParams.append("query", query)
    url.searchParams.append("key", GOOGLE_API_KEY)

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Fact-check API error:", error)
    return NextResponse.json({ error: "Failed to fetch fact-check results" }, { status: 500 })
  }
}
