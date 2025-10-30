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
  data: {
    claims: Claim[]
  }
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
  if (!data.claims || data.claims.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No fact-checks found for this query.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="text-sm text-muted-foreground">
        Found {data.claims.length} claim{data.claims.length !== 1 ? "s" : ""} to verify
      </div>

      {data.claims.map((claim, claimIndex) => (
        <Card key={claimIndex} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6 space-y-4">
            {/* Claim Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground leading-relaxed">{claim.text}</h3>
              {claim.claimant && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Claimed by:</span> {claim.claimant}
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

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Fact-Check Reviews */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Fact-Check Results</h4>

              {claim.claimReview.map((review, reviewIndex) => (
                <div
                  key={reviewIndex}
                  className="p-4 bg-card border border-border rounded-lg space-y-3 hover:border-primary/50 transition-colors"
                >
                  {/* Publisher Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{review.publisher.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{review.publisher.site}</p>
                      </div>
                    </div>
                    <Badge className={`flex-shrink-0 ${getRatingColor(review.textualRating)}`}>
                      {review.textualRating}
                    </Badge>
                  </div>

                  {/* Review Title */}
                  <a href={review.url} target="_blank" rel="noopener noreferrer" className="block group">
                    <p className="text-sm font-medium text-primary group-hover:underline line-clamp-2">
                      {review.title}
                    </p>
                  </a>

                  {/* Review Date and Link */}
                  <div className="flex items-center justify-between gap-4 pt-2">
                    <p className="text-xs text-muted-foreground">{formatDate(review.reviewDate)}</p>
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Read Full Article
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
