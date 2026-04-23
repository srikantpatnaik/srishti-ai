import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText, tool } from "ai"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

const OLLAMA_URL = process.env.LLAMA_CPP_URL || "http://192.168.1.8:11434/v1"
const ollamaClient = createOpenAI({
  baseURL: OLLAMA_URL,
  apiKey: process.env.LLAMA_CPP_API_KEY || "sk-123",
})

const PLANO_GATEWAY_URL = process.env.PLANO_GATEWAY_URL || "http://localhost:12000/v1"
const planoClient = createOpenAI({
  baseURL: PLANO_GATEWAY_URL,
  apiKey: "EMPTY",
})

const announceSchema = z.object({
  phase: z.enum(["planning", "coding", "testing", "fixing", "ready"]).describe("Current phase"),
  message: z.string().optional().describe("Optional message about this phase"),
})

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

function detectImageIntent(message: string): boolean {
  const lowerMsg = message.toLowerCase()
  for (const pattern of imageIntentPatterns) {
    if (pattern.test(lowerMsg)) return true
  }
  return false
}

function detectAudioIntent(message: string): boolean {
  const lowerMsg = message.toLowerCase()
  for (const pattern of audioIntentPatterns) {
    if (pattern.test(lowerMsg)) return true
  }
  return false
}

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: Request) {
  return NextResponse.json({
    gateway: PLANO_GATEWAY_URL,
    routing: "dynamic",
    router: "qwen3.5-4B",
  })
}

async function generateImage(prompt: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const result = await streamText({
      model: ollamaClient("qwen3.5-4B"),
      system: "You are an image generation assistant. Respond with IMAGE_REQUEST: followed by the prompt.",
      messages: [{ role: "user", content: prompt }],
      maxSteps: 1,
    })

    clearTimeout(timeoutId)
    const text = await result.text
    const match = text.match(/IMAGE_REQUEST:\s*(.+)/i)
    if (!match) throw new Error("No image request detected")
    return match[1]
  } catch (error: any) {
    console.error("Image generation failed:", error)
    throw error
  }
}

