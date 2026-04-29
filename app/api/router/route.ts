import { NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import * as fs from "fs"
import * as path from "path"
import yaml from "js-yaml"
import { createOpenAI } from "@ai-sdk/openai"
import { detectIntent } from "@/lib/intent-detector"
import { languageNames, getLangInstruction } from "@/lib/i18n"
import { checkInput, checkImagePrompt, checkAudioPrompt, sanitizeOutput, generateComplianceMetadata, validateHtmlForIframe, injectWatermark } from "@/lib/safety"

// --- Types ---

interface Provider {
  type: string
  name: string
  base_url?: string
  url?: string
  api_key?: string
  model: string
  router?: boolean
  enabled?: boolean
  purpose?: string
}

interface ImageProvider extends Provider {
  steps?: number
  cfg_scale?: number
  width?: number
  height?: number
  clip_skip?: number
  output_format?: string
}

interface AudioProvider extends Provider {
  voice?: string
}

interface Settings {
  text_generation: Provider[]
  image_generation: ImageProvider[]
  audio_generation: AudioProvider[]
}

// --- Settings cache with TTL ---

let cachedSettings: Settings | null = null
let settingsLoadTime = 0
const SETTINGS_TTL_MS = 30_000 // 30s

function loadSettings(): Settings {
  const now = Date.now()
  if (cachedSettings && (now - settingsLoadTime) < SETTINGS_TTL_MS) {
    return cachedSettings
  }

  try {
    const settingsPath = path.join(process.cwd(), "settings.yaml")
    const settingsContent = fs.readFileSync(settingsPath, "utf-8")
    cachedSettings = yaml.load(settingsContent) as Settings
    settingsLoadTime = now
    return cachedSettings
  } catch (e) {
    console.error("Failed to load settings:", e)
    return { text_generation: [], image_generation: [], audio_generation: [] }
  }
}

function getRouterProvider(providers: Provider[]): Provider | undefined {
  return providers.find(p => p.router === true)
}

function getEnabledProvider(providers: Provider[]): Provider | undefined {
  return providers.find(p => p.enabled !== false)
}

function loadRouterInstructions(): string {
  try {
    const routerPath = path.join(process.cwd(), "ROUTER.md")
    return fs.readFileSync(routerPath, "utf-8")
  } catch (e) {
    console.error("Failed to load ROUTER.md:", e)
    return getDefaultRouterInstructions()
  }
}

function getDefaultRouterInstructions(): string {
  return `# Task Router Instructions

You are a task routing assistant. Analyze the user's request and route it to the appropriate service.

## Routing Rules

### 1. IMAGE GENERATION
Route to: \`image_generation\`
When user asks to:
- Generate/create/draw an image or picture
- Show me a [something]
- Make me a [picture/image]
- Create a photo of
Keywords: image, picture, photo, generate image, create image, draw, make picture

### 2. AUDIO GENERATION
Route to: \`audio_generation\`
When user asks to:
- Generate/create/draw an audio or sound
- Text to speech, TTS
- Convert text to voice
- Generate music or song
Keywords: audio, sound, speech, voice, TTS, music, song, synthesize

### 3. APP/CODE BUILDING
Route to: \`text_generation\` (with app building mode)
When user asks to:
- Build/create/make an app
- Write code for
- Build a game
- Create a [web app/mobile app]
Keywords: build, create app, make app, write code, develop

### 4. REGULAR CONVERSATION
Route to: \`text_generation\` (default chat mode)
For all other requests like:
- Questions
- Help with tasks
- Information requests
- General conversation

## Response Format

Return a JSON object with:
\`\`\`json
{
  "route": "text_generation" | "image_generation" | "audio_generation",
  "mode": "chat" | "app_building" | "image" | "audio",
  "prompt": "the original or enhanced prompt for the target service",
  "reasoning": "why this route was chosen"
}
\`\`\`
`
}

// --- Image generation ---

async function generateImage(prompt: string): Promise<string> {
  const settings = loadSettings()
  const imgProviders = settings.image_generation || []
  const provider = imgProviders.find(p => p.router === true) || imgProviders.find(p => p.enabled !== false)

  if (!provider) {
    throw new Error("No image generation provider available")
  }

  let outputFormat = provider.output_format || "jpeg"

  const payload = {
    prompt,
    cfg_scale: provider.cfg_scale || 1,
    steps: provider.steps || 4,
    width: provider.width || 512,
    height: provider.height || 512,
    seed: -1,
    clip_skip: provider.clip_skip || 1,
    response_format: "url",
    output_format: outputFormat,
  }

  const baseUrl = provider.base_url || provider.url || ""
  const apiUrl = `${baseUrl}/sdapi/v1/txt2img`

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Image generation failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()

  if (data.images && data.images.length > 0) {
    const imageData = data.images[0]
    if (typeof imageData === 'string' && (imageData.startsWith('http://') || imageData.startsWith('https://'))) {
      // Fetch external URL and convert to base64 to avoid 431 on browser image request
      const mimeType = outputFormat === "jpeg" ? "image/jpeg" : "image/png"
      try {
        const imgResp = await fetch(imageData)
        const buf = Buffer.from(await imgResp.arrayBuffer())
        return `data:${mimeType};base64,${buf.toString('base64')}`
      } catch {
        // Fallback: return URL as-is
      }
      return imageData
    }
    const mimeType = outputFormat === "jpeg" ? "image/jpeg" : "image/png"
    return `data:${mimeType};base64,${imageData}`
  } else if (data.url) {
    // Convert URL to base64 too
    const mimeType = outputFormat === "jpeg" ? "image/jpeg" : "image/png"
    try {
      const imgResp = await fetch(data.url)
      const buf = Buffer.from(await imgResp.arrayBuffer())
      return `data:${mimeType};base64,${buf.toString('base64')}`
    } catch {
      // Fallback: return URL as-is
    }
    return data.url
  }

  throw new Error("No image generated")
}

// --- Audio generation ---

async function generateAudio(prompt: string): Promise<string> {
  const settings = loadSettings()
  const audioProviders = settings.audio_generation || []
  const provider = audioProviders.find(p => p.router === true) || audioProviders.find(p => p.enabled !== false)

  if (!provider) {
    throw new Error("No audio generation provider available")
  }

  const baseUrl = provider.base_url || provider.url || ""
  const apiUrl = `${baseUrl}/v1/audio/speech`

  const apiKey = provider.api_key
  if (!apiKey) {
    throw new Error("Audio provider missing API key")
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/wav",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model || "tts-1",
      input: prompt,
    }),
  })

  if (!response.ok) {
    throw new Error(`Audio generation failed: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  return `data:audio/wav;base64,${base64}`
}

// --- Routing ---

async function routeTask(userMessage: string, lang?: string): Promise<{ route: string; mode: string; prompt: string; reasoning: string }> {
  const intent = detectIntent(userMessage, lang)

  if (intent.intent === "image") {
    return {
      route: "image_generation",
      mode: "image",
      prompt: userMessage,
      reasoning: intent.reasoning,
    }
  }

  if (intent.intent === "audio") {
    return {
      route: "audio_generation",
      mode: "audio",
      prompt: userMessage,
      reasoning: intent.reasoning,
    }
  }

  if (intent.intent === "app") {
    return {
      route: "text_generation",
      mode: "app_building",
      prompt: userMessage,
      reasoning: intent.reasoning,
    }
  }

  // Low confidence → use LLM for disambiguation
  if (intent.confidence < 0.6) {
    return await routeTaskWithLLM(userMessage, intent, lang)
  }

  // Anything else → text (default chat)
  return {
    route: "text_generation",
    mode: "chat",
    prompt: userMessage,
    reasoning: intent.reasoning,
  }
}

async function routeTaskWithLLM(userMessage: string, priorIntent: any, lang?: string): Promise<{ route: string; mode: string; prompt: string; reasoning: string }> {
  const settings = loadSettings()
  const textProviders = settings.text_generation || []
  const router = getRouterProvider(settings.text_generation) || textProviders.find(p => p.enabled !== false)

  if (!router) {
    const appMode = priorIntent.intent === 'app' ? 'app_building' : 'chat'
    return {
      route: "text_generation",
      mode: appMode,
      prompt: userMessage,
      reasoning: `low confidence (prior: ${priorIntent.reasoning}), no LLM router available`,
    }
  }

  const model = getModel(router)

  const llmSystemPrompt = `You are a task routing assistant. Analyze the user's request and determine which service handles it.

## Previous analysis (context, not final):
${priorIntent.reasoning}
Scores — image: ${priorIntent.scores?.image || 0}, audio: ${priorIntent.scores?.audio || 0}, app: ${priorIntent.scores?.app || 0}

## Critical disambiguation rules:

### APP BUILDING vs IMAGE GENERATION
- "make a calculator" → APP (functional tool, not a picture)
- "build a calculator app" → APP
- "create a to-do list" → APP
- "build a game" → APP
- "show me a sunset" → IMAGE
- "draw a cat" → IMAGE
- "generate an image of a sunset" → IMAGE
- **KEY DISTINCTION**: If the request asks for a FUNCTIONAL tool/utility/game/website → APP. If it asks for a VISUAL representation → IMAGE.

### Common misclassifications to avoid:
- "make a calculator" → APP, NOT image
- "build a todo app" → APP, NOT image
- "create a game" → APP, NOT image
- "draw a calculator" → IMAGE (explicit "draw" means show a picture)
- "show me a calculator" → IMAGE (show a picture of, not build one)

## Response Format

Return a JSON object with:
\`\`\`json
{
  "route": "text_generation" | "image_generation" | "audio_generation",
  "mode": "chat" | "app_building" | "image" | "audio",
  "prompt": "the original or enhanced prompt for the target service",
  "reasoning": "why this route was chosen"
}
\`\`\``

  try {
    const result = await streamText({
      model,
      system: llmSystemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxSteps: 1,
    })

    const reader = result.toDataStreamResponse().body?.getReader()
    if (!reader) {
      return {
        route: "text_generation",
        mode: priorIntent.intent === 'app' ? 'app_building' : 'chat',
        prompt: userMessage,
        reasoning: `LLM response empty, using prior: ${priorIntent.reasoning}`,
      }
    }

    const decoder = new TextDecoder()
    let fullText = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      for (const line of text.split('\n')) {
        if (!line || !line.startsWith('{')) continue
        try {
          const j = JSON.parse(line)
          if (j.type === 'text-delta' && j.textDelta) fullText += j.textDelta
        } catch {}
      }
    }

    const jsonMatch = fullText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        route: parsed.route || "text_generation",
        mode: parsed.mode || "chat",
        prompt: parsed.prompt || userMessage,
        reasoning: `LLM routed: ${parsed.reasoning || fullText.substring(0, 100)}`,
      }
    }

    return {
      route: "text_generation",
      mode: priorIntent.intent === 'app' ? 'app_building' : 'chat',
      prompt: userMessage,
      reasoning: `LLM parsing failed, using prior: ${priorIntent.reasoning}`,
    }
  } catch (err: any) {
    const appMode = priorIntent.intent === 'app' ? 'app_building' : 'chat'
    return {
      route: "text_generation",
      mode: appMode,
      prompt: userMessage,
      reasoning: `LLM error: ${err.message || 'unknown'}, using prior: ${priorIntent.reasoning}`,
    }
  }
}

