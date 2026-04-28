import { createOpenAI } from "@ai-sdk/openai"

const OLLAMA_URL = process.env.LLAMA_CPP_URL || "http://192.168.1.8:11434/v1"
const OLLAMA_KEY = process.env.LLAMA_CPP_API_KEY

if (!OLLAMA_KEY) {
  throw new Error("Missing required env var: LLAMA_CPP_API_KEY")
}

export const ollamaClient = createOpenAI({
  baseURL: OLLAMA_URL,
  apiKey: OLLAMA_KEY,
})
