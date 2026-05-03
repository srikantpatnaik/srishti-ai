import axios from "axios"
import { TtlCache } from "./cache"

const cache = new TtlCache(10 * 1000) // 10 sec

export interface CricketStructured {
  series: string
  matchType: string
  venue: string
  date: string
  status: "LIVE" | "UPCOMING" | "COMPLETED" | "SCHEDULED"
  team1: { name: string; short: string; score?: string; overs?: string }
  team2: { name: string; short: string; score?: string; overs?: string }
  result?: string
  toss?: string
}

export async function getCricket(matchId: string): Promise<{ structured: CricketStructured; result: string }> {
  const t0 = Date.now()
  console.log(`[tools] cricket(match=${matchId})`)
  const key = `cricket:${matchId.trim().toLowerCase()}`
  const cached = cache.get(key) as { structured: CricketStructured; result: string }
  if (cached) {
    console.log(`[tools] cricket HIT ${Date.now()-t0}ms`)
    return cached
  }

  const mid = matchId.trim().toLowerCase()

  try {
    const resp = await axios.get("https://cricsheet.org/api/v1/matches/", { timeout: 8000 })
    if (resp.status === 200) {
      const allMatches: any[] = resp.data
      let target: any = null

      if (mid === "live") {
        target = allMatches.slice(-5).reverse()
      } else {
        const numId = parseInt(mid)
        if (!isNaN(numId)) {
          target = allMatches.filter((m: any) => m.id === numId)
        } else {
          target = allMatches.filter((m: any) => {
            const t1 = (m.team1 || "").toLowerCase()
            const t2 = (m.team2 || "").toLowerCase()
            return t1.includes(mid) || t2.includes(mid)
          })
        }
      }

      if (target && target.length > 0) {
        const items = Array.isArray(target) ? target : [target]
        // Return the most relevant match
        const m = items[0]
        const team1 = m.team1 || "?"
        const team2 = m.team2 || "?"
        const venue = m.venue || "?"
        const date = m.date ? new Date(m.date).toLocaleDateString("en-IN") : "?"
        const series = m.series || "?"
        const matchType = m.format ? `${m.format} ${m.format}` : "T20"

        const structured: CricketStructured = {
          series,
          matchType,
          venue,
          date,
          status: m.result ? "COMPLETED" : "SCHEDULED",
          team1: { name: team1, short: team1.substring(0, 3).toUpperCase() },
          team2: { name: team2, short: team2.substring(0, 3).toUpperCase() },
          result: m.result || undefined,
          toss: m.tossWinner ? `Toss: ${m.tossWinner} won, elected to ${m.tossDecision}` : undefined,
        }

        const lines = [`Cricket: ${team1} vs ${team2}`, `Series: ${series}`, `Venue: ${venue}`, `Date: ${date}`]
        if (m.result) lines.push(`Result: ${m.result}`)
        if (m.tossWinner) lines.push(`Toss: ${m.tossWinner} won, elected to ${m.tossDecision}`)

        const resultStr = lines.join("\n")
        const out = { structured, result: resultStr }
        cache.set(key, out)
        console.log(`[tools] cricket OK ${Date.now()-t0}ms`)
        return out
      }
    }
  } catch (e: any) {
    console.log(`[tools] cricket cricsheet FAIL: ${e.message}`)
  }

  console.error(`[tools] cricket ERR ${Date.now()-t0}ms no_data`)
  const errStr = `[cricket] Live scores unavailable. Cricket sites block automated access. Try visiting cricbuzz.com or espncricinfo.com directly.`
  const errStructured: CricketStructured = {
    series: "", matchType: "", venue: "", date: "", status: "SCHEDULED",
    team1: { name: "?", short: "?" }, team2: { name: "?", short: "?" },
  }
  cache.set(key, { structured: errStructured, result: errStr })
  return { structured: errStructured, result: errStr }
}

export async function getCricketSchedule(seriesName: string): Promise<{ structured: CricketStructured[]; result: string }> {
  const t0 = Date.now()
  console.log(`[tools] cricket_schedule(series=${seriesName})`)
  const key = `cricket_schedule:${seriesName.trim().toLowerCase()}`
  const cached = cache.get(key) as { structured: CricketStructured[]; result: string }
  if (cached) {
    console.log(`[tools] cricket_schedule HIT ${Date.now()-t0}ms`)
    return cached
  }

  try {
    const resp = await axios.get("https://cricsheet.org/api/v1/series/", { timeout: 8000 })
    if (resp.status === 200) {
      const allSeries: any[] = resp.data
      const series = allSeries.find((s: any) => seriesName.trim().toLowerCase() === s.name.toLowerCase())

      if (series) {
        const matches = series.matches || []
        const structured: CricketStructured[] = matches.slice(0, 20).map((m: any) => ({
          series: series.name,
          matchType: m.format ? `${m.format} ${m.format}` : "T20",
          venue: m.venue || "?",
          date: m.date ? new Date(m.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "?",
          status: "SCHEDULED",
          team1: { name: m.team1 || "?", short: (m.team1 || "?").substring(0, 3).toUpperCase() },
          team2: { name: m.team2 || "?", short: (m.team2 || "?").substring(0, 3).toUpperCase() },
        }))

        const lines = [`Cricket Schedule: ${series.name}`, ""]
        structured.forEach((s, i) => {
          lines.push(`${i + 1}. ${s.date} | ${s.team1.name} vs ${s.team2.name} | ${s.venue}`)
        })
        if (lines.length === 2) lines.push("  No matches found.")

        const resultStr = lines.join("\n")
        const out = { structured, result: resultStr }
        cache.set(key, out)
        console.log(`[tools] cricket_schedule OK ${Date.now()-t0}ms (${matches.length} matches)`)
        return out
      }
    }
  } catch (e: any) {
    console.log(`[tools] cricket_schedule cricsheet FAIL: ${e.message}`)
  }

  console.error(`[tools] cricket_schedule ERR ${Date.now()-t0}ms no_data`)
  const errStr = `[cricket_schedule] Schedule unavailable for "${seriesName}". Cricket APIs may be down.`
  cache.set(key, { structured: [], result: errStr })
  return { structured: [], result: errStr }
}
