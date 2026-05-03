// In-memory TTL cache. No external deps.

interface CacheEntry {
  value: unknown
  expires: number
}

export class TtlCache {
  private store = new Map<string, CacheEntry>()

  constructor(private defaultTtlMs: number = 60_000) {}

  set(key: string, value: unknown, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expires: Date.now() + (ttlMs ?? this.defaultTtlMs),
    })
  }

  get(key: string): unknown {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }
}
