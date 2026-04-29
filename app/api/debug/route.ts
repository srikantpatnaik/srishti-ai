import { NextResponse } from "next/server"
import os from "os"

export async function GET() {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memPct = ((usedMem / totalMem) * 100).toFixed(1)

  const loadAvg = os.loadavg()
  const cpuCount = os.cpus().length
  const cpuPct = (loadAvg[0] / cpuCount * 100).toFixed(1)

  return NextResponse.json({
    cpu: {
      cores: cpuCount,
      loadAvg: loadAvg.map(l => l.toFixed(2)),
      usagePct: cpuPct,
    },
    memory: {
      total: (totalMem / 1e9).toFixed(1),
      used: (usedMem / 1e9).toFixed(1),
      free: (freeMem / 1e9).toFixed(1),
      usagePct: memPct,
    },
    node: {
      pid: process.pid,
      memHeapUsed: (process.memoryUsage().heapUsed / 1e6).toFixed(1),
      memRss: (process.memoryUsage().rss / 1e6).toFixed(1),
    },
    uptime: (process.uptime() / 60).toFixed(1),
  })
}
