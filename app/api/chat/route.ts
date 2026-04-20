import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText, tool } from "ai"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// Ollama (llama.cpp) - Primary LLM endpoint
const OLLAMA_URL = process.env.LLAMA_CPP_URL || "http://192.168.1.8:11434/v1"
const ollamaClient = createOpenAI({
  baseURL: OLLAMA_URL,
  apiKey: process.env.LLAMA_CPP_API_KEY || "sk-123",
})

// Plano Gateway - fallback (requires manual restart of brightstaff + envoy)
const PLANO_GATEWAY_URL = process.env.PLANO_GATEWAY_URL || "http://localhost:12000/v1"
const planoClient = createOpenAI({
  baseURL: PLANO_GATEWAY_URL,
  apiKey: "EMPTY",
})

const announceSchema = z.object({
  phase: z.enum(["planning", "coding", "testing", "fixing", "ready"]).describe("Current phase"),
  message: z.string().optional().describe("Optional message about this phase"),
})

const generateImageSchema = z.object({
  prompt: z.string().describe("The image prompt/description"),
})

async function generateImage(prompt: string): Promise<string> {
  const response = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
  
  if (!response.ok) {
    throw new Error("Image generation failed")
  }
  
  const data = await response.json()
  return data.imageUrl
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

export async function POST(req: Request) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000)

  try {
    const { messages, isAutonomous, selectedProvider, selectedLanguage, sessionId } = await req.json()

    // Generate or reuse session ID for model affinity
    const affinityId = sessionId || uuidv4()

    const languageNames: Record<string, string> = {
      hi: "Hindi",
      bn: "Bengali",
      te: "Telugu",
      mr: "Marathi",
      ta: "Tamil",
      gu: "Gujarati",
      kn: "Kannada",
      ml: "Malayalam",
      pa: "Punjabi",
      ur: "Urdu",
      or: "Odia",
      as: "Assamese",
      mai: "Maithili",
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

## For image generation:
- Call generateImage tool when user asks to create/generate/draw an image`

const systemPrompt = langInstruction ? `${systemPromptBase}\n\nRespond in ${langInstruction} language` : systemPromptBase

    try {
      // Primary: Ollama (llama.cpp) direct connection
      const model = selectedProvider 
        ? ollamaClient(selectedProvider)
        : ollamaClient("qwen3.5-4B")

      const result = await streamText({
        model,
        system: systemPrompt,
        messages: messages,
        tools: {
          announce: tool({
            description: "Show progress update (required before building)",
            parameters: announceSchema,
            execute: async ({ phase, message }) => {
              return { 
                success: true, 
                phase, 
                message: message || "Working on it..."
              }
            },
          }),
          generateImage: tool({
            description: "Generate an image from a text description. Use this when user asks to create, generate, draw, or make an image or picture.",
            parameters: generateImageSchema,
            execute: async ({ prompt }) => {
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
        experimental_activeTools: isAutonomous ? ["announce", "generateImage"] : [],
        headers: {
          "X-Model-Affinity": affinityId, // Maintain model consistency across session
        },
      })

      clearTimeout(timeoutId)

      return result.toDataStreamResponse({
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Session-ID': affinityId, // Return session ID for client to reuse
        },
      })
    } catch (ollamaError: any) {
      console.warn("Ollama unavailable, falling back to Plano gateway:", ollamaError.message)
      
      // Fallback to Plano gateway
      const planoModel = selectedProvider 
        ? planoClient(selectedProvider)
        : planoClient("")

      const result = await streamText({
        model: planoModel,
        system: systemPrompt,
        messages: messages,
        tools: {
          announce: tool({
            description: "Show progress update (required before building)",
            parameters: announceSchema,
            execute: async ({ phase, message }) => {
              return { 
                success: true, 
                phase, 
                message: message || "Working on it..."
              }
            },
          }),
          generateImage: tool({
            description: "Generate an image from a text description.",
            parameters: generateImageSchema,
            execute: async ({ prompt }) => {
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
        experimental_activeTools: isAutonomous ? ["announce", "generateImage"] : [],
      })

      clearTimeout(timeoutId)

      return result.toDataStreamResponse({
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Session-ID': affinityId,
          'X-Fallback': 'true', // Indicate fallback was used
        },
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