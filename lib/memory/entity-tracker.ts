import { Entity } from "./types"

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "it", "its", "there", "here", "this", "that", "these", "those",
  "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "shall", "may", "might", "can", "must",
  "not", "no", "yes", "of", "in", "on", "at", "to", "for", "with", "by", "from",
  "and", "or", "but", "so", "if", "as", "than", "too", "very", "just", "about",
  "up", "out", "into", "over", "after", "how", "what", "when", "where", "which",
  "who", "whom", "whose", "am", "all", "also", "then", "now", "more", "some",
  "kaise", "hai", "ka", "ki", "ke", "se", "mein", "kya", "kyun", "kab",
])

const CITY_KEYWORDS = ["weather", "temperature", "rain", "raining", "mausam", "forecast", "humidity"]

export function extractEntities(text: string): Entity[] {
  const entities: Entity[] = []
  const lower = text.toLowerCase()

  // City detection: patterns like "in Delhi", "weather Mumbai", "rain in Chennai"
  const cityPatterns = [
    /(?:in|at|from|to)\s+([A-Z][a-z]{2,})/g,
    /(?:weather|temperature|rain|raining|mausam|forecast)\s+(?:in|at\s+)?([A-Z][a-z]{2,})/g,
  ]

  for (const pattern of cityPatterns) {
    const matches = [...text.matchAll(pattern)]
    for (const m of matches) {
      const mention = m[1]
      if (!entities.find(e => e.mention === mention)) {
        entities.push({
          mention,
          resolvedType: "city",
          pronoun: "there",
          lastSeen: Date.now(),
          count: 1,
        })
      }
    }
  }

  // Topic detection via keyword matching
  const topicMap: Record<string, string[]> = {
    tech: ["ai", "machine learning", "python", "javascript", "react", "code", "programming", "app", "software"],
    sports: ["cricket", "football", "tennis", "ipl", "world cup", "match", "score"],
    finance: ["stock", "market", "money", "investment", "bitcoin", "crypto", "economy", "business"],
    entertainment: ["movie", "music", "song", "netflix", "bollywood", "hollywood", "celebrity"],
    health: ["health", "fitness", "diet", "exercise", "medicine", "doctor", "hospital"],
  }

  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some(kw => lower.includes(kw))) {
      entities.push({
        mention: topic,
        resolvedType: "topic",
        pronoun: "it",
        lastSeen: Date.now(),
        count: 1,
      })
    }
  }

  // Pronoun resolution: detect "there", "it", "that" in context of weather/rain/city
  // and link them to the most recent city entity from existing tracker
  const pronounPatterns = [
    { pronoun: "there", keywords: ["there", "thar"] },
    { pronoun: "it", keywords: ["it", "is"] },
    { pronoun: "that", keywords: ["that", "yeh"] },
  ]

  for (const pp of pronounPatterns) {
    if (pp.keywords.some(kw => lower.includes(kw))) {
      // Check if this is a weather/rain/city context
      const contextWords = ["weather", "temperature", "rain", "raining", "mausam", "forecast", "city", "place", "how", "what"]
      if (contextWords.some(cw => lower.includes(cw))) {
        // Don't add pronoun entities here — they'll be resolved from existing tracker
        break
      }
    }
  }

  return entities
}

export function updateTracker(entities: Entity[], existing: Entity[]): Entity[] {
  const merged: Entity[] = []
  const seen = new Set<string>()

  for (const newEnt of entities) {
    const existingEnt = existing.find(e => e.mention === newEnt.mention)
    if (existingEnt) {
      merged.push({ ...existingEnt, lastSeen: Date.now(), count: existingEnt.count + 1 })
    } else {
      merged.push(newEnt)
    }
    seen.add(newEnt.mention)
  }

  // Keep existing entities not mentioned in this message (expired after 30 min)
  const now = Date.now()
  for (const ent of existing) {
    if (!seen.has(ent.mention)) {
      if ((now - ent.lastSeen) >= 30 * 60 * 1000) {
        // Expired — skip
        continue
      }
      merged.push(ent)
    }
  }

  // Sort by lastSeen desc, cap at 5
  return merged.sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 5)
}

export function resolvePronoun(text: string, entities: Entity[]): string {
  const lower = text.toLowerCase()

  // Find city entities
  const cities = entities.filter(e => e.resolvedType === "city")
  if (cities.length === 0) return text

  // Check for pronoun + weather/rain context
  const hasPronoun = /\b(there|it|that|thar)\b/.test(lower)
  const hasContext = /\b(weather|temperature|rain|raining|mausam|forecast|how|what)\b/.test(lower)

  if (hasPronoun && hasContext) {
    // Replace pronoun with the most recent city
    const city = cities[0].mention
    return text.replace(/\b(there|thar)\b/gi, city)
      .replace(/\bit\b/gi, city)
  }

  return text
}

export function buildContextBlock(entities: Entity[]): string {
  if (entities.length === 0) return ""

  const cities = entities.filter(e => e.resolvedType === "city")
  const topics = entities.filter(e => e.resolvedType === "topic")

  const parts: string[] = []

  if (cities.length > 0) {
    const refs = cities.slice(0, 3).map(e => `"there" = ${e.mention}`)
    parts.push("[Context: " + refs.join(", ") + "]")
  }

  if (topics.length > 0) {
    const refs = topics.slice(0, 2).map(e => `"it" = ${e.mention}`)
    parts.push("[Context: " + refs.join(", ") + "]")
  }

  return parts.length > 0 ? "\n\n" + parts.join("\n") : ""
}
