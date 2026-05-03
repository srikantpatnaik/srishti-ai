# Plan: Context Memory & User Preferences

## Context

User asks: after "is it raining in Delhi?" → "No, it's not currently raining in Delhi.", if user asks "how is weather there?" the assistant should resolve "there" = Delhi. Additionally, user wants the assistant to remember preferences (age, location, food, gadgets) to tailor responses.

Current state: no profile system, no pronoun resolution. Messages sent to LLM as raw array. System prompt is static.

## Design

Two layers, both injected into system prompt before the LLM call:

### Layer 1: Short-term memory (per-chat entity tracker)
Tracks recent named entities (cities, people, topics) from the conversation. Resolves pronouns like "there", "it", "that" by looking up the most recent entity of that type. Ephemeral — lives only for the chat session.

### Layer 2: Long-term memory (user profile)
Persistent preferences stored in localStorage. Injected compactly into system prompt. Accumulates across sessions.

### Injection mechanism
A single function `buildMemoryContextBlock()` in `lib/memory/injector.ts` takes both data sources and returns a compact string appended to the system prompt. Example output:
```
[Context Resolution: "there" = Delhi (city)]
[User Profile: Location=Mumbai, Food=vegetarian]
```
At most ~200 chars. ~50-75 tokens overhead per API call.

## Changes

### 1. New files

**`lib/memory/types.ts`** — Shared interfaces:
```typescript
export interface Entity { mention: string; resolvedType: string; pronoun: string; lastSeen: number; count: number }
export interface UserProfile { age?: number; location?: string; foodPreferences?: string[]; gadgetPreferences?: string[]; topicsOfInterest?: string[]; updatedAt: number; version: number }
export interface MemoryContext { shortTerm?: { chatId: string; recentEntities: Entity[] }; longTerm?: { profile: Partial<UserProfile>; needsOnboarding?: boolean } }
```

**`lib/memory/entity-tracker.ts`** — Short-term memory:
- `extractEntities(text: string): Entity[]` — regex-based extraction of cities, people, topics from user text
- `updateTracker(chatId: string, entities: Entity[]): void` — save to IndexedDB
- `getTracker(chatId: string): Entity[] | null` — load from IndexedDB
- `resolvePronoun(text: string, entities: Entity[]): string` — build context resolution string

**`lib/memory/user-profile.ts`** — Long-term memory:
- `getUserProfile(): Partial<UserProfile>` — read from localStorage key `userProfile`
- `updateUserProfile(updates: Partial<UserProfile>): void` — merge + save to localStorage
- `getOnboardingStatus(): boolean` — check if basic info is missing

**`lib/memory/injector.ts`** — Unified system-prompt injector:
- `buildMemoryContextBlock(ctx: MemoryContext): string` — returns compact context string or ""

### 2. Modify existing files

**`lib/db.ts`** — Add entityTracker IndexedDB store:
- Bump `DB_VERSION` from 3 → 4
- Add `entityTracker` object store in `onupgradeneeded`
- Add `saveEntityTracker(chatId, entities)` and `loadEntityTracker(chatId)` helpers

**`app/api/chat/route.ts`** — Inject memory into system prompt:
- Import `buildMemoryContextBlock`
- Destructure `chatId`, `recentEntities`, `userProfile` from request body
- Call `buildMemoryContextBlock` and append to system prompt before LLM call

**`app/page.tsx`** — Wire entity extraction + profile loading:
- Import `extractEntities`, `getUserProfile`
- In `handleSubmit`: call `extractEntities(userText)`, pass `recentEntities` and `userProfile` in fetch body to `/api/chat`
- After assistant response, optionally pass profile updates back

### 3. Data flow

```
User types: "how is weather there?"
  |
  +-> extractEntities("how is weather there?") → [{ mention: "Delhi", resolvedType: "city", pronoun: "there" }]
  |     (from IndexedDB entityTracker for this chatId)
  |
  +-> getUserProfile() → { location: "Mumbai", foodPreferences: ["vegetarian"] }
  |     (from localStorage)
  |
  +-> POST /api/chat with { messages, chatId, recentEntities, userProfile }
  |
  +-> /api/chat: buildMemoryContextBlock({ shortTerm: entities, longTerm: profile })
  |     → appends "[Context Resolution: "there" = Delhi (city)]\n[User Profile: Location=Mumbai, Food=vegetarian]"
  |     to system prompt before LLM call
  |
  v
LLM sees: "Context: 'there' = Delhi" → understands "there" = Delhi
```

### 4. Entity extraction rules

Lightweight regex-based (no LLM call):
- **Cities**: patterns like `(in|at|from)\s+([A-Z][a-z]{2,})`, `(weather|rain)\s+(?:in|at\s+)?([A-Z][a-z]+)`
- **People**: capitalized words (not sentence-start), 3+ chars
- **Topics**: keyword matching against a small taxonomy (tech, sports, finance, etc.)

Only new mentions are added. Existing entities get their `count` incremented and `lastSeen` updated.

### 5. Profile persistence

- Stored in localStorage key `userProfile`
- Merged (not replaced) on each update
- Onboarding: if `location` is missing, system prompt includes a tip for the LLM to ask naturally
- Profile block is capped: max 5 preference categories, max 3 values each

### 6. Token budget

| Component | Max chars | Max tokens |
|-----------|-----------|------------|
| 5 entity refs | ~150 | ~40 |
| 5 profile prefs | ~100 | ~25 |
| **Total** | **~250** | **~65** |

Compared to 2000-5000 token system prompt: 1-3% overhead.

## Files to modify

- `lib/memory/types.ts` — new
- `lib/memory/entity-tracker.ts` — new
- `lib/memory/user-profile.ts` — new
- `lib/memory/injector.ts` — new
- `lib/db.ts` — add entityTracker store (version bump 3→4)
- `app/api/chat/route.ts` — inject memory block into system prompt
- `app/page.tsx` — wire extraction + profile in handleSubmit

## Verification

- Chat "is it raining in Delhi?" → "No, it's not raining." → "how is weather there?" → should respond about Delhi
- Profile update: user says "I am vegetarian" → profile updated → next response tailored to vegetarian
- Token budget: verify system prompt doesn't grow beyond reasonable limits
- localStorage persistence: close/reopen browser → profile still loaded
- Per-chat isolation: different chats have different entity trackers
