"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Calendar, Building2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ClaimReview {
  publisher: {
    name: string
    site: string
  }
  url: string
  title: string
  reviewDate: string
  textualRating: string
  languageCode: string
}

interface Claim {
  text: string
  claimant?: string
  claimDate?: string
  claimReview: ClaimReview[]
}

interface SearchResultsProps {
  data: any
}

const getRatingColor = (rating: string) => {
  const lowerRating = rating.toLowerCase()
  if (lowerRating.includes("false") || lowerRating.includes("salah"))
    return "bg-destructive/10 text-destructive border-destructive/20"
  if (lowerRating.includes("true") || lowerRating.includes("benar"))
    return "bg-green-500/10 text-green-700 border-green-500/20"
  if (lowerRating.includes("missing") || lowerRating.includes("partial"))
    return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
  return "bg-muted text-muted-foreground border-border"
}

export default function SearchResults({ data }: SearchResultsProps) {

  // 🔍 AI-GENERATED IMAGE / VIDEO RESULT
  if (data.input_type === "image" || data.input_type === "video") {
    const result = data.ai_generated_check

    return (
      <Card className="p-6 max-w-xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">
          AI-Generated Content Analysis
        </h3>

        <div className="space-y-3">
          <Badge
            className={
              result.verdict === "AI_GENERATED"
                ? "bg-destructive/10 text-destructive"
                : result.verdict === "LIKELY_REAL"
                ? "bg-green-500/10 text-green-700"
                : "bg-yellow-500/10 text-yellow-700"
            }
          >
            {result.verdict.replace("_", " ")}
          </Badge>

          <p className="text-sm text-muted-foreground">
            Confidence: <span className="font-medium">{result.confidence}%</span>
          </p>

          <p className="text-sm">{result.explanation}</p>
        </div>
      </Card>
    )
  }

  // 🔍 FACT-CHECK RESULT (TEXT / LINK)
  const claims = data?.fact_check_results?.claims

  if (!claims || claims.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No fact-checks found for this query.
        </p>
      </Card>
    )
  }
}