async function generateAudio(prompt: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const result = await streamText({
      model: ollamaClient("qwen3.5-4B"),
      system: "You are an audio generation assistant. Respond with AUDIO_REQUEST: followed by the text to convert to speech.",
      messages: [{ role: "user", content: prompt }],
      maxSteps: 1,
    })

    clearTimeout(timeoutId)
    const text = await result.text
    const match = text.match(/AUDIO_REQUEST:\s*(.+)/i)
    if (!match) throw new Error("No audio request detected")
    return match[1]
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error("Chat API error:", error)
    if (error.name === 'AbortError') {
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

export async function POST(req: Request) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000)

  try {
    const { messages, isAutonomous, selectedProvider, selectedLanguage, sessionId } = await req.json()
    const userMessage = messages?.filter((m: any) => m.role === 'user').pop()?.content || ""

    const affinityId = sessionId || uuidv4()

    // NLP-based intent detection
    const hasImageIntent = detectImageIntent(userMessage)
    const hasAudioIntent = detectAudioIntent(userMessage)

    const languageNames: Record<string, string> = {
      hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi", ta: "Tamil",
      gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ur: "Urdu",
      or: "Odia", as: "Assamese", mai: "Maithili",
    }

    const langInstruction = selectedLanguage && languageNames[selectedLanguage]
      ? `You MUST respond in ${languageNames[selectedLanguage]} language only.`
      : ""

    const systemPromptBase = `You are Srishti AI - a friendly assistant that helps users create apps and games without any technical knowledge.

## CRITICAL: How to build apps/games

**When user wants to build/create something (app, game, website):**
1. Call announce(phase: "planning") tool ONCE (hidden from user)
2. IMMEDIATELY generate the COMPLETE HTML code in a single code block with triple backticks and html
3. After the code block, write a friendly message like "Your game is ready! Play it below"
4. DO NOT call announce multiple times - just call it once at the start
5. DO NOT output any text before or after the code block except the friendly message
6. DO NOT write tool call text like "announce(phase: "planning")" in your response

**Code Requirements (internal only - NEVER show user):**
- Complete HTML file with all CSS and JS inline
- Mobile-first design with viewport meta tag
- Dark theme: background #1a1a2e, text #eaeaea
- Touch-friendly buttons (min 44px height)

**IMPORTANT:** You must include the full HTML code block with triple backticks and html. The code will be automatically extracted and shown as a preview.

## For regular conversation:
- Be friendly and helpful
- Answer questions naturally
- No technical jargon

## For app building:
- Call announce tool ONCE with phase: "planning"
- IMMEDIATELY generate the COMPLETE HTML code in a single code block
- DO NOT call announce multiple times

## For regular conversation:
- Be friendly and helpful
- Answer questions naturally
- No technical jargon`

    const systemPrompt = langInstruction ? `${systemPromptBase}\n\nRespond in ${langInstruction} language` : systemPromptBase

    if (hasImageIntent) {
      try {
        const result = await streamText({
          model: ollamaClient("qwen3.5-4B"),
          system: systemPrompt,
          messages: messages,
          tools: {
            announce: tool({
              description: "Show progress update (required before building). Use only for app building tasks.",
              parameters: announceSchema,
              execute: async ({ phase, message }) => ({ success: true, phase, message: message || "Working on it..." }),
            }),
          },
          maxSteps: 20,
          experimental_activeTools: isAutonomous ? ["announce"] : [],
          headers: { "X-Model-Affinity": affinityId },
        })

        clearTimeout(timeoutId)
        return result.toDataStreamResponse({
          headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Session-ID': affinityId },
        })
      } catch (ollamaError: any) {
        console.warn("Ollama unavailable, falling back to Plano gateway:", ollamaError.message)

        const planoModel = selectedProvider ? planoClient(selectedProvider) : planoClient("")
        const result = await streamText({
          model: planoModel,
          system: systemPrompt,
          messages: messages,
          tools: {
            announce: tool({
              description: "Show progress update (required before building). Use only for app building tasks.",
              parameters: announceSchema,
              execute: async ({ phase, message }) => ({ success: true, phase, message: message || "Working on it..." }),
            }),
          },
          maxSteps: 20,
          experimental_activeTools: isAutonomous ? ["announce"] : [],
        })

        clearTimeout(timeoutId)
        return result.toDataStreamResponse({
          headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Session-ID': affinityId, 'X-Fallback': 'true' },
        })
      }
    }

    if (hasAudioIntent) {
      try {
        const result = await streamText({
          model: ollamaClient("qwen3.5-4B"),
          system: `${systemPrompt}\n\nFor audio generation, respond with audio content or use generateAudio tool if available.`,
          messages: messages,
          tools: {
            announce: tool({
              description: "Show progress update (required before building). Use only for app building tasks.",
              parameters: announceSchema,
              execute: async ({ phase, message }) => ({ success: true, phase, message: message || "Working on it..." }),
            }),
          },
          maxSteps: 20,
          experimental_activeTools: isAutonomous ? ["announce"] : [],
          headers: { "X-Model-Affinity": affinityId },
        })

        clearTimeout(timeoutId)
        return result.toDataStreamResponse({
          headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Session-ID': affinityId },
        })
      } catch (ollamaError: any) {
        console.warn("Ollama unavailable, falling back to Plano gateway:", ollamaError.message)

        const planoModel = selectedProvider ? planoClient(selectedProvider) : planoClient("")
        const result = await streamText({
          model: planoModel,
          system: `${systemPrompt}\n\nFor audio generation, respond with audio content or use generateAudio tool if available.`,
          messages: messages,
          tools: {
            announce: tool({
              description: "Show progress update (required before building). Use only for app building tasks.",
              parameters: announceSchema,
              execute: async ({ phase, message }) => ({ success: true, phase, message: message || "Working on it..." }),
            }),
          },
          maxSteps: 20,
          experimental_activeTools: isAutonomous ? ["announce"] : [],
        })

        clearTimeout(timeoutId)
        return result.toDataStreamResponse({
          headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Session-ID': affinityId, 'X-Fallback': 'true' },
        })
      }
    }

    // Regular text generation
    try {
      const result = await streamText({
        model: selectedProvider ? ollamaClient(selectedProvider) : ollamaClient("qwen3.5-4B"),
        system: systemPrompt,
        messages: messages,
        tools: {
          announce: tool({
            description: "Show progress update (required before building). Use only for app building tasks.",
            parameters: announceSchema,
            execute: async ({ phase, message }) => ({ success: true, phase, message: message || "Working on it..." }),
          }),
        },
        maxSteps: 20,
        experimental_activeTools: isAutonomous ? ["announce"] : [],
        headers: { "X-Model-Affinity": affinityId },
      })

      clearTimeout(timeoutId)
      return result.toDataStreamResponse({
        headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Session-ID': affinityId },
      })
    } catch (ollamaError: any) {
      console.warn("Ollama unavailable, falling back to Plano gateway:", ollamaError.message)

      const planoModel = selectedProvider ? planoClient(selectedProvider) : planoClient("")
      const result = await streamText({
        model: planoModel,
        system: systemPrompt,
        messages: messages,
        tools: {
          announce: tool({
            description: "Show progress update (required before building). Use only for app building tasks.",
            parameters: announceSchema,
            execute: async ({ phase, message }) => ({ success: true, phase, message: message || "Working on it..." }),
          }),
        },
        maxSteps: 20,
        experimental_activeTools: isAutonomous ? ["announce"] : [],
      })

      clearTimeout(timeoutId)
      return result.toDataStreamResponse({
        headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Session-ID': affinityId, 'X-Fallback': 'true' },
      })
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error("Chat API error:", error)
    if (error.name === 'AbortError') {
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
