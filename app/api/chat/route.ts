import { z } from "zod"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createMistral } from "@ai-sdk/mistral"
import { createGroq } from "@ai-sdk/groq"
import { createTogetherAI } from "@ai-sdk/togetherai"
import { streamText, tool } from "ai"
import { RustTools } from "@/lib/rust-tools"

const rustTools = new RustTools()

// Load settings from yaml
function loadSettings() {
  try {
    const fs = require("fs")
    const path = require("path")
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

const settings = loadSettings()

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

const planSchema = z.object({
  description: z.string().describe("Development plan"),
})

const testSchema = z.object({
  filePath: z.string().describe("Test file path"),
  content: z.string().describe("Test content"),
})

const fixSchema = z.object({
  error: z.string().describe("Error to fix"),
  filePath: z.string().describe("File to fix"),
  fix: z.string().describe("The fix to apply"),
})

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: Request) {
  return Response.json({
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
  const { messages, isAutonomous, selectedProvider, projectFolder } = await req.json()

  const model = getProvider(selectedProvider) as any

  const result = streamText({
    model,
    system: `You are an autonomous AI software engineer. Your task is to build complete, production-ready web applications.

PROJECT FOLDER: ${projectFolder || "Current directory"}

AUTONOMOUS MODE:
- Always plan first, then implement
- Write tests for all code
- Fix errors automatically
- Continue until the app is complete and ready for deployment
- Use minimal tokens - be concise in tool calls
- Save all project files to the PROJECT FOLDER specified above

WORKFLOW:
1. PLAN: Analyze requirements and create a development plan
2. CODE: Implement the application with all files
3. TEST: Write and run tests
4. FIX: Fix any errors automatically
5. DEPLOY: Prepare for deployment

RULES:
- Be efficient with tokens
- Use rust tools for file operations (read, write, bash)
- Always provide complete, working code
- Include error handling
- Write documentation
- Make apps mobile-friendly and responsive

When in autonomous mode, continue working until the app is fully functional.`,
    messages,
    tools: {
      read: tool({
        description: "Read file content using Rust tools",
        parameters: readSchema,
        execute: async ({ path }) => {
          return await rustTools.read(path)
        },
      }),
      write: tool({
        description: "Write file content using Rust tools",
        parameters: writeSchema,
        execute: async ({ path, content }) => {
          return await rustTools.write(path, content)
        },
      }),
      bash: tool({
        description: "Execute bash command using Rust tools",
        parameters: bashSchema,
        execute: async ({ command, timeout = 30000 }) => {
          return await rustTools.bash(command, timeout)
        },
      }),
      plan: tool({
        description: "Create development plan",
        parameters: planSchema,
        execute: async ({ description }) => {
          return { success: true, plan: description }
        },
      }),
      test: tool({
        description: "Write and run tests",
        parameters: testSchema,
        execute: async ({ filePath, content }) => {
          try {
            const fs = await import("fs/promises")
            const pathModule = await import("path")
            const dir = pathModule.default.dirname(filePath)
            await fs.mkdir(dir, { recursive: true })
            await fs.writeFile(filePath, content, "utf-8")
            return { success: true, filePath }
          } catch (error: any) {
            return { success: false, error: error.message || "Unknown error" }
          }
        },
      }),
      fix: tool({
        description: "Fix errors in code",
        parameters: fixSchema,
        execute: async ({ error, filePath, fix }) => {
          try {
            const fs = await import("fs/promises")
            await fs.writeFile(filePath, fix, "utf-8")
            return { success: true, errorFixed: error }
          } catch (error: any) {
            return { success: false, error: error.message || "Unknown error" }
          }
        },
      }),
    },
    maxSteps: settings.agent?.max_steps || 20,
    experimental_activeTools: isAutonomous ? ["read", "write", "bash", "plan", "test", "fix"] : ["read", "write", "bash"],
  })

  return result.toDataStreamResponse()
}