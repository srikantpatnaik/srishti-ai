import React from "react"

export interface CricketMatchData {
  matchId: string
  series: string
  matchType: string
  venue: string
  date: string
  status: "LIVE" | "UPCOMING" | "COMPLETED" | "DELAYED"
  team1: { name: string; short: string; flag?: string; score?: string; overs?: string }
  team2: { name: string; short: string; flag?: string; score?: string; overs?: string }
  result?: string
  toss?: string
  liveScore?: {
    currentInnings: number
    battingTeam: string
    bowlingTeam: string
    runRate: string
    lastWickets: string[]
    recentOvers: string[]
  }
  upcoming?: { tossTime: string; tossResult?: string }
}

interface CricketCardProps {
  data: CricketMatchData
}

const TEAM_COLORS: Record<string, string> = {
  IND: "#1e40af", AUS: "#ca8a04", ENG: "#dc2626", SA: "#16a34a",
  NZ: "#181818", PAK: "#16a34a", SL: "#eab308", BAN: "#16a34a",
  WIFI: "#7c3aed", DEFAULT: "#6b7280",
}

function getTeamColor(short: string): string {
  return TEAM_COLORS[short] || TEAM_COLORS.DEFAULT
}

function StatusBadge({ status }: { status: CricketMatchData["status"] }) {
  const colors: Record<string, string> = {
    LIVE: "bg-red-500/20 text-red-400 border-red-500/30",
    UPCOMING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
    DELAYED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors[status]}`}>
      {status === "LIVE" && <span className="inline-block w-1 h-1 bg-red-400 rounded-full mr-1.5 animate-pulse" />}
      {status}
    </span>
  )
}

function TeamRow({ team, isBatting, showScore }: {
  team: CricketMatchData["team1"]
  isBatting?: boolean
  showScore?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style={{ backgroundColor: getTeamColor(team.short) }}
      >
        {team.short}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#e5e5e5] truncate">{team.name}</span>
          {isBatting && <span className="text-[9px] text-[#60a5fa] font-semibold">BAT</span>}
        </div>
        {showScore && team.score && (
          <span className="text-xs text-[#9ca3af]">{team.score}{team.overs ? ` (${team.overs} ov)` : ""}</span>
        )}
      </div>
    </div>
  )
}

export function CricketCard({ data }: CricketCardProps) {
  const isLive = data.status === "LIVE"
  const isCompleted = data.status === "COMPLETED"
  const isUpcoming = data.status === "UPCOMING"

  return (
    <div
      className="w-full max-w-md mx-auto rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div>
          <span className="text-xs font-semibold text-[#e5e5e5]">{data.series}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#6b7280]">{data.matchType}</span>
            <span className="text-[10px] text-[#4b5563]">•</span>
            <span className="text-[10px] text-[#6b7280]">{data.venue}</span>
          </div>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* Teams */}
      <div className="px-5 py-4 space-y-1">
        <TeamRow team={data.team1} isBatting={isLive && data.liveScore?.battingTeam === data.team1.short} showScore={!!data.team1.score} />
        <TeamRow team={data.team2} isBatting={isLive && data.liveScore?.battingTeam === data.team2.short} showScore={!!data.team2.score} />
      </div>

      {/* Score highlight for live */}
      {isLive && data.liveScore && (
        <>
          <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
          <div className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Batting</span>
                <div className="text-lg font-bold text-[#e5e5e5]">
                  {data.liveScore.battingTeam === data.team1.short ? data.team1.score : data.team2.score}
                </div>
                <span className="text-[10px] text-[#60a5fa]">RR: {data.liveScore.runRate}</span>
              </div>
              {data.liveScore.recentOvers && data.liveScore.recentOvers.length > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Last Over</span>
                  <div className="text-sm font-mono text-[#e5e5e5]">{data.liveScore.recentOvers[data.liveScore.recentOvers.length - 1]}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Result for completed */}
      {isCompleted && data.result && (
        <>
          <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
          <div className="px-5 py-3">
            <div className="text-sm font-semibold text-[#e5e5e5] text-center">{data.result}</div>
          </div>
        </>
      )}

      {/* Upcoming info */}
      {isUpcoming && data.upcoming && (
        <>
          <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
          <div className="px-5 py-3">
            <div className="text-sm text-[#9ca3af] text-center">Toss: {data.upcoming.tossTime}</div>
            {data.upcoming.tossResult && (
              <div className="text-xs text-[#6b7280] text-center mt-1">{data.upcoming.tossResult}</div>
            )}
          </div>
        </>
      )}

      {/* Toss info for live */}
      {data.toss && (
        <>
          <div className="mx-5 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
          <div className="px-5 py-2.5">
            <span className="text-[10px] text-[#6b7280]">{data.toss}</span>
          </div>
        </>
      )}
    </div>
  )
}
