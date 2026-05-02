import React, { useState, useEffect, useCallback } from "react"

export interface WeatherCardData {
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

interface WeatherCardProps {
  data: WeatherCardData
  refreshKey?: number
}

// AQI color mapping
const AQI_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", label: "Good" },
  1: { bg: "rgba(234,179,8,0.15)", text: "#eab308", label: "Moderate" },
  2: { bg: "rgba(249,115,22,0.15)", text: "#f97316", label: "Unhealthy (Sensitive)" },
  3: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "Unhealthy" },
  4: { bg: "rgba(168,85,247,0.15)", text: "#a855f7", label: "Very Unhealthy" },
  5: { bg: "rgba(127,29,29,0.15)", text: "#dc2626", label: "Hazardous" },
}

function getAqiColor(aqi: number) {
  return AQI_COLORS[Math.min(aqi, 5)] || { bg: "rgba(107,114,128,0.15)", text: "#6b7280", label: "N/A" }
}

// Small sun/moon icon for day/night indicator
function DayNightIcon({ isDay }: { isDay: boolean }) {
  if (isDay) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="4" fill="#fbbf24" />
        <g stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1={10 + 6 * Math.cos(angle * Math.PI / 180)}
              y1={10 + 6 * Math.sin(angle * Math.PI / 180)}
              x2={10 + 8 * Math.cos(angle * Math.PI / 180)}
              y2={10 + 8 * Math.sin(angle * Math.PI / 180)}
            />
          ))}
        </g>
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14 11.5A7 7 0 0 1 8.5 6 7 7 0 1 0 14 11.5Z" fill="#94a3b8" />
    </svg>
  )
}

// Large animated day/night sky icon
function SkyIcon({ isDay, size = 80 }: { isDay: boolean; size?: number }) {
  const s = size
  if (isDay) {
    // Large rotating sun
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
        <defs>
          <radialGradient id="sky-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
        <circle cx="40" cy="40" r="18" fill="url(#sky-sun)" />
        <g style={{ animation: "spin-slow 15s linear infinite", transformOrigin: "40px 40px" }}>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
            <line
              key={i}
              x1={40 + 22 * Math.cos(angle * Math.PI / 180)}
              y1={40 + 22 * Math.sin(angle * Math.PI / 180)}
              x2={40 + 32 * Math.cos(angle * Math.PI / 180)}
              y2={40 + 32 * Math.sin(angle * Math.PI / 180)}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    )
  }
  // Large pulsing moon
  return (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
      <g style={{ animation: "moon-glow 4s ease-in-out infinite" }}>
        <circle cx="40" cy="40" r="36" fill="rgba(148,163,184,0.05)" />
        <path d="M50 20A22 22 0 0 1 28 52 22 22 0 1 0 50 20Z" fill="#cbd5e1" />
        <circle cx="34" cy="30" r="3" fill="rgba(148,163,184,0.3)" />
        <circle cx="42" cy="44" r="2" fill="rgba(148,163,184,0.3)" />
        <circle cx="36" cy="48" r="1.5" fill="rgba(148,163,184,0.3)" />
      </g>
    </svg>
  )
}

