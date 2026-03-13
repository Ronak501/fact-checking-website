import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getUsageSummary } from "@/lib/usage-tracking"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rangeParam = Number(request.nextUrl.searchParams.get("range") ?? "30")
  const rangeDays = Number.isFinite(rangeParam)
    ? Math.max(1, Math.min(90, Math.floor(rangeParam)))
    : 30

  const summary = await getUsageSummary(user.id, rangeDays)
  return NextResponse.json(summary)
}