// --- Provider model factory ---

const providerFactories: Record<string, (p: Provider) => any> = {
  openai: (p) => {
    const c = createOpenAI({ baseURL: p.base_url || p.url, apiKey: p.api_key || "dummy" })
    return c(p.model || "gpt-4o")
  },
  "openai-compatible": (p) => {
    const c = createOpenAI({ baseURL: p.base_url || p.url, apiKey: p.api_key || "dummy" })
    return c(p.model || "gpt-4o")
  },
  anthropic: (p) => {
    const { createAnthropic } = require("@ai-sdk/anthropic")
    return createAnthropic({ apiKey: p.api_key })(p.model || "claude-3-5-sonnet")
  },
  google: (p) => {
    const { createGoogleGenerativeAI } = require("@ai-sdk/google")
    return createGoogleGenerativeAI({ apiKey: p.api_key })(p.model || "gemini-1.5-pro")
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
  together: (p) => {
    const { createTogetherAI } = require("@ai-sdk/togetherai")
    return createTogetherAI({ apiKey: p.api_key })(p.model || "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo")
  },
  openrouter: (p) => {
    const c = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: p.api_key,
      headers: { "HTTP-Referer": "http://localhost:3000", "X-Title": "App Builder PWA" },
    })
    return c(p.model || "anthropic/claude-3.5-sonnet")
  },
}

