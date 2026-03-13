import { createClient } from "@/utils/supabase/server"

export type UsageEvent = {
  userId: string
  requestType:
    | "chat"
    | "fact-check-text"
    | "fact-check-media"
    | "video-detection"
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  latencyMs: number
  status: "success" | "error"
  estimated: boolean
  metadata?: Record<string, unknown>
}

export type UsageSummary = {
  rangeDays: number
  totals: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    requests: number
    successRate: number
  }
  daily: Array<{
    day: string
    totalTokens: number
    requests: number
  }>
  recent: Array<{
    id: string
    requestType: string
    totalTokens: number
    status: string
    createdAt: string
    model: string
    latencyMs: number
  }>
}

export function extractGeminiUsage(raw: unknown): {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimated: boolean
} {
  const usage = (raw ?? {}) as {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }

  const promptTokens = Number(usage.promptTokenCount ?? 0)
  const completionTokens = Number(usage.candidatesTokenCount ?? 0)
  const totalTokens = Number(
    usage.totalTokenCount ?? promptTokens + completionTokens,
  )

  if (totalTokens > 0 || promptTokens > 0 || completionTokens > 0) {
    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimated: false,
    }
  }

  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimated: true,
  }
}

export async function logUsageEvent(event: UsageEvent): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from("user_usage_events").insert({
      user_id: event.userId,
      request_type: event.requestType,
      model: event.model,
      prompt_tokens: event.promptTokens,
      completion_tokens: event.completionTokens,
      total_tokens: event.totalTokens,
      latency_ms: event.latencyMs,
      status: event.status,
      estimated: event.estimated,
      metadata: event.metadata ?? {},
    })
  } catch (error) {
    console.error("Usage event logging failed", error)
  }
}

export async function getUsageSummary(
  userId: string,
  rangeDays: number,
): Promise<UsageSummary> {
  const fallback: UsageSummary = {
    rangeDays,
    totals: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requests: 0,
      successRate: 0,
    },
    daily: [],
    recent: [],
  }

  try {
    const supabase = await createClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - rangeDays)

    const { data, error } = await supabase
      .from("user_usage_events")
      .select(
        "id, request_type, model, prompt_tokens, completion_tokens, total_tokens, latency_ms, status, created_at",
      )
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (error || !data) {
      if (error) {
        console.error("Usage summary query failed", error)
      }
      return fallback
    }

    const totals = data.reduce(
      (acc, row) => {
        const promptTokens = Number(row.prompt_tokens ?? 0)
        const completionTokens = Number(row.completion_tokens ?? 0)
        const totalTokens = Number(row.total_tokens ?? 0)

        acc.promptTokens += promptTokens
        acc.completionTokens += completionTokens
        acc.totalTokens += totalTokens
        acc.requests += 1
        if (row.status === "success") {
          acc.successes += 1
        }
        return acc
      },
      {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        requests: 0,
        successes: 0,
      },
    )

    const byDay = new Map<string, { day: string; totalTokens: number; requests: number }>()
    for (const row of data) {
      const createdAt = String(row.created_at)
      const day = createdAt.slice(0, 10)
      const existing = byDay.get(day) ?? { day, totalTokens: 0, requests: 0 }
      existing.totalTokens += Number(row.total_tokens ?? 0)
      existing.requests += 1
      byDay.set(day, existing)
    }

    return {
      rangeDays,
      totals: {
        promptTokens: totals.promptTokens,
        completionTokens: totals.completionTokens,
        totalTokens: totals.totalTokens,
        requests: totals.requests,
        successRate:
          totals.requests > 0
            ? Math.round((totals.successes / totals.requests) * 100)
            : 0,
      },
      daily: Array.from(byDay.values()).sort((a, b) =>
        a.day.localeCompare(b.day),
      ),
      recent: data.slice(0, 20).map((row) => ({
        id: String(row.id),
        requestType: String(row.request_type),
        totalTokens: Number(row.total_tokens ?? 0),
        status: String(row.status),
        createdAt: String(row.created_at),
        model: String(row.model ?? ""),
        latencyMs: Number(row.latency_ms ?? 0),
      })),
    }
  } catch (error) {
    console.error("Usage summary failed", error)
    return fallback
  }
}
