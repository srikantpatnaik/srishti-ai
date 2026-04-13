export type AgentStatus = "idle" | "planning" | "coding" | "testing" | "fixing" | "ready" | "error" | "generating_image"

export interface Provider {
  name: string
  type: string
  model: string
  default?: boolean
  router?: boolean
}

export interface SavedApp {
  id: string
  name: string
  icon: string
  code: string
  url: string
  chatMessages?: any[]
  createdAt: number
  description?: string
}
