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
import * as fsPromises from "fs/promises"
import * as path from "path"

// Load settings from yaml
async function loadSettings() {
  try {
    const settingsPath = path.join(process.cwd(), "settings.yaml")
    const settingsContent = await fsPromises.readFile(settingsPath, "utf-8")
    
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
    const { messages, isAutonomous, selectedProvider, projectFolder } = await req.json()

    let effectiveProjectFolder = projectFolder || path.join(process.cwd(), "tmp", "default")
    
    // Ensure folder exists
    await fsPromises.mkdir(effectiveProjectFolder, { recursive: true })

    const model = getProvider(selectedProvider) as any

    const result = await streamText({
      model,
      system: `You are an autonomous AI software engineer 🤖. Your task is to build complete, production-ready web applications.

PROJECT FOLDER: ${effectiveProjectFolder}

AUTONOMOUS MODE:
- Always plan first, then implement 📝
- Write tests for all code ✅
- Fix errors automatically 🛠️
- Continue until the app is complete and ready for deployment 🚀
- Use minimal tokens - be concise in tool calls
- Save all project files to the PROJECT FOLDER specified above

WORKFLOW:
1. PLAN: Analyze requirements and create a development plan 📋
2. CODE: Implement the application with all files 💻
3. TEST: Write and run tests 🧪
4. FIX: Fix any errors automatically 🔧
5. DEPLOY: Prepare for deployment 🎉

RULES:
- Be efficient with tokens ⚡
- Always provide complete, working code ✨
- Include error handling 🛡️
- Write documentation 📚
- Make apps mobile-friendly and responsive 📱
- Use emojis liberally throughout your responses to make them friendly and engaging 😊🎨
- Be conversational and friendly in your tone 👋
- Celebrate progress with enthusiasm 🌟
- Use emojis for lists, steps, and key points 📌✅🔥

When in autonomous mode, continue working until the app is fully functional.

IMPORTANT: When starting each phase, announce it so the UI can show the current phase.

Remember: Make every response warm, friendly, and emoji-rich! 🌈✨🎯
`,
      messages,
      tools: {
        read: tool({
          description: "Read file content",
          parameters: readSchema,
          execute: async ({ path: filePath }) => {
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(effectiveProjectFolder, filePath)
            try {
              const content = await fsPromises.readFile(fullPath, "utf-8") as string
              return { success: true, content }
            } catch (error: any) {
              return { success: false, error: error.message }
            }
          },
        }),
        write: tool({
          description: "Write file content",
          parameters: writeSchema,
          execute: async ({ path: filePath, content }) => {
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(effectiveProjectFolder, filePath)
            const dir = path.dirname(fullPath)
            await fsPromises.mkdir(dir, { recursive: true })
            await fsPromises.writeFile(fullPath, content, "utf-8")
            return { 
              success: true, 
              filePath: fullPath.replace(process.cwd() + "/", ""),
              message: `Created: ${fullPath.replace(process.cwd() + "/", "")}`
            }
          },
        }),
        bash: tool({
          description: "Execute bash command",
          parameters: bashSchema,
          execute: async ({ command, timeout = 30000 }) => {
            try {
              const { exec } = await import("child_process")
              const { promisify } = await import("util")
              const execAsync = promisify(exec)
              const { stdout, stderr } = await execAsync(command, { 
                cwd: effectiveProjectFolder,
                timeout 
              })
              return { success: true, output: stdout, error: stderr }
            } catch (error: any) {
              return { success: false, error: error.message }
            }
          },
        }),
        announce: tool({
          description: "Announce current phase",
          parameters: announceSchema,
          execute: async ({ phase, message }) => {
            return { 
              success: true, 
              phase, 
              message: message || `Starting ${phase} phase`
            }
          },
        }),
      },
      maxSteps: settings.agent?.max_steps || 20,
      experimental_activeTools: isAutonomous ? ["announce", "read", "write", "bash"] : ["read", "write", "bash"],
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
