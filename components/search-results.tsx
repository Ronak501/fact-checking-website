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

  // 🔍 IMAGE / VIDEO → AI DETECTION RESULT
  if (data?.input_type === "image" || data?.input_type === "video") {
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

  // 🔍 TEXT / LINK → FACT CHECK RESULT
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

  // ✅ THIS WAS MISSING 👇
  return (
    <div className="space-y-6 pb-12">
      <div className="text-sm text-muted-foreground">
        Found {claims.length} claim{claims.length !== 1 ? "s" : ""}
      </div>

      {claims.map((claim: Claim, claimIndex: number) => (
        <Card
          key={claimIndex}
          className="overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="p-6 space-y-4">
            {/* Claim Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{claim.text}</h3>
              {claim.claimant && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Claimed by:</span>{" "}
                  {claim.claimant}
                </p>
              )}
            </div>

            {/* Claim Date */}
            {claim.claimDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatDate(claim.claimDate)}
              </div>
            )}

            <div className="border-t border-border" />

            {/* Fact-Check Reviews */}
            <div className="space-y-4">
              <h4 className="font-semibold">Fact-Check Results</h4>

              {claim.claimReview.map((review, reviewIndex) => (
                <div
                  key={reviewIndex}
                  className="p-4 bg-card border border-border rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">
                          {review.publisher.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.publisher.site}
                        </p>
                      </div>
                    </div>

                    <Badge className={getRatingColor(review.textualRating)}>
                      {review.textualRating}
                    </Badge>
                  </div>

                  <a
                    href={review.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-primary hover:underline"
                  >
                    {review.title}
                    <ExternalLink className="inline w-3 h-3 ml-1" />
                  </a>

                  <p className="text-xs text-muted-foreground">
                    {formatDate(review.reviewDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
