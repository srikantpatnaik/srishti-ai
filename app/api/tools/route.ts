import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    tools: [
      { name: "weather", endpoint: "/api/tools/weather?city=Delhi", desc: "Get weather for a city" },
      { name: "news", endpoint: "/api/tools/news?category=top&limit=5", desc: "Get news by category" },
      { name: "stock", endpoint: "/api/tools/stock?symbol=RELIANCE", desc: "Get Indian stock price" },
      { name: "train", endpoint: "/api/tools/train?type=number&train=12301", desc: "Get train details" },
      { name: "train_route", endpoint: "/api/tools/train?type=route&from=Delhi&to=Mumbai", desc: "Trains between stations" },
      { name: "cricket", endpoint: "/api/tools/cricket?type=live&match=live", desc: "Live/recent cricket scores" },
      { name: "cricket_schedule", endpoint: "/api/tools/cricket?type=schedule&series=IPL", desc: "Cricket series schedule" },
    ],
  })
}
