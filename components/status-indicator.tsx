import { Loader2, CheckCircle2, AlertCircle, Play, Pause } from "lucide-react"

interface StatusIndicatorProps {
  status: "idle" | "planning" | "coding" | "testing" | "fixing" | "ready" | "error"
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const statusConfig = {
    idle: { icon: CheckCircle2, color: "text-gray-500", label: "Ready" },
    planning: { icon: Loader2, color: "text-blue-500", label: "Planning" },
    coding: { icon: Loader2, color: "text-purple-500", label: "Coding" },
    testing: { icon: Loader2, color: "text-green-500", label: "Testing" },
    fixing: { icon: Loader2, color: "text-red-500", label: "Fixing" },
    ready: { icon: CheckCircle2, color: "text-green-600", label: "Ready" },
    error: { icon: AlertCircle, color: "text-red-600", label: "Error" },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={`flex items-center gap-1.5 text-xs ${config.color}`}
    >
      <Icon className={`h-3 w-3 ${status === "planning" || status === "coding" || status === "testing" || status === "fixing" ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  )
}