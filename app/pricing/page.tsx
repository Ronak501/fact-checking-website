"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "For casual fact-checking",
    features: [
      "Text & link fact-checking",
      "Limited daily usage",
      "Basic AI verification",
      "Community sources",
    ],
    cta: "Get Started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹299 / month",
    description: "For researchers & journalists",
    features: [
      "Unlimited fact-checks",
      "Image & video verification",
      "Advanced AI analysis",
      "Trusted publisher sources",
      "Priority processing",
    ],
    cta: "Upgrade to Pro",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations & media houses",
    features: [
      "Everything in Pro",
      "Team access",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    href: "mailto:support@factcheck.ai",
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-14">
        <h1 className="text-4xl md:text-5xl font-bold">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that fits your needs. No hidden fees.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`p-6 flex flex-col justify-between ${
              plan.highlighted
                ? "border-primary shadow-lg scale-105"
                : "border-muted"
            }`}
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="text-3xl font-bold">{plan.price}</div>

              <ul className="space-y-3 pt-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="w-4 h-4 text-primary mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className={`mt-6 ${
                plan.highlighted ? "" : "variant-outline"
              }`}
              asChild
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </Card>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="text-center mt-16 text-sm text-muted-foreground">
        Need help choosing a plan?{" "}
        <Link href="/contact" className="text-primary hover:underline">
          Talk to us
        </Link>
      </div>
    </main>
  )
}
