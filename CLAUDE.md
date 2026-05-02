# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Srishti AI: a Next.js 14 PWA that lets users create apps/games, generate images, and generate audio via natural language. Two API routes handle requests:

- `/api/chat` — direct streaming chat via Ollama
- `/api/router` — intent-routing gateway. Uses NLP regex patterns first, falls back to LLM routing. Dispatches to text/image/audio backends.
- `/api/classify` — lightweight intent classifier. Regex first (fast-path for confidence >= 0.8), LLM fallback (low confidence). Returns `{ intent, confidence, scores, reasoning, routed }`. Used to disambiguate overlapping intents as the system grows beyond 6 intent types.

Providers are configured in `settings.yaml` (text, image, audio generation). Router instructions live in `ROUTER.md`.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start main app on port 3000 |
| `npm run dev:router` | Start app on port 3001 (used by some tests) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx playwright test` | Run all e2e tests (requires dev server on :3000) |
| `npx playwright test --grep "pattern"` | Run single test matching pattern |
| `npx playwright test --ui` | Run tests in Playwright UI mode |

Tests hit two ports: main app on 3000, router on 3001. Start both servers before running the full suite.

## Architecture

### API routes

**`/api/chat`** (`app/api/chat/route.ts`): streams text responses via Vercel AI SDK using Ollama. Detects image/audio/app/intent via regex, then calls `streamText` with the `announce` tool.

**`/api/router`** (`app/api/router/route.ts`): routes requests to text/image/audio backends. Reads providers from `settings.yaml`. NLP patterns (`detectImageIntent`, `detectAudioIntent`, `detectAppIntent`) run first; ambiguous messages fall back to LLM-based routing via `routeTask()`.

**Tools API routes** — structured data for rich cards in chat:

- **`/api/tools/weather`** — returns `{ structured: {...}, result: string }` (default mode) or `{ city, answer }` (`mode=rain`). Structured fields: `city`, `state`, `country`, `lat`, `lon`, `temperature`, `humidity`, `windSpeed`, `weatherCode`, `weatherDescription`, `aqi`, `forecast[]`. Uses Open-Meteo Weather + Air Quality APIs. TTL cached.
- **`/api/tools/cricket`** — returns `{ structured: {...}, result: string }`. Structured fields: `series`, `venue`, `teams[]`, `status`, `recentOvers[]`. Fetches from cricsheet.org.
- **`/api/tools/news`** — returns `{ structured: NewsArticle[], result: string }`. Article fields: `title`, `source`, `time`, `summary`, `category`, `imageUrl`, `link`. Parses RSS from BBC, NDTV, TOI, ET, ESPN.

### Key components

- `components/chat-message.tsx` — message bubble renderer (handles markdown, code blocks, weather/cricket/news cards)
- `components/weather-card.tsx` — glass-morphism weather card with animated SVG icons, auto-refresh (60s), IST timestamp
- `components/cricket-card.tsx` — glass-morphism cricket card with team badges, live status, recent overs
- `components/news-card.tsx` — glass-morphism news card with swipeable carousel, left/right arrow navigation
- `app/page.tsx` — main chat UI entry point (routes weather/cricket/news intents to card rendering)
- `settings.yaml` — provider config (text/image/audio backends, URLs, API keys)
- `ROUTER.md` — system prompt for the LLM-based router fallback

### Environment variables

Set in `.env.local`. See `.env.example` for required keys. Key vars: `LLAMA_CPP_URL`, `LLAMA_CPP_API_KEY`, `GOOGLE_AI_API_KEY`.

### Intent detection

Three-tier detection: phrase matching → word matching → semantic cosine similarity.

- **`lib/intent-detector.ts`** — entry point, re-exports from `intent-matcher.ts`
- **`lib/intent-matcher.ts`** — core logic. Supports `IntentType`: `image | audio | app | weather | cricket | news`. Language-specific keywords per language + default English keywords. Semantic vectors for all intent types. Three-tier pipeline: phrase matching → word matching → semantic cosine similarity.
- **`lib/intent-keywords.ts`** — language-specific keyword maps (used as supplementary matchers)
- **`lib/intent-detector.ts`** — re-exports from `intent-matcher.ts`

Intent detection is multilingual — romanized Hindi/Indian language keywords work without selecting a language in the UI. Weather (`mausam`), cricket, and news intents trigger structured card rendering in chat without a tools menu.

Regex patterns in both `chat` and `router` routes detect image/audio/app intents. Patterns are duplicated between the two files — keep them in sync or extract to a shared module.

### Future: Intent scaling strategy

Current system supports 6 intents with regex. As you add more intents (stock, train, crypto, sports, etc.), regex will bleed. Two-phase approach:

1. **Phase 1 (10-20 intents)**: `/api/classify` endpoint — regex fast-path (confidence >= 0.8) returns immediately, LLM fallback handles ambiguity (~50ms). New intents: add keywords to `intent-matcher.ts` + examples to `INTENT_EXAMPLES` in classify route.
2. **Phase 2 (20+ intents)**: Train tiny ONNX classifier (~3-5MB) via `transformers.js` browser runtime. Zero server latency, but requires training data collection.

When adding a new intent:
- Add to `IntentType` in `lib/intent-matcher.ts`
- Add word/phrase entries to `WORDS` and `PHRASES` arrays
- Add semantic vector to `TERM_VECTORS`
- Add convenience function `detectXIntent()`
- Add example prompts to `INTENT_EXAMPLES` in `/api/classify/route.ts`
- Add routing logic in `app/page.tsx` handleSubmit
- Create API route + card component

### Multi-language support

13 Indian languages supported via `selectedLanguage` query param. Language injection happens in the system prompt.
