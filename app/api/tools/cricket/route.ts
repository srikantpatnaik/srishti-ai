import { NextResponse } from "next/server"
import { getCricket, getCricketSchedule } from "@/lib/tools/cricket"

export async function GET(req: Request) {
  const t0 = Date.now()
  const url = new URL(req.url)
  const type = url.searchParams.get("type") || "live"
  const matchId = url.searchParams.get("match")
  const series = url.searchParams.get("series")

  if (type === "schedule") {
    console.log(`[api] GET /api/tools/cricket type=schedule series=${series}`)
  } else {
    console.log(`[api] GET /api/tools/cricket type=live match=${matchId}`)
  }

  try {
    if (type === "schedule") {
      if (!series) {
        console.error(`[api] /api/tools/cricket ERR missing series param`)
        return NextResponse.json({ error: "series parameter required for cricket_schedule" }, { status: 400 })
      }
      const { structured, result } = await getCricketSchedule(series)
      console.log(`[api] /api/tools/cricket_schedule OK ${Date.now()-t0}ms`)
      return NextResponse.json({ type: "cricket_schedule", series, structured, result })
    }

    if (!matchId) {
      console.error(`[api] /api/tools/cricket ERR missing match param`)
      return NextResponse.json({ error: "match parameter required for cricket" }, { status: 400 })
    }
    const { structured, result } = await getCricket(matchId)
    console.log(`[api] /api/tools/cricket OK ${Date.now()-t0}ms`)
    return NextResponse.json({ type: "cricket", match: matchId, structured, result })
  } catch (e: any) {
    console.error(`[api] /api/tools/cricket ERR ${Date.now()-t0}ms ${e.message}`)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
