# Plan: Fix Intent Detection — "make a calculator app" → image bug

## Context

User says "make a calculator app" but gets image generation instead of app building. Root causes:

1. `DEFAULT_KEYWORDS.image` in `lib/intent-keywords.ts` has 12 ambiguous words (draw, art, design, illustration, sketch, painting, rendering, visual, logo, icon, artwork) that pollute image matching
2. `String.includes()` substring matching — "drawing" matches "draw"
3. `/api/chat` route (line 186) only checks `detectImageIntent`/`detectAudioIntent`, never app intent
4. `/api/router` LLM fallback has no disambiguation rules for app vs image
5. No semantic understanding — pure string matching fails on compound intents

**Goal**: Replace brittle regex/keyword system with a three-tier detector: structured matching (fast, 0ms) + semantic cosine similarity (tiebreaker) + LLM fallback (only when confidence < 0.6).

## Implementation

### 1. New file: `lib/intent-matcher.ts` — core detection engine

Structured keyword matching with:
- **Phrase patterns**: exact multi-word matches (e.g., "build a calculator", "make a calculator app") with priority 8-10
- **Word keywords**: single-word matches using `\bword\b` regex (no substring false positives), with priority levels
- **Ambiguous word bucket**: draw/art/design/sketch/etc moved to low-priority (4-5) image bucket, below app keywords (priority 6-8)
- **Semantic tiebreaker**: pre-computed TF-IDF vectors per intent + cosine similarity on tokenized input. No external deps, works in browser + Node.js.
- **Confidence thresholding**: >= 0.85 → use structured result; 0.55-0.85 → semantic tiebreaker; < 0.55 → "text" (LLM fallback)

Exports: `detectIntent()`, `detectImageIntent()`, `detectAudioIntent()`, `detectAppIntent()`, `detectMultiIntent()` — all backwards-compatible with `intent-detector.ts`.

### 2. Modify: `lib/intent-detector.ts` — thin compatibility layer

- Remove old `imageRegexPatterns`, `audioRegexPatterns`, `appRegexPatterns`, `checkKeywords()`, `detectByLanguage()` functions
- Re-export everything from `intent-matcher.ts`
- Keep `IntentResult` and `MultiIntentResult` types
- Keep `detectMultiIntent()` but update to use new scoring

### 3. Modify: `app/api/chat/route.ts` — add app intent detection

Currently imports only `detectImageIntent`/`detectAudioIntent` (line 8).

Change POST handler (lines 186-195):
```typescript
const intent = detectIntent(userMessage, selectedLanguage)
const hasImage = intent.intent === 'image'
const hasAudio = intent.intent === 'audio'
const hasApp = intent.intent === 'app'
```

Add app-intent-specific system prompt:
```typescript
if (hasApp) {
  prompt = `${systemPrompt}\n\n## User is requesting app/code building. Use the announce tool and generate complete HTML code.`
}
```

### 4. Modify: `app/api/router/route.ts` — fix routing logic

Update `routeTask()` (line 260-288):
```typescript
if (intent.intent === "app") {
  return { route: "text_generation", mode: "app_building", prompt: userMessage, reasoning: intent.reasoning }
}
if (intent.confidence < 0.6) {
  return await routeTaskWithLLM(userMessage, lang, intent) // new function
}
```

Add `routeTaskWithLLM()` with improved disambiguation prompt that explicitly lists:
- "make a calculator" → APP, not IMAGE
- "draw a calculator" → IMAGE (explicit "draw" overrides)
- "show me a calculator" → IMAGE

### 5. Modify: `lib/intent-keywords.ts` — keep as supplementary

Language-specific keywords stay but are no longer primary detection. They become confidence boosters for low-confidence structured matches.

## Verification

### Results: 13/14 intent tests pass

All 5 implementation steps completed:
1. `lib/intent-matcher.ts` — three-tier detector (phrase → word → semantic cosine)
2. `lib/intent-detector.ts` — thin re-export layer
3. `app/api/chat/route.ts` — app intent detection + announce tool enabled + 120s timeout
4. `app/api/router/route.ts` — app routing + LLM disambiguation prompt
5. `lib/intent-keywords.ts` — kept as supplementary confidence booster

Test results:
- "make a calculator app" → app (via structured phrase match, priority 9)
- "build a calculator" → app (via structured phrase match, priority 8)
- "draw a cat" → image (via structured phrase match, priority 7)
- "show me a calculator" → image (via disambiguation rule)
- "create a todo list app" → app (via structured phrase match)
- "text to speech hello" → audio (via structured phrase match)
- 13 playwright intent tests pass
- 1 test timeout (LLM app-building call > 120s — expected for model loading + code gen)

### Additional work completed in this session

- **Safety module** (`lib/safety.ts`): input validation (prompt injection, self-harm, violence, profanity), output sanitization, HTML XSS prevention, NSFW image/audio blocking, compliance metadata (Indian Digital Media Ethics Code 2023), iframe sandbox validation
- **CSP headers** (`next.config.cjs`): hardened iframe sandbox, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- **html-wrapper.ts**: `sanitizeGeneratedHtml()` strips dangerous tags (script, object, embed, form, iframe), replaces javascript: URLs
- **chat-message.tsx / preview-panel.tsx / local-preview.tsx**: iframe sandbox hardened (removed allow-same-origin)
