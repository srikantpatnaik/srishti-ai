import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { streamText, tool } from "ai"
import * as fs from "fs"
import * as path from "path"
import yaml from "js-yaml"

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
    throw new Error(`Image generation failed: ${response.statusText} - ${errorText}`)
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

function routeTask(userMessage: string): { route: string; mode: string; prompt: string; reasoning: string } {
  const lowerMessage = userMessage.toLowerCase()

  const imageKeywords = ["image", "picture", "photo", "generate image", "create image", "draw", "make picture", "show me a", "show me an", "generate a", "create a", "make a", "make me a"]
  const audioKeywords = ["audio", "sound", "speech", "voice", "tts", "text to speech", "music", "song", "synthesize", "generate audio", "create audio"]
  const appKeywords = ["app", "build", "create app", "make app", "write code", "develop", "game", "web app", "mobile app"]

  const isImageRequest = imageKeywords.some(kw => lowerMessage.includes(kw)) && !appKeywords.some(kw => lowerMessage.includes(kw))
  const isAudioRequest = audioKeywords.some(kw => lowerMessage.includes(kw))
  const isAppRequest = appKeywords.some(kw => lowerMessage.includes(kw))

  console.log("RouteTask:", { lowerMessage, isImageRequest, isAudioRequest, isAppRequest })

  if (isImageRequest) {
    return {
      route: "image_generation",
      mode: "image",
      prompt: userMessage,
      reasoning: "User requested an image/picture generation"
    }
  }

  if (isAudioRequest) {
    return {
      route: "audio_generation",
      mode: "audio",
      prompt: userMessage,
      reasoning: "User requested audio/speech generation"
    }
  }

  if (isAppRequest) {
    return {
      route: "text_generation",
      mode: "app_building",
      prompt: userMessage,
      reasoning: "User requested to build an app or write code"
    }
  }

  return {
    route: "text_generation",
    mode: "chat",
    prompt: userMessage,
    reasoning: "Regular conversation or task"
  }
}

function getTextProvider(settings: Settings, selectedProvider?: string): Provider {
  if (selectedProvider) {
    const provider = settings.text_generation.find(p => p.name === selectedProvider)
    if (provider) return provider
  }
  return getRouterProvider(settings.text_generation) || settings.text_generation[0]
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

const announceSchema = z.object({
  phase: z.enum(["planning", "coding", "testing", "fixing", "ready"]),
  message: z.string().optional(),
})

const generateImageSchema = z.object({
  prompt: z.string(),
})

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

  const systemPrompt = `You are a helpful AI assistant.

${langInstruction ? `## Language\n${langInstruction}\n` : ""}
## Routing Rules
- Image request (image, picture, photo, draw) → call generateImage tool
- Audio request (audio, speech, voice, TTS) → call generateAudio tool
- App/Code request (build, create app, write code) → return HTML in markdown blocks
- Other → respond naturally

## App Building (when asked)
1. Call announce(phase: "planning")
2. Call announce(phase: "coding")
3. Return code:
\`\`\`html
<!DOCTYPE html>
<html>
...app code...
</html>
\`\`\`
4. Call announce(phase: "ready")

## Code Requirements
- Mobile-first, touch buttons min 44px
- Dark theme: background #1a1a2e, text #eaeaea, cards #16213e, accents #e94560`

  const result = await streamText({
    model,
    system: systemPrompt,
    messages: messages,
    tools: {
      announce: tool({
        description: "Show progress update (required before building)",
        parameters: announceSchema,
        execute: async ({ phase, message }: { phase: string; message?: string }) => {
          return { success: true, phase, message: message || "Working on it..." }
        },
      }),
      generateImage: tool({
        description: "Generate an image from a text description",
        parameters: generateImageSchema,
        execute: async ({ prompt }: { prompt: string }) => {
          try {
            const imageUrl = await generateImage(prompt)
            return { success: true, imageUrl }
          } catch (error) {
            return { success: false, error: "Image generation failed" }
          }
        },
      }),
    },
    maxSteps: 20,
    experimental_activeTools: ["announce", "generateImage"],
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
    const routing = routeTask(userMessage)

    if (routing.route === "image_generation") {
      const imageUrl = await generateImage(routing.prompt)
      return NextResponse.json({
        type: "image",
        imageUrl: imageUrl,
        routing: routing
      })
    }

    if (routing.route === "audio_generation") {
      const audioUrl = await generateAudio(routing.prompt)
      return NextResponse.json({
        type: "audio",
        audioUrl: audioUrl,
        routing: routing
      })
    }

    return handleChatRequest(body, settings)
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
