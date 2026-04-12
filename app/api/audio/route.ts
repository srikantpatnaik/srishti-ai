import { NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"
import yaml from "js-yaml"

interface AudioProvider {
  name: string
  type: string
  base_url?: string
  url?: string
  api_key?: string
  model: string
  enabled?: boolean
}

interface Settings {
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
    return { audio_generation: [] }
  }
}

async function generateAudio(prompt: string): Promise<string> {
  const settings = loadSettings()
  const audioProviders = settings.audio_generation || []
  const provider = audioProviders.find(p => p.enabled !== false)

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

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const audioUrl = await generateAudio(prompt)
    return NextResponse.json({
      success: true,
      audioUrl: audioUrl,
    })
  } catch (error: any) {
    console.error("Audio API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const settings = loadSettings()
  return NextResponse.json({
    enabled: settings.audio_generation?.some(p => p.enabled !== false) || false,
    providers: settings.audio_generation?.map(p => ({
      name: p.name,
      type: p.type,
      enabled: p.enabled !== false,
    })) || [],
  })
}
