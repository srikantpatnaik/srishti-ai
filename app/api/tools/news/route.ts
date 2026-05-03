import { NextResponse } from "next/server"
import { getNews } from "@/lib/tools/news"

export async function GET(req: Request) {
  const t0 = Date.now()
  const url = new URL(req.url)
  const category = url.searchParams.get("category") || "top"
  const limit = parseInt(url.searchParams.get("limit") || "10")
  console.log(`[api] GET /api/tools/news category=${category} limit=${limit}`)

  try {
    const { structured, result } = await getNews(category, limit)
    console.log(`[api] /api/tools/news OK ${Date.now()-t0}ms`)
    return NextResponse.json({ category, limit, structured, result })
  } catch (e: any) {
    console.error(`[api] /api/tools/news ERR ${Date.now()-t0}ms ${e.message}`)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
