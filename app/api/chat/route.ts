import { z } from "zod"
import { streamText, tool } from "ai"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { ollamaClient, planoClient } from "@/lib/clients"
import { detectImageIntent, detectAudioIntent } from "@/lib/intent-detector"
import { getLangInstruction } from "@/lib/i18n"

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

**Code Requirements (internal only - NEVER show user):**
- Complete HTML file with all CSS and JS inline
- Mobile-first design with viewport meta tag (max-width: 430px, centered)
- **ALWAYS use vibrant, colorful gradients and themes** — never plain black/white
- Use rich colors: gradients, accent colors, colorful buttons, themed backgrounds
- Touch-friendly buttons (min 44px height)
- Mobile screen optimized by default unless explicitly told otherwise (no extra padding/margins)

**IMPORTANT:** You must include the full HTML code block with triple backticks and html. The code will be automatically extracted and shown as a preview.

## For regular conversation:
- Be friendly and helpful
- Answer questions naturally
- No technical jargon

## For app building:
- Call announce tool ONCE with phase: "planning"
- IMMEDIATELY generate the COMPLETE HTML code in a single code block`

export async function GET(req: Request) {
  return NextResponse.json({
    gateway: process.env.PLANO_GATEWAY_URL || "http://localhost:12000/v1",
    routing: "dynamic",
    router: "qwen3.6-35B",
  })
}

async function streamWithFallback(
  systemPrompt: string,
  messages: any[],
  opts: { isAutonomous?: boolean; sessionId: string; signal?: AbortSignal },
) {
  const controller = new AbortController()

  // Listen for external abort signal (client disconnect / stop button)
  const onAbort = () => controller.abort()
  opts.signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const result = await streamText({
      model: ollamaClient("qwen3.6-35B"),
      system: systemPrompt,
      messages,
      tools: { announce: announceTool },
      maxSteps: 20,
      experimental_activeTools: opts.isAutonomous ? ["announce"] : [],
      headers: { "X-Model-Affinity": opts.sessionId },
      abortSignal: controller.signal,
      reasoning: opts.isAutonomous ? true : false,
    })

    return {
      response: result.toDataStreamResponse({
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Session-ID': opts.sessionId,
        },
      }),
      fallback: false,
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw err // Re-throw abort so POST handler can return 499
    }
    console.warn("Ollama unavailable, falling back to Plano gateway:", err.message)

    const result = await streamText({
      model: planoClient(""),
      system: systemPrompt,
      messages,
      tools: { announce: announceTool },
      maxSteps: 20,
      experimental_activeTools: opts.isAutonomous ? ["announce"] : [],
      abortSignal: controller.signal,
      reasoning: opts.isAutonomous ? true : false,
    })

    return {
      response: result.toDataStreamResponse({
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Session-ID': opts.sessionId,
          'X-Fallback': 'true',
        },
      }),
      fallback: true,
    }
  }
}

export async function POST(req: Request) {
  const { messages, isAutonomous, selectedLanguage, sessionId } = await req.json()
  const userMessage = messages?.filter((m: any) => m.role === 'user').pop()?.content || ""

  const affinityId = sessionId || uuidv4()
  const langInstruction = getLangInstruction(selectedLanguage)
  const systemPrompt = langInstruction
    ? `${systemPromptBase}\n\nRespond in ${langInstruction} language`
    : systemPromptBase

  const hasImage = detectImageIntent(userMessage)
  const hasAudio = detectAudioIntent(userMessage)

  let prompt = systemPrompt

  if (hasImage) {
    prompt = `${systemPrompt}\n\nFor image requests, respond with image generation guidance or use generateImage tool if available.`
  } else if (hasAudio) {
    prompt = `${systemPrompt}\n\nFor audio generation, respond with audio content or use generateAudio tool if available.`
  }

  try {
    const { response } = await streamWithFallback(prompt, messages, {
      isAutonomous,
      sessionId: affinityId,
      signal: req.signal, // Next.js built-in: fires when client disconnects
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
