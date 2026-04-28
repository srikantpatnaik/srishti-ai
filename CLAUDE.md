# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Srishti AI: a Next.js 14 PWA that lets users create apps/games, generate images, and generate audio via natural language. Two API routes handle requests:

- `/api/chat` — direct streaming chat via Ollama
- `/api/router` — intent-routing gateway. Uses NLP regex patterns first, falls back to LLM routing. Dispatches to text/image/audio backends.

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

**`/api/chat`** (`app/api/chat/route.ts`): streams text responses via Vercel AI SDK using Ollama. Detects image/audio intent via regex, then calls `streamText` with the `announce` tool.

**`/api/router`** (`app/api/router/route.ts`): routes requests to text/image/audio backends. Reads providers from `settings.yaml`. NLP patterns (`detectImageIntent`, `detectAudioIntent`, `detectAppIntent`) run first; ambiguous messages fall back to LLM-based routing via `routeTask()`.

### Key components

- `components/chat-message.tsx` — message bubble renderer (handles markdown, code blocks)
- `app/page.tsx` — main chat UI entry point
- `settings.yaml` — provider config (text/image/audio backends, URLs, API keys)
- `ROUTER.md` — system prompt for the LLM-based router fallback

### Environment variables

Set in `.env.local`. See `.env.example` for required keys. Key vars: `LLAMA_CPP_URL`, `LLAMA_CPP_API_KEY`, `GOOGLE_AI_API_KEY`.

### Intent detection

Regex patterns in both `chat` and `router` routes detect image/audio/app intents. Patterns are duplicated between the two files — keep them in sync or extract to a shared module.

### Multi-language support

13 Indian languages supported via `selectedLanguage` query param. Language injection happens in the system prompt.
