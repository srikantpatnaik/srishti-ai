import { NextRequest, NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"
import yaml from "js-yaml"

interface ImageProvider {
  name: string
  type: string
  base_url?: string
  url?: string
  api_key?: string
  enabled?: boolean
  steps?: number
  cfg_scale?: number
  width?: number
  height?: number
  clip_skip?: number
  output_format?: string
}

interface Settings {
  image_generation: ImageProvider[]
}

function loadSettings(): { image_generation?: ImageProvider } {
  try {
    const settingsPath = path.join(process.cwd(), "settings.yaml")
    const settingsContent = fs.readFileSync(settingsPath, "utf-8")
    const config = yaml.load(settingsContent) as Settings

    const imgProviders = config?.image_generation || []
    const provider = imgProviders.find(p => p.enabled !== false) || imgProviders[0]

    if (!provider) {
      return {
        image_generation: {
          name: "default",
          type: "stable-diffusion",
          base_url: "http://192.168.1.8:1234",
          enabled: false,
          steps: 4,
          cfg_scale: 1,
          width: 512,
          height: 512,
          clip_skip: 1,
          output_format: "png",
        },
      }
    }

    return {
      image_generation: {
        name: provider.name,
        type: provider.type,
        base_url: provider.base_url || provider.url || "http://192.168.1.8:1234",
        api_key: provider.api_key,
        enabled: provider.enabled ?? true,
        steps: provider.steps || 4,
        cfg_scale: provider.cfg_scale ?? 1,
        width: provider.width || 512,
        height: provider.height || 512,
        clip_skip: provider.clip_skip || 1,
        output_format: provider.output_format || "png",
      },
    }
  } catch (e) {
    console.error("Failed to load image settings:", e)
    return {
      image_generation: {
        name: "default",
        type: "stable-diffusion",
        base_url: "http://192.168.1.8:1234",
        enabled: false,
        steps: 4,
        cfg_scale: 1,
        width: 512,
        height: 512,
        clip_skip: 1,
        output_format: "png",
      },
    }
}
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, isIcon = false } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    const settings = loadSettings()
    const imgSettings = settings.image_generation

    if (!imgSettings || !imgSettings.enabled) {
      return NextResponse.json(
        { error: "Image generation is not enabled" },
        { status: 400 }
      )
    }

    // For app icons, use PNG format and 256x256 dimensions
    // For other images, use JPEG and default dimensions
    const width = isIcon ? 256 : imgSettings.width
    const height = isIcon ? 256 : imgSettings.height
    const outputFormat = isIcon ? "png" : "jpeg"
    const outputFilename = isIcon ? "app_icon.png" : `image_${Date.now()}.jpg`

    // Construct the prompt for better app icon generation
    let enhancedPrompt = prompt
    if (isIcon) {
      enhancedPrompt = `A high resolution mobile app icon of ${prompt}, clean design, centered, minimal background, professional`
    }

    const payload: any = {
      prompt: enhancedPrompt,
      cfg_scale: imgSettings.cfg_scale,
      steps: imgSettings.steps,
      width: width,
      height: height,
      seed: -1,
      clip_skip: imgSettings.clip_skip,
      output_format: outputFormat,
    }

    // Set response_format to base64 (url is for returning a URL to download)
    payload.response_format = "base64"
    if (outputFormat === "png") {
      payload.output_filename = "image.png"
    } else {
      payload.output_filename = "image.jpg"
    }

    const apiUrl = `${imgSettings.base_url}/sdapi/v1/txt2img`

    console.log(`Generating image with prompt: ${enhancedPrompt}`)
    console.log(`API URL: ${apiUrl}`)
    console.log(`Output format: ${outputFormat}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Image generation error:", errorText)
      return NextResponse.json(
        { error: `Image generation failed: ${response.statusText}` },
        { status: 500 }
      )
    }

    // Check content-type to determine response format
    const contentType = response.headers.get("content-type") || ""
    let imageUrl: string

    if (contentType.includes("application/json")) {
      // API returns JSON with base64 image
      const data = await response.json()
      console.log("Image API response:", JSON.stringify(data).substring(0, 500))

      if (data.images && data.images.length > 0) {
        const imageData = data.images[0]
        if (typeof imageData === 'string' && (imageData.startsWith('http') || imageData.startsWith('/'))) {
          imageUrl = imageData
        } else {
          const mimeType = outputFormat === "png" ? "image/png" : "image/jpeg"
          imageUrl = `data:${mimeType};base64,${imageData}`
        }
      } else if (data.url) {
        imageUrl = data.url
      } else if (data.image) {
        const mimeType = outputFormat === "png" ? "image/png" : "image/jpeg"
        imageUrl = `data:${mimeType};base64,${data.image}`
      } else {
        console.error("Unexpected API response:", data)
        return NextResponse.json(
          { error: "No image generated, unexpected response format" },
          { status: 500 }
        )
      }
    } else {
      // API returns raw binary image - convert to base64
      console.log("API returned raw binary image")
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64Image = buffer.toString("base64")
      const mimeType = outputFormat === "png" ? "image/png" : "image/jpeg"
      imageUrl = `data:${mimeType};base64,${base64Image}`
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      format: outputFormat,
    })
  } catch (error: any) {
    console.error("Image API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const settings = loadSettings()
  return NextResponse.json({
    enabled: settings.image_generation?.enabled || false,
    base_url: settings.image_generation?.base_url || "",
  })
}
