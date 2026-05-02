import { NextResponse } from "next/server"
import { getWeather, getRainAnswer } from "@/lib/tools/weather"

export async function GET(req: Request) {
  const t0 = Date.now()
  const url = new URL(req.url)
  const city = url.searchParams.get("city") || "Delhi"
  const mode = url.searchParams.get("mode")
  console.log(`[api] GET /api/tools/weather city=${city} mode=${mode}`)

  try {
    if (mode === "rain") {
      const answer = await getRainAnswer(city)
      console.log(`[api] /api/tools/weather rain OK ${Date.now()-t0}ms`)
      return NextResponse.json({ city, answer })
    }
    const { structured, result } = await getWeather(city)
    console.log(`[api] /api/tools/weather OK ${Date.now()-t0}ms`)
    return NextResponse.json({ city, structured, result })
  } catch (e: any) {
    console.error(`[api] /api/tools/weather ERR ${Date.now()-t0}ms ${e.message}`)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
