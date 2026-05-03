import { NextResponse } from "next/server"
import { getTrainNumber, getTrainRoute } from "@/lib/tools/train"

export async function GET(req: Request) {
  const t0 = Date.now()
  const url = new URL(req.url)
  const type = url.searchParams.get("type") || "number"
  const trainNumber = url.searchParams.get("train")
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")

  if (type === "route") {
    console.log(`[api] GET /api/tools/train type=train_route from=${from} to=${to}`)
  } else {
    console.log(`[api] GET /api/tools/train type=number train=${trainNumber}`)
  }

  try {
    let result: string

    if (type === "route") {
      if (!from || !to) {
        console.error(`[api] /api/tools/train ERR missing params`)
        return NextResponse.json({ error: "Both 'from' and 'to' required for train_route" }, { status: 400 })
      }
      result = await getTrainRoute(from, to)
      console.log(`[api] /api/tools/train_route OK ${Date.now()-t0}ms`)
      return NextResponse.json({ type: "train_route", from, to, result })
    }

    if (!trainNumber) {
      console.error(`[api] /api/tools/train ERR missing train param`)
      return NextResponse.json({ error: "train parameter required" }, { status: 400 })
    }
    result = await getTrainNumber(trainNumber)
    console.log(`[api] /api/tools/train_number OK ${Date.now()-t0}ms`)
    return NextResponse.json({ type: "train_number", train: trainNumber, result })
  } catch (e: any) {
    console.error(`[api] /api/tools/train ERR ${Date.now()-t0}ms ${e.message}`)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
