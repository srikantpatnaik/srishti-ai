export interface Entity {
  mention: string
  resolvedType: string  // "city", "person", "topic"
  pronoun: string       // "there", "he", "it"
  lastSeen: number
  count: number
}

export interface UserProfile {
  age?: number
  location?: string
  foodPreferences?: string[]
  gadgetPreferences?: string[]
  topicsOfInterest?: string[]
  updatedAt: number
  version: number
}

export interface MemoryContext {
  shortTerm?: {
    chatId: string
    recentEntities: Entity[]
  }
  longTerm?: {
    profile: Partial<UserProfile>
    needsOnboarding?: boolean
  }
}
