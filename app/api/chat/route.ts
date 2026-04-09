import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createMistral } from "@ai-sdk/mistral"
import { createGroq } from "@ai-sdk/groq"
import { createTogetherAI } from "@ai-sdk/togetherai"
import { streamText, tool } from "ai"
import { NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"

// Load settings from yaml
async function loadSettings() {
  try {
    const settingsPath = path.join(process.cwd(), "settings.yaml")
    const settingsContent = fs.readFileSync(settingsPath, "utf-8")
    
    const settings: any = {
      providers: [],
      default_provider: "qwen3.5-27B",
    }

    const lines = settingsContent.split("\n")
    let currentProvider: any = {}
    let inProviders = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith("- type:")) {
        if (Object.keys(currentProvider).length > 0) {
          settings.providers.push(currentProvider)
        }
        currentProvider = { type: trimmed.split(":")[1].trim().replace(/["']/g, "") }
        inProviders = true
      } else if (inProviders && trimmed.startsWith("name:")) {
        currentProvider.name = trimmed.split(":")[1].trim().replace(/["']/g, "")
      } else if (inProviders && (trimmed.startsWith("url:") || trimmed.startsWith("base_url:"))) {
        const urlMatch = trimmed.match(/^(?:url|base_url):\s*(.+)$/)
        if (urlMatch) {
          currentProvider.base_url = urlMatch[1].trim().replace(/["']/g, "")
        }
      } else if (inProviders && trimmed.startsWith("api_key:")) {
        const key = trimmed.split(":")[1].trim().replace(/["']/g, "")
        currentProvider.api_key = key.startsWith("${") && key.endsWith("}") 
          ? process.env[key.slice(2, -1)] || "" 
          : key
      } else if (inProviders && trimmed.startsWith("model:")) {
        currentProvider.model = trimmed.split(":")[1].trim().replace(/["']/g, "")
      } else if (inProviders && trimmed.startsWith("default:")) {
        currentProvider.default = trimmed.split(":")[1].trim() === "true"
        if (currentProvider.default) {
          settings.default_provider = currentProvider.name
        }
      } else if (trimmed === "providers:" || trimmed.startsWith("#")) {
        continue
      } else if (inProviders && !trimmed.startsWith("#") && !trimmed.startsWith("-") && !trimmed.includes(":")) {
        continue
      }
    }

    if (Object.keys(currentProvider).length > 0) {
      settings.providers.push(currentProvider)
    }

    return settings
  } catch (e) {
    console.error("Failed to load settings:", e)
    return {
      providers: [],
      default_provider: "qwen3.5-27B",
    }
  }
}

let settings: any = { providers: [], default_provider: "qwen3.5-27B" }
loadSettings().then((s) => { settings = s })

// Get provider from settings by name
function getProvider(providerName?: string) {
  let provider: any

  if (providerName) {
    provider = settings.providers.find((p: any) => p.name === providerName)
  }

  if (!provider) {
    provider = settings.providers.find((p: any) => p.default === true) || 
               settings.providers.find((p: any) => p.name === settings.default_provider)
  }

  if (!provider) {
    const openai = createOpenAI({
      baseURL: process.env.LLAMA_CPP_URL || "http://localhost:8080/v1",
      apiKey: process.env.LLAMA_CPP_API_KEY || "dummy",
    })
    return openai(process.env.DEFAULT_MODEL || "llama3")
  }

  switch (provider.type) {
    case "openai-compatible":
    case "openai":
      return createOpenAI({
        baseURL: provider.base_url || undefined,
        apiKey: provider.api_key || "dummy",
      })(provider.model || "gpt-4o")

    case "google":
    case "google-generative-ai":
      return createGoogleGenerativeAI({
        apiKey: provider.api_key,
      })(provider.model || "gemini-1.5-pro")

    case "anthropic":
      return createAnthropic({
        apiKey: provider.api_key,
      })(provider.model || "claude-3-5-sonnet")

    case "mistral":
      return createMistral({
        apiKey: provider.api_key,
      })(provider.model || "mistral-large-latest")

    case "groq":
      return createGroq({
        apiKey: provider.api_key,
      })(provider.model || "llama-3.1-70b-versatile")

    case "together":
      return createTogetherAI({
        apiKey: provider.api_key,
      })(provider.model || "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo")

    default:
      return createOpenAI({
        baseURL: provider.base_url || "http://localhost:8080/v1",
        apiKey: provider.api_key || "dummy",
      })(provider.model || "llama3")
  }
}

// Tool schemas - optimized for minimal tokens
const readSchema = z.object({
  path: z.string().describe("File path to read"),
})

const writeSchema = z.object({
  path: z.string().describe("File path to write"),
  content: z.string().describe("File content"),
})

const bashSchema = z.object({
  command: z.string().describe("Bash command to execute"),
  timeout: z.number().optional().describe("Timeout in ms"),
})

const announceSchema = z.object({
  phase: z.enum(["planning", "coding", "testing", "fixing", "ready"]).describe("Current phase"),
  message: z.string().optional().describe("Optional message about this phase"),
})

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: Request) {
  return NextResponse.json({
    providers: settings.providers.map((p: any) => ({
      name: p.name,
      type: p.type,
      model: p.model,
      default: p.default || false,
    })),
    defaultProvider: settings.default_provider,
  })
}

export async function POST(req: Request) {
  settings = await loadSettings()
  
  const controller = new AbortController()
  const { signal } = controller
  
  // Set up timeout
  const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

  try {
    const { messages, isAutonomous, selectedProvider } = await req.json()

    const model = getProvider(selectedProvider) as any

const result = await streamText({
      model,
      system: `You are a friendly AI assistant who builds simple apps 🤖.

IMPORTANT: This is for non-technical users. NO code, NO technical jargon!

CRITICAL: You MUST use the announce tool to show progress. This is REQUIRED!

STEP-BY-STEP PROCESS:
1. FIRST: Send friendly message with plan (2-3 bullet points):
   - VARY opening: "Awesome!", "Love this idea!", "Perfect choice!", "Sounds fun!"
   - VARY timing: "just a sec", "2 mins", "quickly", "moment"
   - Give 2-3 features as bullets
   - End with: "Wait a bit, building it soon! 😊"
   
   EXAMPLE: "Sounds fun! 🎉 I'll create a todo app for you:
     • Add and delete tasks
     • Mark things as done
     • Beautiful dark theme
     Wait a bit, building it soon! 😊"

2. THEN: Call announce tool (REQUIRED):
   announce(phase: "planning", message: "Thinking about your app...")
   
3. THEN: Call announce tool again:
   announce(phase: "coding", message: "Creating your app...")
   
4. THEN: Return HTML code block:
   \`\`\`html
   <!DOCTYPE html>
   ...complete app...
   \`\`\`
   
5. FINALLY: Call announce tool:
   announce(phase: "ready", message: "All done! Click the eye icon 👀 to see your app")

IMPORTANT: The announce tool MUST be called for each phase. Users need to see progress!

MOBILE-FIRST:
- Viewport: <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
- Max-width: 100%
- Touch buttons: min 44px height
- Responsive layout

DARK THEME:
- Background: #1a1a2e
- Text: #eaeaea
- Cards: #16213e
- Accents: #e94560

INLINE ONLY: All CSS and JS inline

NO technical terms! Keep it simple and friendly! 🎨
`,
      messages,
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
      },
      maxSteps: settings.agent?.max_steps || 20,
      experimental_activeTools: isAutonomous ? ["announce"] : [],
    })

    clearTimeout(timeoutId)

    return result.toDataStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
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
