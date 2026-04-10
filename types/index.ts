export type AgentStatus = "idle" | "planning" | "coding" | "testing" | "fixing" | "ready" | "error"

export interface Provider {
  name: string
  type: string
  model: string
  default: boolean
}

export interface SavedApp {
  id: string
  name: string
  icon: string
  code: string
  url: string
}
