import { NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import * as fs from "fs"
import * as path from "path"
import yaml from "js-yaml"
import { createOpenAI } from "@ai-sdk/openai"

// Ollama (llama.cpp) - Primary LLM endpoint
const OLLAMA_URL = process.env.LLAMA_CPP_URL || "http://192.168.1.8:11434/v1"
const ollamaClient = createOpenAI({
  baseURL: OLLAMA_URL,
  apiKey: process.env.LLAMA_CPP_API_KEY || "sk-123",
})

interface Provider {
  type: string
  name: string
  base_url?: string
  url?: string
  api_key?: string
  model: string
  router?: boolean
  enabled?: boolean
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

function loadSettings(): Settings {
  try {
    const settingsPath = path.join(process.cwd(), "settings.yaml")
    const settingsContent = fs.readFileSync(settingsPath, "utf-8")
    const config = yaml.load(settingsContent) as Settings
    return config
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

async function generateImage(prompt: string): Promise<string> {
  const settings = loadSettings()
  const imgProviders = settings.image_generation || []
  const provider = imgProviders.find(p => p.router === true) || imgProviders.find(p => p.enabled !== false)

  if (!provider) {
    throw new Error("No image generation provider available")
  }

  let outputFormat = provider.output_format || "png"
  if (outputFormat === "jpg") outputFormat = "jpeg"

  const payload = {
    prompt: prompt,
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
    if (typeof imageData === 'string' && (imageData.startsWith('http') || imageData.startsWith('/'))) {
      return imageData
    }
    const mimeType = (provider.output_format === "jpg" || provider.output_format === "jpeg") ? "image/jpeg" : "image/png"
    return `data:${mimeType};base64,${imageData}`
  } else if (data.url) {
    return data.url
  }

  throw new Error("No image generated")
}

async function generateAudio(prompt: string): Promise<string> {
  const settings = loadSettings()
  const audioProviders = settings.audio_generation || []
  const provider = audioProviders.find(p => p.router === true) || audioProviders.find(p => p.enabled !== false)

  if (!provider) {
    throw new Error("No audio generation provider available")
  }

  const baseUrl = provider.base_url || provider.url || ""
  const apiUrl = `${baseUrl}/v1/audio/speech`

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/wav",
      Authorization: `Bearer ${provider.api_key || ''}`,
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

// Image generation intent patterns - NLP-based detection
const imageIntentPatterns = [
  /show\s+me\s+(?:a\s+)?picture/i,
  /show\s+me\s+(?:a\s+)?photo/i,
  /show\s+me\s+(?:an\s+)?image/i,
  /generate\s+(?:an\s+)?image/i,
  /create\s+(?:an\s+)?picture/i,
  /create\s+(?:an\s+)?image/i,
  /draw\s+(?:an\s+)?picture/i,
  /draw\s+(?:an\s+)?image/i,
  /make\s+(?:an\s+)?picture/i,
  /make\s+(?:an\s+)?image/i,
  /generate\s+(?:an\s+)?picture/i,
  /make\s+(?:a\s+)?photo/i,
  /create\s+(?:a\s+)?photo/i,
  /draw\s+(?:a\s+)?photo/i,
  /generate\s+(?:a\s+)?photo/i,
  /want\s+image/i,
  /need\s+image/i,
  /want\s+picture/i,
  /need\s+picture/i,
  /want\s+photo/i,
  /need\s+photo/i,
  /show\s+me\s+an\s+image/i,
  /show\s+me\s+a\s+photo/i,
  /show\s+me\s+an\s+photo/i,
  /create\s+(?:a|an)\s+picture/i,
  /create\s+(?:a|an)\s+image/i,
  /draw\s+(?:a|an)\s+picture/i,
  /draw\s+(?:a|an)\s+image/i,
  /make\s+(?:a|an)\s+picture/i,
  /make\s+(?:a|an)\s+image/i,
  /generate\s+(?:a|an)\s+picture/i,
  /generate\s+(?:a|an)\s+image/i,
]

// Audio generation intent patterns
const audioIntentPatterns = [
  /generate\s+(?:an\s+)?audio/i,
  /create\s+(?:an\s+)?audio/i,
  /text\s+to\s+speech/i,
  /text\s+to\s+voice/i,
  /tts/i,
  /voice\s+synthesis/i,
  /synthesize\s+voice/i,
  /generate\s+(?:an\s+)?music/i,
  /generate\s+(?:an\s+)?song/i,
  /create\s+(?:an\s+)?sound/i,
  /make\s+(?:an\s+)?sound/i,
]

// App building intent patterns
const appIntentPatterns = [
  /build\s+an\s+app/i,
  /build\s+(?:a\s+)?web\s+app/i,
  /build\s+(?:a\s+)?mobile\s+app/i,
  /create\s+an\s+app/i,
  /create\s+(?:a\s+)?web\s+app/i,
  /make\s+an\s+app/i,
  /make\s+(?:a\s+)?web\s+app/i,
  /develop\s+an\s+app/i,
  /write\s+code\s+for/i,
  /generate\s+code\s+for/i,
  /build\s+a\s+game/i,
  /create\s+a\s+game/i,
  /make\s+a\s+game/i,
  /build\s+(?:a\s+)?website/i,
  /create\s+(?:a\s+)?website/i,
  /make\s+(?:a\s+)?website/i,
]

function detectImageIntent(message: string): boolean {
  const lowerMsg = message.toLowerCase()
  for (const pattern of imageIntentPatterns) {
    if (pattern.test(lowerMsg)) {
      return true
    }
  }
  return false
}

function detectAudioIntent(message: string): boolean {
  const lowerMsg = message.toLowerCase()
  for (const pattern of audioIntentPatterns) {
    if (pattern.test(lowerMsg)) {
      return true
    }
  }
  return false
}

function detectAppIntent(message: string): boolean {
  const lowerMsg = message.toLowerCase()
  for (const pattern of appIntentPatterns) {
    if (pattern.test(lowerMsg)) {
      return true
    }
  }
  return false
}

async function routeTask(userMessage: string): Promise<{ route: string; mode: string; prompt: string; reasoning: string }> {
  // Use NLP-based pattern matching instead of relying solely on LLM routing
  const hasImageIntent = detectImageIntent(userMessage)
  const hasAudioIntent = detectAudioIntent(userMessage)
  const hasAppIntent = detectAppIntent(userMessage)

  console.log("Intent detection - image:", hasImageIntent, "audio:", hasAudioIntent, "app:", hasAppIntent)

  // Priority: explicit intent > app building > regular chat
  if (hasImageIntent) {
    return {
      route: "image_generation",
      mode: "image",
      prompt: userMessage,
      reasoning: "Detected image generation intent using NLP pattern matching"
    }
  }

  if (hasAudioIntent) {
    return {
      route: "audio_generation",
      mode: "audio",
      prompt: userMessage,
      reasoning: "Detected audio generation intent using NLP pattern matching"
    }
  }

  if (hasAppIntent) {
    return {
      route: "text_generation",
      mode: "app_building",
      prompt: userMessage,
      reasoning: "Detected app building intent using NLP pattern matching"
    }
  }

  // Fallback to LLM-based routing for ambiguous cases
  const routerModel = ollamaClient("qwen3.5-4B")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  const result = await streamText({
    model: routerModel,
    system: `You are a task router. Analyze the user's message and determine if it requires image generation, audio generation, or text generation.

## Image Generation
Route to image_generation when user asks to:
- Generate/create/draw an image or picture
- Show me a [something]
- Make me a [picture/image]
- Create a photo of
- Generate an image of
Keywords: image, picture, photo, generate image, create image, draw, make picture

## Audio Generation
Route to audio_generation when user asks to:
- Generate/create audio or sound
- Text to speech, TTS
- Convert text to voice
- Generate music or song
Keywords: audio, sound, speech, voice, TTS, music, song, synthesize

## Text Generation
Route to text_generation for:
- App building
- Code generation
- Regular conversation
- All other requests

## Response Format
Return ONLY valid JSON:
{
  "route": "text_generation" | "image_generation" | "audio_generation",
  "mode": "chat" | "app_building" | "image" | "audio",
  "prompt": "the original prompt",
  "reasoning": "why this route was chosen"
}
`,
    messages: [{ role: "user", content: userMessage }],
    maxSteps: 1,
    headers: {
      "X-Request-ID": userMessage,
    },
  })

  clearTimeout(timeoutId)

  const text = await result.text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error("Router failed to return valid JSON, defaulting to text_generation")
    return {
      route: "text_generation",
      mode: "chat",
      prompt: userMessage,
      reasoning: "Router failed to parse response"
    }
  }

  try {
    const routing = JSON.parse(jsonMatch[0])
    console.log("Router result:", routing)
    return routing
  } catch (e) {
    console.error("Router JSON parse error:", e)
    return {
      route: "text_generation",
      mode: "chat",
      prompt: userMessage,
      reasoning: "Router failed to parse response"
    }
  }
}

function getTextProvider(settings: Settings, selectedProvider?: string): Provider {
  if (!settings.text_generation || settings.text_generation.length === 0) {
    throw new Error("No text generation provider configured")
  }
  if (selectedProvider) {
    const provider = settings.text_generation.find(p => p.name === selectedProvider)
    if (provider) return provider
  }
  const routerProvider = getRouterProvider(settings.text_generation)
  if (routerProvider) return routerProvider
  if (settings.text_generation[0]) return settings.text_generation[0]
  throw new Error("No enabled text generation provider")
}

function createOpenAIProvider(provider: Provider) {
  const { createOpenAI } = require("@ai-sdk/openai")
  return createOpenAI({
    baseURL: provider.base_url || provider.url || undefined,
    apiKey: provider.api_key || "dummy",
  })(provider.model || "gpt-4o")
}

function createAnthropicProvider(provider: Provider) {
  const { createAnthropic } = require("@ai-sdk/anthropic")
  return createAnthropic({
    apiKey: provider.api_key,
  })(provider.model || "claude-3-5-sonnet")
}

function createGoogleProvider(provider: Provider) {
  const { createGoogleGenerativeAI } = require("@ai-sdk/google")
  return createGoogleGenerativeAI({
    apiKey: provider.api_key,
  })(provider.model || "gemini-1.5-pro")
}

function createGroqProvider(provider: Provider) {
  const { createGroq } = require("@ai-sdk/groq")
  return createGroq({
    apiKey: provider.api_key,
  })(provider.model || "llama-3.1-70b-versatile")
}

function createMistralProvider(provider: Provider) {
  const { createMistral } = require("@ai-sdk/mistral")
  return createMistral({
    apiKey: provider.api_key,
  })(provider.model || "mistral-large-latest")
}

function createTogetherProvider(provider: Provider) {
  const { createTogetherAI } = require("@ai-sdk/togetherai")
  return createTogetherAI({
    apiKey: provider.api_key,
  })(provider.model || "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo")
}

function createOpenRouterProvider(provider: Provider) {
  const { createOpenAI } = require("@ai-sdk/openai")
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: provider.api_key,
    headers: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "App Builder PWA",
    },
  })(provider.model || "anthropic/claude-3.5-sonnet")
}

function getModel(provider: Provider) {
  switch (provider.type) {
    case "openai":
    case "openai-compatible":
      return createOpenAIProvider(provider)
    case "anthropic":
      return createAnthropicProvider(provider)
    case "google":
    case "google-generative-ai":
      return createGoogleProvider(provider)
    case "groq":
      return createGroqProvider(provider)
    case "mistral":
      return createMistralProvider(provider)
    case "together":
      return createTogetherProvider(provider)
    case "openrouter":
      return createOpenRouterProvider(provider)
    default:
      return createOpenAIProvider(provider)
  }
}

async function handleChatRequest(body: any, settings: Settings) {
  const { messages, selectedProvider, selectedLanguage } = body
  
  const languageNames: Record<string, string> = {
    hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi", ta: "Tamil",
    gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ur: "Urdu",
    or: "Odia", as: "Assamese", mai: "Maithili",
  }

  const langInstruction = selectedLanguage && languageNames[selectedLanguage]
    ? `You MUST respond in ${languageNames[selectedLanguage]} language only.`
    : ""

const provider = getTextProvider(settings, selectedProvider)
  const model = getModel(provider)

  const systemPrompt = `You are Srishti AI, a helpful assistant.

${langInstruction ? `## Language\n${langInstruction}\n` : ""}

## Guidelines
- Be concise and helpful
- For apps: return code in \`\`\`html\`\`\` blocks`

  const result = await streamText({
    model,
    system: systemPrompt,
    messages: messages,
    maxSteps: 3,
  })

  return result.toDataStreamResponse({
    headers: {
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, selectedProvider, selectedLanguage, messages } = body

    if (!message && !messages) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const settings = loadSettings()
    const userMessage = message || messages?.filter((m: any) => m.role === 'user').pop()?.content || ""
    const routing = await routeTask(userMessage)

    if (routing.route === "image_generation") {
      const imageUrl = await generateImage(routing.prompt)
      return NextResponse.json({
        imageUrl: imageUrl,
        routing: routing
      })
    }

    if (routing.route === "audio_generation") {
      const audioUrl = await generateAudio(routing.prompt)
      return NextResponse.json({
        audioUrl: audioUrl,
        routing: routing
      })
    }

    try {
      return await handleChatRequest(body, settings)
    } catch (chatError: any) {
      console.error("Chat error:", chatError)
      return NextResponse.json(
        { error: chatError.message || "Chat failed" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Router error:", error)
    return NextResponse.json(
      { error: error.message || "Routing failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const settings = loadSettings()
  const routerInstructions = loadRouterInstructions()
  
  const textProviders = settings.text_generation?.map(p => ({
    name: p.name,
    type: p.type,
    model: p.model,
    router: p.router || false,
  })) || []

  const imageProviders = settings.image_generation?.map(p => ({
    name: p.name,
    type: p.type,
    router: p.router || false,
    enabled: p.enabled !== false,
  })) || []

  const audioProviders = settings.audio_generation?.map(p => ({
    name: p.name,
    type: p.type,
    router: p.router || false,
    enabled: p.enabled !== false,
  })) || []

  return NextResponse.json({
    text_generation: textProviders,
    image_generation: imageProviders,
    audio_generation: audioProviders,
    routerInstructions: routerInstructions
  })
}
