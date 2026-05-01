import { z } from "zod"
import { streamText, tool } from "ai"
import { NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"
import yaml from "js-yaml"
import { createOpenAI } from "@ai-sdk/openai"
import { detectImageIntent, detectAudioIntent, detectAppIntent, detectIntent } from "@/lib/intent-detector"
import { getLangInstruction } from "@/lib/i18n"
import { checkInput, sanitizeOutput, generateComplianceMetadata } from "@/lib/safety"

export const runtime = "nodejs"
export const maxDuration = 60

const announceSchema = z.object({
  phase: z.enum(["planning", "coding", "testing", "fixing", "ready"]).describe("Current phase"),
  message: z.string().optional().describe("Optional message about this phase"),
})

const announceTool = tool({
  description: "Show progress update (required before building). Use only for app building tasks.",
  parameters: announceSchema,
  execute: async ({ phase, message }) => ({
    success: true,
    phase,
    message: message || "Working on it...",
  }),
})

const systemPromptBase = `You are Srishti AI - a friendly assistant that helps users create apps and games without any technical knowledge.

## CRITICAL: How to build apps/games

**When user wants to build/create something (app, game, website):**
1. Call announce(phase: "planning") tool ONCE (hidden from user)
2. IMMEDIATELY generate the COMPLETE HTML code in a single code block with triple backticks and html
3. After the code block, write a friendly message like "Your game is ready! Play it below"
4. DO NOT call announce multiple times - just call it once at the start
5. DO NOT output any text before or after the code block except the friendly message
6. DO NOT write tool call text like "announce(phase: "planning")" in your response

**Design Style — DARK, MOBILE-FIRST, COLORFUL, NO BORDERS, NO EXTRA PADDING:**
- Dark background: \x60background: #0a0a0f\x60 on body
- Every element uses vibrant gradients: \x60linear-gradient(135deg, #667eea 0%, #764ba2 100%)\x60
- Buttons: gradient background, NO borders, rounded (border-radius: 12px), padding 10-14px, touch-friendly (min 44px)
- Cards/sections: dark gradient or glassmorphism (rgba(255,255,255,0.05) + backdrop-filter blur), NO borders
- Text: light (#e8e8e8), headings bold and larger
- NO white backgrounds, NO gray backgrounds, NO plain black without gradient
- NO unnecessary padding (keep it tight, app-like, no whitespace gaps)
- NO thick borders — use subtle 1px rgba(255,255,255,0.08) at most
- Mobile-first: max-width 430px, centered, viewport meta tag
- Smooth animations on buttons: transform scale(0.95) on active, transition 0.15s
- Use CSS variables for theme consistency: --bg-dark, --accent-1, --accent-2, --text-light
- Layout: flexbox, gap 8-12px (NOT 24px+), no margin bloat
- Colors: neon blue (#667eea), purple (#764ba2), pink (#f093fb), green (#4ade80), orange (#fb923c)
- NO default browser styles — always reset: * { margin: 0; padding: 0; box-sizing: border-box; }
- Every app must look like a premium mobile app — colorful, dark, tight, no whitespace

**Code Requirements (internal only - NEVER show user):**
- Complete HTML file with all CSS and JS inline in one \x60\x60\x60html code block
- Mobile-first: viewport meta, max-width 430px, centered layout
- CSS reset first: * { margin: 0; padding: 0; box-sizing: border-box; }
- Use flexbox with small gaps (8-12px), NO margin bloat
- Buttons: min-height 44px, gradient bg, no borders, border-radius 12px, padding 12px
- Cards: background rgba(255,255,255,0.05) with backdrop-filter blur, 1px rgba(255,255,255,0.08) border max
- NO white/gray backgrounds ever
- NO excessive padding (max 16px), NO excessive margins
- Include interactive elements where relevant

**IMPORTANT:** You must include the full HTML code block with triple backticks and html. The code will be automatically extracted and shown as a preview.

## For regular conversation:
- Be friendly and helpful
- Answer questions naturally
- No technical jargon

## For app building:
- Call announce tool ONCE with phase: "planning"
- IMMEDIATELY generate the COMPLETE HTML code in a single code block`

// --- Settings cache with TTL ---
let cachedSettings: any = null
let settingsLoadTime = 0
const SETTINGS_TTL_MS = 30_000

function loadSettings() {
  const now = Date.now()
  if (cachedSettings && (now - settingsLoadTime) < SETTINGS_TTL_MS) {
    return cachedSettings
  }
  try {
    const settingsPath = path.join(process.cwd(), "settings.yaml")
    const settingsContent = fs.readFileSync(settingsPath, "utf-8")
    cachedSettings = yaml.load(settingsContent)
    settingsLoadTime = now
    return cachedSettings
  } catch (e) {
    console.error("Failed to load settings:", e)
    return null
  }
}

function createChatClient(provider: any) {
  const url = (provider.base_url || provider.url || "http://192.168.1.8:11434/v1")
  const model = provider.model || "qwen3.6-35B"
  const apiKey = provider.api_key || "sk-123"
  return createOpenAI({ baseURL: url, apiKey })(model)
}

function selectProvider(settings: any, purpose: string): { primary: any; fallback: any } {
  if (!settings?.text_generation) {
    const url = process.env.LLAMA_CPP_URL || "http://192.168.1.8:11434/v1"
    const key = process.env.LLAMA_CPP_API_KEY || "sk-123"
    const fallback = createOpenAI({ baseURL: url, apiKey: key })(process.env.LLAMA_CPP_MODEL || "qwen3.6-35B")
    return { primary: { url, model: process.env.LLAMA_CPP_MODEL || "qwen3.6-35B", api_key: key }, fallback }
  }

  const providers = settings.text_generation
  // Primary: match purpose
  let primary: any = providers.find((p: any) => p.purpose === purpose && p.enabled !== false)
  // Fallback: first enabled provider with different URL (different node)
  let fallback: any = providers.find((p: any) => p.enabled !== false && p.url !== primary?.url)
  // If no different-URL provider, pick the other one
  if (!fallback || fallback === primary) {
    fallback = providers.find((p: any) => p.enabled !== false && p !== primary)
  }
  // If only one provider exists, use it as both primary and fallback
  if (!primary) primary = providers.find((p: any) => p.enabled !== false) || providers[0]
  if (!fallback) fallback = primary // same node — no real fallback, but won't crash

  return { primary, fallback }
}

async function streamWithFallback(
  systemPrompt: string,
  messages: any[],
  opts: { isAutonomous?: boolean; purpose?: string; signal?: AbortSignal },
): Promise<Response> {
  const settings = loadSettings()
  const { primary, fallback } = selectProvider(settings, opts.purpose || "general")

  // App building timeout — 15s primary, then fallback kicks in
  const primaryTimeout = opts.purpose === "app" ? 15000 : 3000
  // Enable announce tool for app building and autonomous mode
  const activeTools: "announce"[] = (opts.purpose === "app" || opts.isAutonomous) ? ["announce"] : []

  const primaryPromise = streamText({
    model: createChatClient(primary),
    system: systemPrompt,
    messages,
    tools: { announce: announceTool },
    maxSteps: 20,
    experimental_activeTools: activeTools,
    abortSignal: opts.signal,
  })

  // Race: primary vs fallback timeout
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), primaryTimeout)
  })

  const primaryResult = await Promise.race([primaryPromise, timeoutPromise])

  if (primaryResult) {
    return primaryResult.toDataStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }

  // Primary timed out — try fallback
  const fallbackController = new AbortController()
  opts.signal?.addEventListener('abort', () => fallbackController.abort(), { once: true })

  const fallbackResult = await streamText({
    model: createChatClient(fallback),
    system: systemPrompt,
    messages,
    tools: { announce: announceTool },
    maxSteps: 20,
    experimental_activeTools: activeTools,
    abortSignal: fallbackController.signal,
  })

  return fallbackResult.toDataStreamResponse({
    headers: {
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function GET(req: Request) {
  return NextResponse.json({ router: "multi-node" })
}

export async function POST(req: Request) {
  const { messages, isAutonomous, selectedLanguage, purpose } = await req.json()
  const userMessage = messages?.filter((m: any) => m.role === 'user').pop()?.content || ""

  // Safety: validate input
  const safetyIssue = checkInput(userMessage)
  if (safetyIssue) {
    return NextResponse.json({
      messages: [{ role: "assistant", content: safetyIssue.reason || "Request blocked for safety reasons." }],
      compliance: generateComplianceMetadata("text", selectedLanguage),
    })
  }

  const langInstruction = getLangInstruction(selectedLanguage)
  const systemPrompt = langInstruction
    ? `${systemPromptBase}\n\nRespond in ${langInstruction} language`
    : systemPromptBase

  // Detect intent from message content (server-side, as fallback when purpose is unreliable)
  const intent = detectIntent(userMessage, selectedLanguage)

  // If purpose is undefined/stale, use server-side intent detection to determine purpose
  let effectivePurpose = purpose
  if (!effectivePurpose || effectivePurpose === "undefined" || effectivePurpose === "general") {
    if (intent.intent === "app") effectivePurpose = "app"
    else if (intent.intent === "image") effectivePurpose = "image"
    else if (intent.intent === "audio") effectivePurpose = "audio"
    else effectivePurpose = "general"
  }

  const hasImage = intent.intent === 'image'
  const hasAudio = intent.intent === 'audio'
  const hasApp = intent.intent === 'app'

  let prompt = systemPrompt

  if (hasImage) {
    prompt = `${systemPrompt}\n\nFor image requests, respond with image generation guidance or use generateImage tool if available.`
  } else if (hasAudio) {
    prompt = `${systemPrompt}\n\nFor audio generation, respond with audio content or use generateAudio tool if available.`
  } else if (hasApp) {
    prompt = `${systemPrompt}\n\n## User is requesting app/code building. Use the announce tool and generate complete HTML code.`
  }

  try {
    const response = await streamWithFallback(prompt, messages, {
      isAutonomous,
      purpose: effectivePurpose,
      signal: req.signal,
    })
    return response
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      return new Response(JSON.stringify({ error: "Generation stopped" }), {
        status: 499,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
