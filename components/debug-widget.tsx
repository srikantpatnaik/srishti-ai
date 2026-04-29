"use client"

import { useState, useEffect } from "react"
import { Activity, Cpu, MemoryStick, Server } from "lucide-react"

interface DebugData {
  cpu: { cores: number; loadAvg: string[]; usagePct: string }
  memory: { total: string; used: string; free: string; usagePct: string }
  node: { pid: number; memHeapUsed: string; memRss: string }
  uptime: string
}

export function DebugWidget() {
  const [data, setData] = useState<DebugData | null>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/debug")
        const json = await res.json()
        setData(json)
      } catch {}
    }
    load()
    const id = setInterval(load, 1000)
    return () => clearInterval(id)
  }, [])

  if (!visible || !data) return null

  const cpuColor = parseFloat(data.cpu.usagePct) > 80 ? "#ef4444" : parseFloat(data.cpu.usagePct) > 50 ? "#f59e0b" : "#22c55e"
  const memColor = parseFloat(data.memory.usagePct) > 80 ? "#ef4444" : parseFloat(data.memory.usagePct) > 50 ? "#f59e0b" : "#22c55e"

  return (
    <div
      className="fixed top-3 right-3 z-[9999] bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 text-xs font-mono text-gray-300 shadow-2xl transition-opacity"
      style={{ minWidth: 220 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
          <Activity className="w-3 h-3" /> Debug
        </span>
        <button
          onClick={() => setVisible(false)}
          className="text-white/30 hover:text-white/70 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] text-gray-400 w-10">CPU</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${data.cpu.usagePct}%`, backgroundColor: cpuColor }}
            />
          </div>
          <span className="text-[10px] w-10 text-right" style={{ color: cpuColor }}>{data.cpu.usagePct}%</span>
        </div>

        <div className="flex items-center gap-2">
          <MemoryStick className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] text-gray-400 w-10">RAM</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${data.memory.usagePct}%`, backgroundColor: memColor }}
            />
          </div>
          <span className="text-[10px] w-16 text-right" style={{ color: memColor }}>{data.memory.used}/{data.memory.total}GB</span>
        </div>

        <div className="flex items-center gap-2">
          <Server className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] text-gray-400 w-10">NODE</span>
          <span className="text-[10px] text-gray-400">{data.node.memHeapUsed}MB heap</span>
        </div>

        <div className="pt-1 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">PID: {data.node.pid}</span>
          <span className="text-[10px] text-gray-500">Uptime: {data.uptime}m</span>
        </div>
      </div>
    </div>
  )
}
