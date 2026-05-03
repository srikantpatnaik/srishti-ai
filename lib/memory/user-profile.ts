import { UserProfile } from "./types"

const STORAGE_KEY = "userProfile"

const DEFAULT_PROFILE: UserProfile = {
  updatedAt: Date.now(),
  version: 0,
}

export function getUserProfile(): Partial<UserProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function updateUserProfile(updates: Partial<UserProfile>): void {
  try {
    const existing = getUserProfile()
    const merged: UserProfile = {
      ...DEFAULT_PROFILE,
      ...existing,
      ...updates,
      updatedAt: Date.now(),
      version: (existing.version || 0) + 1,
    }
    // Arrays: merge without duplicates
    if (updates.foodPreferences) {
      merged.foodPreferences = [...new Set([...(existing.foodPreferences || []), ...updates.foodPreferences])]
    }
    if (updates.gadgetPreferences) {
      merged.gadgetPreferences = [...new Set([...(existing.gadgetPreferences || []), ...updates.gadgetPreferences])]
    }
    if (updates.topicsOfInterest) {
      merged.topicsOfInterest = [...new Set([...(existing.topicsOfInterest || []), ...updates.topicsOfInterest])]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch (e) {
    console.warn("[memory] failed to save profile:", e)
  }
}

export function getOnboardingStatus(profile: Partial<UserProfile>): boolean {
  return !profile.location && !profile.age
}
