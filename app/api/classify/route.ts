import { NextResponse } from "next/server"
import { streamText } from "ai"
import { detectIntent } from "@/lib/intent-matcher"
import * as fs from "fs"
import * as path from "path"
import yaml from "js-yaml"
import { createOpenAI } from "@ai-sdk/openai"

interface Provider {
  type: string
  name?: string
  url?: string
  base_url?: string
  api_key?: string
  model?: string
  router?: boolean
  enabled?: boolean
  purpose?: string
}

interface Settings {
  text_generation?: Provider[]
  image_generation?: Provider[]
  audio_generation?: Provider[]
}

let cachedSettings: Settings | null = null
let settingsLoadTime = 0

function loadSettings(): Settings {
  const now = Date.now()
  if (cachedSettings && now - settingsLoadTime < 60000) return cachedSettings
  try {
    const settingsPath = path.join(process.cwd(), "settings.yaml")
    const content = fs.readFileSync(settingsPath, "utf-8")
    cachedSettings = yaml.load(content) as Settings
    settingsLoadTime = now
    return cachedSettings
  } catch {
    return { text_generation: [], image_generation: [], audio_generation: [] }
  }
}

const providerFactories: Record<string, (p: Provider) => any> = {
  openai: (p) => createOpenAI({ baseURL: p.base_url || p.url, apiKey: p.api_key || "dummy" })(p.model || "gpt-4o"),
  "openai-compatible": (p) => createOpenAI({ baseURL: p.base_url || p.url, apiKey: p.api_key || "dummy" })(p.model || "gpt-4o"),
  anthropic: (p) => {
    const { createAnthropic } = require("@ai-sdk/anthropic")
    return createAnthropic({ apiKey: p.api_key })(p.model || "claude-3-5-sonnet")
  },
  "google-generative-ai": (p) => {
    const { createGoogleGenerativeAI } = require("@ai-sdk/google")
    return createGoogleGenerativeAI({ apiKey: p.api_key })(p.model || "gemini-1.5-pro")
  },
  groq: (p) => {
    const { createGroq } = require("@ai-sdk/groq")
    return createGroq({ apiKey: p.api_key })(p.model || "llama-3.1-70b-versatile")
  },
  mistral: (p) => {
    const { createMistral } = require("@ai-sdk/mistral")
    return createMistral({ apiKey: p.api_key })(p.model || "mistral-large-latest")
  },
  openrouter: (p) => createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: p.api_key,
    headers: { "HTTP-Referer": "http://localhost:3000", "X-Title": "Srishti AI" },
  })(p.model || "anthropic/claude-3.5-sonnet"),
}

function getModel(provider: Provider) {
  const factory = providerFactories[provider.type]
  return factory ? factory(provider) : providerFactories.openai(provider)
}

export interface ClassifyResult {
  intent: string
  confidence: number
  scores: Record<string, number>
  reasoning: string
  routed: boolean
  entities?: { type: string; mention: string }[]
  extra?: Record<string, string>
}

const ALL_INTENTS = ["image", "audio", "app", "weather", "cricket", "news", "text"]

const INTENT_EXAMPLES: Record<string, string[]> = {
  image: ["show me a sunset", "draw a cat", "generate an image of mountains", "create a logo", "make a picture"],
  audio: ["read this text aloud", "generate music", "convert text to speech", "make a podcast", "speak this"],
  app: ["build a calculator", "create a todo list", "make a game", "develop a website", "write code"],
  weather: ["weather delhi", "is it raining in mumbai", "mausam chennai", "temperature bangalore", "forecast"],
  cricket: ["ipl score", "cricket live", "show cricket scorecard", "live match", "cricket results"],
  news: ["today news", "breaking headlines", "sports news", "top stories", "latest headlines"],
  text: ["hello", "how are you", "what is the capital of france", "explain quantum physics", "tell me a joke"],
}

export async function POST(req: Request) {
  const t0 = Date.now()
  const { message, lang, recentEntities } = await req.json()

  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 })
  }

  // Tier 1: fast-path regex detection
  const intent = detectIntent(message, lang)

  // High confidence → return immediately, no LLM call
  if (intent.confidence >= 0.8) {
    // Extract entities based on intent
    let entities: { type: string; mention: string }[] = []
    let extra: Record<string, string> = {}
    if (intent.intent === "weather") {
      const cityMatch = message.match(/(?:in|at|from|to)\s+([A-Z][a-z]{2,})/)
      if (cityMatch) {
        entities.push({ type: "city", mention: cityMatch[1] })
      } else {
        // Strip keywords to find city
        let city = message.toLowerCase()
          .replace(/\b(?:temperature|weather|mausam|mausum|mosam|tapman|tapmān|tapamatra|abohawa|vaatavaranam|ushnograta|kalanilai|havamana|darja\s+hararat|how\s+is\s+the\s+weather|what\s+is\s+the\s+temperature|check\s+(?:the\s+)?weather|show\s+(?:me\s+)?(?:the\s+)?weather|show\s+me\s+the\s+temperature|check\s+temperature|tell\s+me\s+the\s+weather|tell\s+me\s+the\s+temperature|show\s+me\s+an?\s+weather|rain|raining|will|going|to|then|there|thar|in|for|please|can|you|tell|me|show|check|what|is|the|how|at|it|kaise|hai|hai\s+ki|ka|ki|ke|se|mein)\b/gi, ' ')
          .replace(/\s+/g, ' ').replace(/[?!.]/g, '').trim()
        if (city.length > 0 && city.length < 30) {
          extra.city = city.charAt(0).toUpperCase() + city.slice(1)
          entities.push({ type: "city", mention: extra.city })
        }
      }
    }
    console.log(`[classify] fast-path intent=${intent.intent} conf=${intent.confidence} ${Date.now()-t0}ms`)
    return NextResponse.json({
      intent: intent.intent,
      confidence: intent.confidence,
      scores: intent.scores,
      reasoning: intent.reasoning,
      routed: false,
      entities,
      extra,
    })
  }

  // Tier 2: LLM disambiguation
  return classifyWithLLM(message, intent, t0, recentEntities)
}

