import axios from "axios"
import { TtlCache } from "./cache"

const cache = new TtlCache(30 * 1000) // 30 sec

const SYMBOL_MAP: Record<string, string> = {
  RELIANCE: "RELIANCE.NS",
  TCS: "TCS.NS",
  INFY: "INFY.NS",
  HDFCBANK: "HDFCBANK.NS",
  ICICIBANK: "ICICIBANK.NS",
  HDFC: "HDFC.NS",
  SBIN: "SBIN.NS",
  WIPRO: "WIPRO.NS",
  TATAMOTORS: "TATAMOTORS.NS",
  BAJFINANCE: "BAJFINANCE.NS",
}

async function fetchYahoo(ticker: string): Promise<string | null> {
  try {
    const resp = await axios.get("https://query1.finance.yahoo.com/v8/finance/chart/" + ticker, {
      params: { range: "5d", interval: "1d" },
      timeout: 5000,
    })

    const result = resp.data?.chart?.result
    if (!result) return null

    const meta = result.meta
    const quote = result.indicators.quote[0]
    if (!quote?.close?.[0]) return null

    const prices: number[] = quote.close[0].filter((v: unknown) => v !== null && v !== undefined) as number[]
    if (!prices.length) return null

    const current = prices[prices.length - 1]
    const prev = prices.length > 1 ? prices[prices.length - 2] : current
    const change = current - prev
    const changePct = ((change / prev) * 100).toFixed(2)
    const trend = change >= 0 ? "UP" : "DOWN"
    const high = Math.max(...prices)
    const low = Math.min(...prices)

    return (
      `Stock: ${meta.symbol} (${meta.shortName || ticker})\n` +
      `Price: Rs.${current.toFixed(2)} | Change: ${change >= 0 ? "+" : ""}${change.toFixed(2)} (${changePct}%) | Trend: ${trend}\n` +
      `5D High: Rs.${high.toFixed(2)} | 5D Low: Rs.${low.toFixed(2)}`
    )
  } catch {
    return null
  }
}

async function fetchAlphaVantage(ticker: string): Promise<string | null> {
  // Alpha Vantage free tier — no key needed for basic quotes (limited)
  try {
    const resp = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "GLOBAL_QUOTE",
        symbol: SYMBOL_MAP[ticker.toUpperCase()] || `${ticker.toUpperCase()}.NS`,
       apikey: "demo",
      },
      timeout: 5000,
    })
    const quote = resp.data?.["Global Quote"]
    if (!quote) return null

    const price = parseFloat(quote["05. price"])
    const change = parseFloat(quote["09. change"])
    const changePct = parseFloat(quote["10. change percent"].replace("%", ""))

    return (
      `Stock: ${ticker.toUpperCase()}\n` +
      `Price: Rs.${price.toFixed(2)} | Change: ${change >= 0 ? "+" : ""}${change.toFixed(2)} (${changePct}%)`
    )
  } catch {
    return null
  }
}

export async function getStock(symbol: string): Promise<string> {
  const t0 = Date.now()
  console.log(`[tools] stock(symbol=${symbol})`)
  const key = `stock:${symbol.trim().toUpperCase()}`
  const cached = cache.get(key) as string
  if (cached) {
    console.log(`[tools] stock HIT ${Date.now()-t0}ms`)
    return cached
  }

  const ticker = symbol.trim().toUpperCase()

  let result = await fetchYahoo(SYMBOL_MAP[ticker] || `${ticker}.NS`)
  if (result) {
    cache.set(key, result)
    console.log(`[tools] stock OK (yahoo) ${Date.now()-t0}ms`)
    return result
  }

  console.log(`[tools] stock yahoo FAIL, trying AlphaVantage...`)
  result = await fetchAlphaVantage(ticker)
  if (result) {
    cache.set(key, result)
    console.log(`[tools] stock OK (av) ${Date.now()-t0}ms`)
    return result
  }

  console.error(`[tools] stock ERR ${Date.now()-t0}ms no_data`)
  return `[stock] Could not fetch price for "${symbol}". Try a valid NSE/BSE ticker (e.g., RELIANCE, TCS, INFY). APIs may be rate-limited.`
}