// Weather icon SVGs with animations
function WeatherIcon({ code, size = 80 }: { code: number; size?: number }) {
  const s = size

  if (code === 0 || code === 1) {
    // Sun with rotating rays
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
        <defs>
          <radialGradient id={`sg-${code}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
        <circle cx="40" cy="40" r="16" fill={`url(#sg-${code})`} />
        <g style={{ animation: "spin-slow 20s linear infinite", transformOrigin: "40px 40px" }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1={40 + 22 * Math.cos(angle * Math.PI / 180)}
              y1={40 + 22 * Math.sin(angle * Math.PI / 180)}
              x2={40 + 30 * Math.cos(angle * Math.PI / 180)}
              y2={40 + 30 * Math.sin(angle * Math.PI / 180)}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
    )
  }

  if (code === 2 || code === 3) {
    // Sun behind cloud
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
        <circle cx="30" cy="34" r="10" fill="#fbbf24" opacity="0.8" />
        <g style={{ animation: "spin-slow 25s linear infinite", transformOrigin: "30px 34px" }}>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <line
              key={i}
              x1={30 + 14 * Math.cos(angle * Math.PI / 180)}
              y1={34 + 14 * Math.sin(angle * Math.PI / 180)}
              x2={30 + 18 * Math.cos(angle * Math.PI / 180)}
              y2={34 + 18 * Math.sin(angle * Math.PI / 180)}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
          ))}
        </g>
        <path
          d="M24 52 Q24 42 34 42 Q36 34 46 34 Q56 34 58 42 Q68 42 68 52 Q68 58 62 58 L30 58 Q24 58 24 52Z"
          fill="#e5e7eb"
          stroke="#d1d5db"
          strokeWidth="1"
          style={{ animation: "cloud-drift 8s ease-in-out infinite" }}
        />
      </svg>
    )
  }

  if (code === 45 || code === 48) {
    // Fog
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
        {[20, 32, 44, 56].map((y, i) => (
          <line
            key={i}
            x1={15 + i * 3}
            y1={y}
            x2={65 - i * 3}
            y2={y}
            stroke="#9ca3af"
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              animation: `fog-pulse ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </svg>
    )
  }

  if (code >= 51 && code <= 67) {
    // Rain
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
        <path
          d="M22 40 Q22 32 30 32 Q32 26 40 26 Q48 26 50 32 Q58 32 58 40 Q58 44 54 44 L26 44 Q22 44 22 40Z"
          fill="#9ca3af"
          stroke="#6b7280"
          strokeWidth="1"
        />
        {[28, 38, 48, 33, 43].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={48}
            x2={x - 2}
            y2={56 + (i % 3) * 4}
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              animation: `rain-fall ${0.6 + i * 0.1}s linear infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </svg>
    )
  }

  if (code >= 71 && code <= 82) {
    // Snow
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
        <path
          d="M22 38 Q22 30 30 30 Q32 24 40 24 Q48 24 50 30 Q58 30 58 38 Q58 42 54 42 L26 42 Q22 42 22 38Z"
          fill="#d1d5db"
          stroke="#9ca3af"
          strokeWidth="1"
        />
        {[28, 36, 44, 32, 40, 48].map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={48 + (i % 3) * 5}
            r="2"
            fill="white"
            style={{
              animation: `snow-fall ${1.2 + i * 0.15}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </svg>
    )
  }

  if (code >= 95) {
    // Thunderstorm
    return (
      <svg width={s} height={s} viewBox="0 0 80 80" fill="none">
        <path
          d="M20 36 Q20 28 28 28 Q30 22 38 22 Q46 22 48 28 Q56 28 56 36 Q56 40 52 40 L24 40 Q20 40 20 36Z"
          fill="#6b7280"
          stroke="#4b5563"
          strokeWidth="1"
        />
        <polygon
          points="42,42 36,56 42,56 38,70 50,52 44,52 48,42"
          fill="#fbbf24"
          style={{ animation: "lightning-flash 2s ease-in-out infinite" }}
        />
      </svg>
    )
  }

  // Default: question mark
  return (
    <svg width={s} height={s} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="30" fill="none" stroke="#6b7280" strokeWidth="2" strokeDasharray="4 4" />
      <text x="40" y="48" textAnchor="middle" fill="#6b7280" fontSize="24" fontFamily="sans-serif">?</text>
    </svg>
  )
}

// AQI gauge
function AqiGauge({ aqi, color }: { aqi: number; color: string }) {
  const pct = Math.min((aqi / 5) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{aqi}</span>
    </div>
  )
}

// Forecast mini card
function ForecastMini({ day }: { day: WeatherCardData["forecast"][0] }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
      style={{ background: "rgba(255,255,255,0.05)", minWidth: "70px" }}
    >
      <span className="text-xs text-[#9ca3af]">{day.day.split(",")[0]}</span>
      <WeatherIcon code={day.code} size={28} />
      <span className="text-xs font-semibold text-[#e5e5e5]">{day.max}°</span>
      <span className="text-xs text-[#6b7280]">{day.min}°</span>
    </div>
  )
}

function toIST(date: Date): string {
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })
}

function isDaytime(): boolean {
  const ist = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  const hour = new Date(ist).getHours()
  return hour >= 6 && hour < 18
}

function useWeatherRefresh(refreshKey?: number) {
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    setLastUpdated(new Date())
  }, [refreshKey])

  useEffect(() => {
    const iv = setInterval(() => setLastUpdated(new Date()), 60000)
    return () => clearInterval(iv)
  }, [])

  return lastUpdated
}

export function WeatherCard({ data, refreshKey }: WeatherCardProps) {
  const lastUpdated = useWeatherRefresh(refreshKey)
  const aqiColor = getAqiColor(data.aqi)
  const day = isDaytime()

  return (
    <div
      className="w-full max-w-md mx-auto rounded-2xl overflow-hidden"
      style={{
        background: day
          ? "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))"
          : "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,27,75,0.85))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset",
      }}
    >
      {/* Header with icon */}
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {(data.weatherCode === 0 || data.weatherCode === 1)
              ? (day ? <SkyIcon isDay={true} size={72} /> : <SkyIcon isDay={false} size={72} />)
              : <WeatherIcon code={data.weatherCode} size={72} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#e5e5e5] truncate">{data.city}</h3>
            {(data.state || data.country) && (
              <p className="text-xs text-[#4b5563] mt-0.5">
                {data.state && data.country ? `${data.state}, ${data.country}` : data.state || data.country}
              </p>
            )}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-light text-[#f0f0f0]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {Math.round(data.temperature)}°
              </span>
              <span className="text-sm text-[#9ca3af]">Celsius</span>
            </div>
            <p className="text-xs text-[#6b7280] mt-1">{data.weatherDescription}</p>
          </div>
        </div>
        <DayNightIcon isDay={day} />
      </div>

      {/* Last updated */}
      <div className="px-5 pb-2">
        <span className="text-[10px] text-[#4b5563]">Last updated: {toIST(lastUpdated)} IST</span>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-0">
        <div className="flex flex-col items-center py-4 px-2">
          <span className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Humidity</span>
          <span className="text-xl font-semibold text-[#e5e5e5]">{data.humidity}%</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-1">
            <path d="M8 2 C8 2 4 7 4 10 C4 12.2 5.8 14 8 14 C10.2 14 12 12.2 12 10 C12 7 8 2 8 2Z" fill="#60a5fa" opacity="0.7" />
          </svg>
        </div>
        <div className="flex flex-col items-center py-4 px-2 border-l border-r" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <span className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Wind</span>
          <span className="text-xl font-semibold text-[#e5e5e5]">{data.windSpeed}</span>
          <span className="text-[10px] text-[#6b7280]">km/h</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-1">
            <path d="M2 8h8M10 6l2 2-2 2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex flex-col items-center py-4 px-2">
          <span className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">AQI</span>
          <span className="text-xl font-semibold" style={{ color: aqiColor.text }}>{data.aqi}</span>
          <span className="text-[10px]" style={{ color: aqiColor.text }}>{aqiColor.label}</span>
          <AqiGauge aqi={data.aqi} color={aqiColor.text} />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />

      {/* Forecast strip */}
      {data.forecast.length > 0 && (
        <div className="p-4">
          <span className="text-xs text-[#6b7280] uppercase tracking-wider">Forecast</span>
          <div className="flex gap-2 mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {data.forecast.slice(0, 5).map((day, i) => (
              <ForecastMini key={i} day={day} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
