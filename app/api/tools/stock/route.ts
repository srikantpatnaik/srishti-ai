import { NextResponse } from "next/server"
import { getStock } from "@/lib/tools/stock"

export async function GET(req: Request) {
  const t0 = Date.now()
  const url = new URL(req.url)
  const symbol = url.searchParams.get("symbol") || "RELIANCE"
  console.log(`[api] GET /api/tools/stock symbol=${symbol}`)

  try {
    const result = await getStock(symbol)
    console.log(`[api] /api/tools/stock OK ${Date.now()-t0}ms`)
    return NextResponse.json({ symbol, result })
  } catch (e: any) {
    console.error(`[api] /api/tools/stock ERR ${Date.now()-t0}ms ${e.message}`)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
