import axios from "axios"
import { TtlCache } from "./cache"

const cache = new TtlCache(15 * 60 * 1000) // 15 min

interface GeoResult { lat: number; lon: number; name: string; admin1?: string; country?: string; country_code?: string }

export interface WeatherStructured {
  city: string
  state?: string
  country?: string
  lat: number
  lon: number
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  weatherDescription: string
  aqi: number
  aqiDescription: string
  forecast: { date: string; day: string; min: number; max: number; code: number; description: string }[]
}

const WMO: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
}

const AQI_DATA: Record<number, { label: string; color: string }> = {
  0: { label: "Good", color: "#22c55e" },
  1: { label: "Moderate", color: "#eab308" },
  2: { label: "Unhealthy (Sensitive)", color: "#f97316" },
  3: { label: "Unhealthy", color: "#ef4444" },
  4: { label: "Very Unhealthy", color: "#a855f7" },
  5: { label: "Hazardous", color: "#7f1d1d" },
}

function getAqiInfo(aqi: number): { label: string; color: string } {
  return AQI_DATA[Math.min(aqi, 5)] || { label: "Unknown", color: "#6b7280" }
}

async function getAirQuality(lat: number, lon: number): Promise<{ aqi: number; aqiDescription: string }> {
  try {
    const resp = await axios.get("https://air-quality-api.open-meteo.com/v1/air-quality", {
      params: {
        latitude: lat,
        longitude: lon,
        current: ["european_aqi"],
        timezone: "auto",
      },
      timeout: 5000,
    })
    const aqi = resp.data?.current?.european_aqi ?? 0
    const info = getAqiInfo(Math.round(aqi))
    console.log(`[tools] air_quality aqi=${aqi} ${info.label}`)
    return { aqi: Math.round(aqi), aqiDescription: info.label }
  } catch (e: any) {
    console.warn(`[tools] air_quality ERR ${e.message}`)
    return { aqi: 0, aqiDescription: "N/A" }
  }
}

export async function getRainAnswer(city: string): Promise<string> {
  // Step 1: Geocode city
  let lat = 0, lon = 0
  let displayName = city.trim()
  try {
    const geo = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
      params: { name: city.trim(), count: 1 },
      timeout: 5000,
    })
    if (geo.data?.results?.[0]) {
      lat = geo.data.results[0].latitude
      lon = geo.data.results[0].longitude
      displayName = geo.data.results[0].name || city.trim()
    } else {
      return `[weather] City "${city}" not found.`
    }
  } catch (e: any) {
    return `[weather] Geocoding error: ${e.message}`
  }

  // Step 2: Fetch current weather only
  try {
    const resp = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        current: ["weather_code"],
        timezone: "auto",
      },
      timeout: 5000,
    })

    const code = resp.data.current.weather_code

    // Rain codes: 61-67 (rain), 80-82 (rain showers), 95-99 (thunderstorm)
    if (code >= 61 && code <= 67) return `Yes, it is raining in ${displayName}.`
    if (code >= 80 && code <= 82) return `Yes, it is raining in ${displayName}.`
    if (code >= 95 && code <= 99) return `Yes, it is thundering in ${displayName}.`

    // Drizzle: 51-55
    if (code >= 51 && code <= 55) return `It's drizzling in ${displayName}.`

    return `No, it's not currently raining in ${displayName}.`
  } catch (e: any) {
    return `[weather] Fetch error: ${e.message}`
  }
}

export async function getWeather(city: string): Promise<{ structured: WeatherStructured; result: string }> {
  const t0 = Date.now()
  console.log(`[tools] weather(city=${city})`)
  const key = `weather:${city.trim().toLowerCase()}`
  const cached = cache.get(key)
  if (cached) {
    console.log(`[tools] weather HIT ${Date.now()-t0}ms`)
    return cached as { structured: WeatherStructured; result: string }
  }

  // Step 1: Geocode city
  let lat = 0, lon = 0
  let displayName = city.trim()
  let state = "", country = ""
  try {
    const geo = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
      params: { name: city.trim(), count: 1 },
      timeout: 5000,
    })
    if (geo.data?.results?.[0]) {
      const r = geo.data.results[0]
      lat = r.latitude
      lon = r.longitude
      displayName = r.name || city.trim()
      state = r.admin1 || ""
      country = r.country || ""
    } else {
      return {
        structured: null as any,
        result: `[weather] City "${city}" not found.`,
      }
    }
  } catch (e: any) {
    return { structured: null as any, result: `[weather] Geocoding error: ${e.message}` }
  }

  // Step 2: Fetch weather + air quality in parallel
  let weatherData: any
  let aqiResult: { aqi: number; aqiDescription: string } = { aqi: 0, aqiDescription: "N/A" }

  try {
    const [weatherResp, aqResp] = await Promise.all([
      axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude: lat,
          longitude: lon,
          current: ["temperature_2m","relative_humidity_2m","wind_speed_10m","weather_code"],
          daily: ["temperature_2m_max","temperature_2m_min","weather_code"],
          daily_count: 7,
          timezone: "auto",
        },
        timeout: 5000,
      }),
      getAirQuality(lat, lon),
    ])

    weatherData = weatherResp.data
    aqiResult = aqResp
  } catch (e: any) {
    console.error(`[tools] weather ERR ${Date.now()-t0}ms ${e.message}`)
    return { structured: null as any, result: `[weather] Fetch error: ${e.message}` }
  }

  const d = weatherData
  const cur = d.current
  const daily = d.daily

  const aqiInfo = getAqiInfo(aqiResult.aqi)

  const forecast: WeatherStructured["forecast"] = []
  for (let i = 0; i < daily.time.length && i < 7; i++) {
    forecast.push({
      date: daily.time[i],
      day: new Date(daily.time[i] + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      min: daily.temperature_2m_min[i],
      max: daily.temperature_2m_max[i],
      code: daily.weather_code[i],
      description: WMO[daily.weather_code[i]] || "?",
    })
  }

  const structured: WeatherStructured = {
    city: displayName,
    state,
    country,
    lat,
    lon,
    temperature: cur.temperature_2m,
    humidity: cur.relative_humidity_2m,
    windSpeed: cur.wind_speed_10m,
    weatherCode: cur.weather_code,
    weatherDescription: WMO[cur.weather_code] || "Unknown",
    aqi: aqiResult.aqi,
    aqiDescription: aqiInfo.label,
    forecast,
  }

  // Plain text result (backward compat)
  const lines: string[] = [
    `Weather: ${displayName} (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
    `Current: ${cur.temperature_2m}°C, Humidity: ${cur.relative_humidity_2m}%, Wind: ${cur.wind_speed_10m} km/h, ${WMO[cur.weather_code] || "Unknown"}`,
    `AQI: ${aqiResult.aqi} (${aqiInfo.label})`,
    "",
    "7-Day Forecast:",
  ]
  for (let i = 0; i < daily.time.length && i < 7; i++) {
    lines.push(`  ${new Date(daily.time[i] + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}: ${daily.temperature_2m_min[i]}° / ${daily.temperature_2m_max[i]}°C — ${WMO[daily.weather_code[i]] || "?"}`)
  }
  const result = lines.join("\n")

  cache.set(key, { structured, result })
  console.log(`[tools] weather OK ${Date.now()-t0}ms`)
  return { structured, result }
}