async function classifyWithLLM(
  message: string,
  priorIntent: ReturnType<typeof detectIntent>,
  t0: number,
  recentEntities?: any[],
): Promise<NextResponse<ClassifyResult>> {
  const settings = loadSettings()
  const providers = settings.text_generation || []

  if (providers.length === 0) {
    return NextResponse.json({
      intent: priorIntent.intent,
      confidence: priorIntent.confidence,
      scores: priorIntent.scores,
      reasoning: "no text provider configured, using prior",
      routed: false,
      entities: [],
      extra: {},
    })
  }

  // Use first enabled provider (faster, smaller model preferred)
  const provider = providers.find(p => p.enabled !== false) || providers[0]
  const model = getModel(provider)

  const llmSystemPrompt = `You are a task routing assistant. Determine the user's intent from their message.

## Available intents: ${ALL_INTENTS.join(", ")}

## Examples per intent:
${Object.entries(INTENT_EXAMPLES).map(([k, v]) => `### ${k}\n${v.map(e => `- "${e}"`).join("\n")}`).join("\n\n")}

## Previous analysis (context only):
${priorIntent.reasoning}
Scores — ${Object.entries(priorIntent.scores).map(([k, v]) => `${k}: ${v}`).join(", ")}

${recentEntities ? `## Recent entities (context):
${recentEntities.map((e: any) => `- "${e.mention}" (${e.resolvedType})`).join("\n")}
` : ""}

## Response Format
Return ONLY a JSON object (no markdown, no backticks):
{
  "intent": "<one of: ${ALL_INTENTS.join(", ")}>",
  "confidence": 0.xx,
  "reasoning": "brief explanation",
  "entities": [{"type": "city", "mention": "CityName"}] // only for weather intent
}`

  try {
    const result = await streamText({
      model,
      system: llmSystemPrompt,
      messages: [{ role: "user", content: message }],
      maxSteps: 1,
    })

    const reader = result.toDataStreamResponse().body?.getReader()
    if (!reader) {
      return NextResponse.json({
        intent: priorIntent.intent,
        confidence: priorIntent.confidence,
        scores: priorIntent.scores,
        reasoning: "LLM response empty, using prior",
        routed: false,
        entities: [],
        extra: {},
      })
    }

    const decoder = new TextDecoder()
    let fullText = ""
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      for (const line of text.split("\n")) {
        if (!line || !line.startsWith("{")) continue
        try {
          const j = JSON.parse(line)
          if (j.type === "text-delta" && j.textDelta) fullText += j.textDelta
        } catch {}
      }
    }

    const jsonMatch = fullText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const validIntent = ALL_INTENTS.includes(parsed.intent) ? parsed.intent : priorIntent.intent
      const conf = typeof parsed.confidence === "number" ? parsed.confidence : 0.6
      let entities: { type: string; mention: string }[] = []
      let extra: Record<string, string> = {}
      if (parsed.entities && Array.isArray(parsed.entities)) {
        entities = parsed.entities
      }
      if (validIntent === "weather" && entities.length === 0) {
        // Try to extract city from entities or message
        const cityMatch = message.match(/(?:in|at|from|to)\s+([A-Z][a-z]{2,})/)
        if (cityMatch) {
          entities.push({ type: "city", mention: cityMatch[1] })
        }
      }
      console.log(`[classify] LLM intent=${validIntent} conf=${conf} ${Date.now()-t0}ms`)
      return NextResponse.json({
        intent: validIntent,
        confidence: conf,
        scores: priorIntent.scores,
        reasoning: `LLM routed: ${parsed.reasoning || fullText.substring(0, 100)}`,
        routed: true,
        entities,
        extra,
      })
    }

    return NextResponse.json({
      intent: priorIntent.intent,
      confidence: priorIntent.confidence,
      scores: priorIntent.scores,
      reasoning: "LLM parsing failed, using prior",
      routed: false,
      entities: [],
      extra: {},
    })
  } catch (err: any) {
    console.error(`[classify] LLM error ${Date.now()-t0}ms ${err.message}`)
    return NextResponse.json({
      intent: priorIntent.intent,
      confidence: priorIntent.confidence,
      scores: priorIntent.scores,
      reasoning: `LLM error: ${err.message || "unknown"}, using prior`,
      routed: false,
      entities: [],
      extra: {},
    })
  }
}
