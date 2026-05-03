import axios from "axios"
import { TtlCache } from "./cache"

const cache = new TtlCache(30 * 60 * 1000) // 30 min

// Rate limiter: 1 req per 1s
let lastRequest = 0
async function rateLimited(fn: () => Promise<string>): Promise<string> {
  const wait = Math.max(0, 1000 - (Date.now() - lastRequest))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastRequest = Date.now()
  return fn()
}

export async function getTrainNumber(trainNumber: string): Promise<string> {
  const t0 = Date.now()
  console.log(`[tools] train_number(train=${trainNumber})`)
  const key = `train:${trainNumber.trim()}`
  const cached = cache.get(key) as string
  if (cached) {
    console.log(`[tools] train_number HIT ${Date.now()-t0}ms`)
    return cached
  }

  return rateLimited(async () => {
    const tn = trainNumber.trim()

    // Try railyapi.in (free, no key needed)
    try {
      const resp = await axios.get(`https://railyapi.in/api/train/trainnumber/${tn}`, { timeout: 8000 })
      const d = resp.data
      if (d.success && d.data) {
        const train = d.data
        const lines = [
          `Train: ${train.train_number} — ${train.train_name}`,
          `Source: ${train.source_station} (${train.source_code})`,
          `Destination: ${train.destination_station} (${train.destination_code})`,
          `Departure: ${train.departure_time} | Arrival: ${train.arrival_time}`,
          `Days: ${train.total_days} | Distance: ${train.total_distance_km} km`,
          `Speed: ${train.average_speed} km/h`,
          "",
          "Stations:",
        ]

        for (const s of (train.stations || [])) {
          lines.push(`  ${s.arrival_time || "--"} → ${s.departure_time || "--"}  ${s.station_name} (${s.station_code}) [day ${s.day}]`)
        }

        const result = lines.join("\n")
        cache.set(key, result)
        console.log(`[tools] train_number OK ${Date.now()-t0}ms (railyapi)`)
        return result
      }
    } catch (e: any) {
      console.log(`[tools] train_number railyapi FAIL: ${e.message}`)
    }

    // Fallback: try another free API
    try {
      const resp = await axios.get(`https://api.railwayapi.com/v2/routes/train/${tn}/apikey/guest/`, { timeout: 8000 })
      const d = resp.data
      if (d.status === "success") {
        const route = d.routes?.[0]
        if (!route) throw new Error("no route data")
        const lines = [
          `Train: ${tn}`,
          `Source: ${route.source.name} (${route.source.code})`,
          `Destination: ${route.destination.name} (${route.destination.code})`,
          `Departure: ${route.departure} | Arrival: ${route.arrival}`,
          `Duration: ${route.duration.hrs} hrs ${route.duration.mins} min`,
          "",
          "Stations:",
        ]
        for (const s of (route.station || [])) {
          lines.push(`  ${s.arrival || "--"} → ${s.deptime || "--"}  ${s.name} (${s.code}) [day ${s.day}]`)
        }
        const result = lines.join("\n")
        cache.set(key, result)
        console.log(`[tools] train_number OK ${Date.now()-t0}ms (railwayapi)`)
        return result
      }
    } catch (e: any) {
      console.log(`[tools] train_number railwayapi FAIL: ${e.message}`)
    }

    console.error(`[tools] train_number ERR ${Date.now()-t0}ms no_data`)
    const result = `[train] Could not fetch details for train ${tn}. Railway APIs may be temporarily unavailable. Try visiting irctc.co.in or raily.info directly.`
    cache.set(key, result)
    return result
  })
}

export async function getTrainRoute(from: string, to: string): Promise<string> {
  const t0 = Date.now()
  console.log(`[tools] train_route(from=${from}, to=${to})`)
  const key = `train_route:${from.trim().toLowerCase()}:${to.trim().toLowerCase()}`
  const cached = cache.get(key) as string
  if (cached) {
    console.log(`[tools] train_route HIT ${Date.now()-t0}ms`)
    return cached
  }

  return rateLimited(async () => {
    const f = from.trim().toUpperCase()
    const t = to.trim().toUpperCase()

    // Try railyapi.in
    try {
      const resp = await axios.get(`https://railyapi.in/api/train/betweenstation/from/${f}/to/${t}`, { timeout: 8000 })
      const d = resp.data
      if (d.success && d.data?.length) {
        const lines = [`Trains: ${f} → ${t}`, ""]
        for (const train of d.data.slice(0, 10)) {
          lines.push(`  ${train.train_number} — ${train.train_name} | Dep: ${train.departure_time} | Arr: ${train.arrival_time} | Duration: ${train.total_duration} | Runs: ${train.runs_on}`)
        }
        const result = lines.join("\n")
        cache.set(key, result)
        console.log(`[tools] train_route OK ${Date.now()-t0}ms (${d.data.length} trains)`)
        return result
      }
    } catch (e: any) {
      console.log(`[tools] train_route railyapi FAIL: ${e.message}`)
    }

    console.error(`[tools] train_route ERR ${Date.now()-t0}ms no_data`)
    const result = `[train_route] Could not find trains from ${from} to ${to}. Railway APIs may be unavailable.`
    cache.set(key, result)
    return result
  })
}
