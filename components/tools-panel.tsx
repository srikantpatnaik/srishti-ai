"use client"

import React, { useState } from "react"
import { CloudSun, Newspaper, TrendingUp, Train, Disc, Loader2, X } from "lucide-react"

interface ToolDef {
  name: string
  label: string
  icon: React.ElementType
  color: string
  gradient: string
  params: Array<{ key: string; label: string; placeholder: string; default: string }>
}

const TOOLS: ToolDef[] = [
  {
    name: "weather",
    label: "Weather",
    icon: CloudSun,
    color: "#38bdf8",
    gradient: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
    params: [{ key: "city", label: "City", placeholder: "Delhi", default: "Delhi" }],
  },
  {
    name: "news",
    label: "News",
    icon: Newspaper,
    color: "#f472b6",
    gradient: "linear-gradient(135deg, #f472b6 0%, #fb923c 100%)",
    params: [
      { key: "category", label: "Category", placeholder: "top", default: "top" },
      { key: "limit", label: "Limit", placeholder: "5", default: "5" },
    ],
  },
  {
    name: "stock",
    label: "Stock",
    icon: TrendingUp,
    color: "#4ade80",
    gradient: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)",
    params: [{ key: "symbol", label: "Symbol", placeholder: "RELIANCE", default: "RELIANCE" }],
  },
  {
    name: "train",
    label: "Train",
    icon: Train,
    color: "#fbbf24",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
    params: [
      { key: "type", label: "Type", placeholder: "number", default: "number" },
      { key: "train", label: "Train No.", placeholder: "12301", default: "12301" },
      { key: "from", label: "From", placeholder: "Delhi", default: "" },
      { key: "to", label: "To", placeholder: "Mumbai", default: "" },
    ],
  },
  {
    name: "cricket",
    label: "Cricket",
    icon: Disc,
    color: "#a78bfa",
    gradient: "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)",
    params: [
      { key: "type", label: "Type", placeholder: "live", default: "live" },
      { key: "match", label: "Match ID", placeholder: "live", default: "live" },
      { key: "series", label: "Series", placeholder: "IPL", default: "" },
    ],
  },
]

export function ToolsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})

  const currentTool = activeTool

  const handleRun = async () => {
    if (!currentTool) return
    setLoading(true)
    setResult(null)

    const qs = new URLSearchParams()
    for (const p of currentTool.params) {
      const val = params[p.key] || p.default
      if (val) qs.set(p.key, val)
    }

    try {
      const resp = await fetch(`/api/tools/${currentTool.name}?${qs}`)
      const data = await resp.json()
      setResult(data.result || data.error || "No result")
    } catch (e: any) {
      setResult(`[error] ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setActiveTool(null)
    setResult(null)
    setParams({})
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a]/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {currentTool ? (
            <>
              <button onClick={handleBack} className="text-gray-400 hover:text-white text-sm">
                ← Back
              </button>
              <span className="text-gray-500">/</span>
              <span className="text-sm font-medium text-gray-200">{currentTool.label}</span>
            </>
          ) : (
            <h2 className="text-lg font-semibold text-gray-100">Tools</h2>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!currentTool ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {TOOLS.map(tool => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.name}
                  onClick={() => {
                    setActiveTool(tool)
                    setParams({})
                    setResult(null)
                  }}
                  className="group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                    style={{ background: tool.gradient }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-300">{tool.label}</div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-4 space-y-4 max-w-lg mx-auto">
            <div className="space-y-3">
              {currentTool.params.map(p => (
                <div key={p.key}>
                  <label className="text-xs text-gray-400 block mb-1">{p.label}</label>
                  <input
                    type="text"
                    value={params[p.key] || p.default || ""}
                    onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                    placeholder={p.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ background: currentTool.gradient }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </span>
              ) : (
                "Run"
              )}
            </button>

            {result && (
              <div
                className="rounded-lg p-4 text-sm whitespace-pre-wrap border"
                style={{
                  background: result.startsWith("[error]")
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(255,255,255,0.03)",
                  borderColor: result.startsWith("[error]")
                    ? "rgba(239,68,68,0.3)"
                    : "rgba(255,255,255,0.1)",
                  color: result.startsWith("[error]") ? "#fca5a5" : "#d4d4d4",
                }}
              >
                {result}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