function getModel(provider: Provider) {
  const factory = providerFactories[provider.type]
  if (factory) return factory(provider)
  return providerFactories.openai(provider) // default fallback
}

function getTextProvider(settings: Settings, selectedProvider?: string, purpose?: string): Provider {
  if (!settings.text_generation || settings.text_generation.length === 0) {
    throw new Error("No text generation provider configured")
  }
  if (selectedProvider) {
    const found = settings.text_generation.find(p => p.name === selectedProvider)
    if (found) return found
  }
  // Select by purpose (general vs app)
  if (purpose) {
    const byPurpose = settings.text_generation.find(p => p.purpose === purpose && p.enabled !== false)
    if (byPurpose) return byPurpose
  }
  const router = getRouterProvider(settings.text_generation)
  if (router) return router
  if (settings.text_generation[0]) return settings.text_generation[0]
  throw new Error("No enabled text generation provider")
}

async function handleChatRequest(body: any, settings: Settings) {
  let { messages, selectedProvider, selectedLanguage, purpose } = body
  if (!messages && body.message) {
    messages = [{ role: "user", content: body.message }]
  }

  const langInstruction = getLangInstruction(selectedLanguage)

  const provider = getTextProvider(settings, selectedProvider, purpose)
  const model = getModel(provider)

  const systemPrompt = `You are Srishti AI, a helpful assistant.

${langInstruction ? `## Language\n${langInstruction}\n` : ""}

## Guidelines
- Be concise and helpful
- For apps: return code in \`\`\`html\`\`\` blocks
- Apps must be mobile-first, mobile-screen optimized by default (max-width: 430px, centered, no extra padding) unless explicitly told otherwise
- **ALWAYS use vibrant, colorful gradients and themes** — never plain black/white`

  const result = await streamText({
    model,
    system: systemPrompt,
    messages,
    maxSteps: 3,
  })

  return result.toDataStreamResponse({
    headers: {
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// --- Handlers ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, selectedProvider, selectedLanguage, messages } = body

    if (!message && !messages) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const settings = loadSettings()
    const userMessage = message || messages?.filter((m: any) => m.role === 'user').pop()?.content || ""
    const routing = await routeTask(userMessage, selectedLanguage)

    // Safety: validate input before processing
    const safetyIssue = checkInput(userMessage)
    if (safetyIssue) {
      return NextResponse.json({
        error: safetyIssue.reason,
        routing: { route: "text_generation", mode: "chat", prompt: userMessage, reasoning: safetyIssue.reason },
        compliance: generateComplianceMetadata("text", selectedLanguage),
      })
    }

    // Safety: validate image/audio prompts
    if (routing.route === "image_generation") {
      const imgSafety = checkImagePrompt(routing.prompt)
      if (imgSafety) {
        return NextResponse.json({ error: imgSafety.reason, routing, compliance: generateComplianceMetadata("image", selectedLanguage) })
      }
    }
    if (routing.route === "audio_generation") {
      const audioSafety = checkAudioPrompt(routing.prompt)
      if (audioSafety) {
        return NextResponse.json({ error: audioSafety.reason, routing, compliance: generateComplianceMetadata("audio", selectedLanguage) })
      }
    }

    if (routing.route === "image_generation") {
      try {
        const imageUrl = await generateImage(routing.prompt)
        return NextResponse.json({
          imageUrl,
          routing,
          compliance: generateComplianceMetadata("image", selectedLanguage),
        })
      } catch (err: any) {
        return NextResponse.json({ error: err.message, routing }, { status: 503 })
      }
    }

    if (routing.route === "audio_generation") {
      try {
        const audioUrl = await generateAudio(routing.prompt)
        return NextResponse.json({
          audioUrl,
          routing,
          compliance: generateComplianceMetadata("audio", selectedLanguage),
        })
      } catch (err: any) {
        return NextResponse.json({ error: err.message, routing }, { status: 503 })
      }
    }

    try {
      return await handleChatRequest(body, settings)
    } catch (chatError: any) {
      console.error("Chat error:", chatError)
      return NextResponse.json({ error: chatError.message || "Chat failed" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Router error:", error)
    return NextResponse.json({ error: error.message || "Routing failed" }, { status: 500 })
  }
}

export async function GET() {
  const settings = loadSettings()
  const routerInstructions = loadRouterInstructions()

  return NextResponse.json({
    text_generation: (settings.text_generation || []).map(p => ({
      name: p.name, type: p.type, model: p.model, router: p.router || false,
    })),
    image_generation: (settings.image_generation || []).map(p => ({
      name: p.name, type: p.type, router: p.router || false, enabled: p.enabled !== false,
    })),
    audio_generation: (settings.audio_generation || []).map(p => ({
      name: p.name, type: p.type, router: p.router || false, enabled: p.enabled !== false,
    })),
    routerInstructions,
  })
}
