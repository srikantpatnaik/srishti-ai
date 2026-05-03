import { MemoryContext } from "./types"
import { buildContextBlock } from "./entity-tracker"

export function buildMemoryContextBlock(ctx: MemoryContext): string {
  const parts: string[] = []

  // Short-term: entity resolution
  if (ctx.shortTerm?.recentEntities) {
    const block = buildContextBlock(ctx.shortTerm.recentEntities)
    if (block) parts.push(block)
  }

  // Long-term: user preferences
  if (ctx.longTerm?.profile) {
    const prefs: string[] = []
    if (ctx.longTerm.profile.location) prefs.push("Location=" + ctx.longTerm.profile.location)
    if (ctx.longTerm.profile.foodPreferences?.length) prefs.push("Food=" + ctx.longTerm.profile.foodPreferences.slice(0, 3).join(","))
    if (ctx.longTerm.profile.gadgetPreferences?.length) prefs.push("Gadgets=" + ctx.longTerm.profile.gadgetPreferences.slice(0, 3).join(","))
    if (ctx.longTerm.profile.topicsOfInterest?.length) prefs.push("Interests=" + ctx.longTerm.profile.topicsOfInterest.slice(0, 3).join(","))
    if (ctx.longTerm.profile.age) prefs.push("Age=" + ctx.longTerm.profile.age)
    if (prefs.length > 0) {
      parts.push("[User Profile: " + prefs.join(", ") + "]")
    }
    if (ctx.longTerm.needsOnboarding) {
      parts.push("[Tip: If you don't know the user's basic preferences, ask naturally]")
    }
  }

  return parts.length > 0 ? "\n\n" + parts.join("\n") : ""
}
