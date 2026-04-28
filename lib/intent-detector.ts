// Intent detection patterns — checked in priority order

const imageIntentPatterns = [
  /show\s+me\s+(?:a\s+)?(?:picture|photo|image)/i,
  /(?:generate|create|draw|make)\s+(?:a\s+)?(?:picture|photo|image)/i,
  /(?:want|need)\s+(?:image|picture|photo)/i,
  /(?:photo|picture|image)\s+(?:of|:)\b/i,
  /cartoon\s+(?:style|photo|image|picture)/i,
  /(?:photo|picture|image)\s+cartoon/i,
  /\b(?:photo|picture|image)\s*$/i,
  /(?:photo|picture|image)\s*\b/i,
  /(?:cartoon|illustration|sketch|drawing|painting|rendering)\b/i,
]

const audioIntentPatterns = [
  /(?:generate|create)\s+(?:an\s+)?(?:audio|music|song)/i,
  /text\s+to\s+(?:speech|voice)/i,
  /\btts\b/i,
  /voice\s+synthesis/i,
  /synthesize\s+voice/i,
  /(?:create|make)\s+(?:an\s+)?sound/i,
]

const appIntentPatterns = [
  /(?:build|create|make)\s+(?:an?\s+)?(?:web\s+)?app/i,
  /(?:build|create|make)\s+(?:a\s+)?(?:game|website)/i,
  /(?:develop)\s+(?:an?\s+)?app/i,
  /(?:write|generate)\s+code\s+for/i,
]

export function detectImageIntent(message: string): boolean {
  const lower = message.toLowerCase()
  return imageIntentPatterns.some(p => p.test(lower))
}

export function detectAudioIntent(message: string): boolean {
  const lower = message.toLowerCase()
  return audioIntentPatterns.some(p => p.test(lower))
}

export function detectAppIntent(message: string): boolean {
  const lower = message.toLowerCase()
  return appIntentPatterns.some(p => p.test(lower))
}

// --- LLM-based intent detection ---

export interface IntentResult {
  intent: 'image' | 'audio' | 'text' | 'clarify'
  confidence: number
  reasoning: string
  asksClarification: boolean
}

export interface MultiIntentResult {
  intents: ('image' | 'audio' | 'text')[]
  confidence: number
  reasoning: string
}

const IMAGE_KEYWORDS = [
  'photo', 'picture', 'image', 'draw', 'generate', 'create',
  'show me', 'cartoon', 'illustration', 'sketch', 'painting', 'rendering',
  'visual', 'design', 'logo', 'icon', 'artwork', 'art', 'portrait',
  'screenshot', 'mockup', 'diagram', 'infographic', 'poster',
]

const AUDIO_KEYWORDS = [
  'audio', 'music', 'song', 'voice', 'sound', 'speech', 'tts',
  'synthesize', 'podcast', 'jingle', 'beep', 'tone', 'melody',
]

const APP_KEYWORDS = [
  'build', 'app', 'application', 'game', 'website', 'code', 'program',
  'tool', 'software', 'develop', 'create an', 'make a',
]

export async function detectIntent(
  userMessage: string,
  model: string = "qwen3.6-35B",
): Promise<IntentResult> {
  const lower = userMessage.toLowerCase()

  // Fast path: explicit regex patterns
  if (imageIntentPatterns.some(p => p.test(lower))) {
    return { intent: 'image', confidence: 0.95, reasoning: "Explicit image intent pattern matched", asksClarification: false }
  }
  if (audioIntentPatterns.some(p => p.test(lower))) {
    return { intent: 'audio', confidence: 0.95, reasoning: "Explicit audio intent pattern matched", asksClarification: false }
  }

  // Keyword counting for ambiguous cases
  const imageCount = countMatches(lower, IMAGE_KEYWORDS)
  const audioCount = countMatches(lower, AUDIO_KEYWORDS)
  const appCount = countMatches(lower, APP_KEYWORDS)

  // If clear keyword winner, use regex result
  if (imageCount >= 2 || (imageCount >= 1 && audioCount === 0 && appCount === 0)) {
    return { intent: 'image', confidence: 0.75, reasoning: `Keyword match: ${imageCount} image keywords`, asksClarification: false }
  }
  if (audioCount >= 2 || (audioCount >= 1 && imageCount === 0 && appCount === 0)) {
    return { intent: 'audio', confidence: 0.75, reasoning: `Keyword match: ${audioCount} audio keywords`, asksClarification: false }
  }
  if (appCount >= 2 || (appCount >= 1 && imageCount === 0 && audioCount === 0)) {
    return { intent: 'text', confidence: 0.75, reasoning: `Keyword match: ${appCount} app keywords`, asksClarification: false }
  }

  // Image keywords dominate — prefer image over text
  if (imageCount >= 1 && appCount === 0) {
    return { intent: 'image', confidence: 0.6, reasoning: `Image keyword (${imageCount}) dominates`, asksClarification: false }
  }

  // Ambiguous case: use LLM to decide
  try {
    return await llmRoute(userMessage, model)
  } catch {
    // LLM failed — default to text
    return { intent: 'text', confidence: 0.5, reasoning: "LLM routing failed, defaulting to text", asksClarification: false }
  }
}

export function detectMultiIntent(message: string): MultiIntentResult {
  const lower = message.toLowerCase()
  const intents: ('image' | 'audio' | 'text')[] = []

  // Check for image intent
  const hasImage = imageIntentPatterns.some(p => p.test(lower)) || countMatches(lower, IMAGE_KEYWORDS) >= 1
  // Check for audio intent
  const hasAudio = audioIntentPatterns.some(p => p.test(lower)) || countMatches(lower, AUDIO_KEYWORDS) >= 1
  // Check for text intent (questions, explanations)
  const hasText = lower.includes('how') || lower.includes('what') || lower.includes('why') || lower.includes('explain') || lower.includes('tell me') || lower.includes('?')

  if (hasImage) intents.push('image')
  if (hasAudio) intents.push('audio')
  if (hasText) intents.push('text')

  // Default to text if nothing matched
  if (intents.length === 0) intents.push('text')

  return {
    intents,
    confidence: 0.8,
    reasoning: `Detected ${intents.length} intent(s): ${intents.join(', ')}`,
  }
}

function countMatches(text: string, keywords: string[]): number {
  let count = 0
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i')
    const matches = text.match(regex)
    if (matches) count += matches.length
  }
  return count
}

async function llmRoute(message: string, model: string): Promise<IntentResult> {
  const OLLAMA_URL = process.env.LLAMA_CPP_URL || "http://192.168.1.8:11434/v1"
  const OLLAMA_KEY = process.env.LLAMA_CPP_API_KEY || "sk-123"

  const systemPrompt = `You are a task router. Analyze the user's message and determine intent.

## Categories
- **image**: User wants to see or generate an image (photo, picture, drawing, illustration, cartoon, visual description)
- **audio**: User wants to hear or generate audio (speech, music, sound, voice)
- **text**: User wants conversation, information, app building, code generation, or general help

## Rules
- "man and dog on train" → image (describing a visual scene)
- "a sunset over the ocean" → image (describing a visual scene)
- "tell me about quantum physics" → text (asking for explanation)
- "build a calculator" → text (app building)
- "play some music" → audio (requesting audio)
- "draw a cat" → image (explicit image request)

## Response Format
Return ONLY JSON (no markdown, no explanation):
{"intent":"image|audio|text","confidence":0.0-1.0,"reasoning":"brief explanation"}

If you cannot determine intent, return:
{"intent":"clarify","confidence":0.0,"reasoning":"ambiguous","asksClarification":true}`

  try {
    const res = await fetch(OLLAMA_URL + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OLLAMA_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return { intent: 'text', confidence: 0.5, reasoning: "LLM returned no JSON", asksClarification: false }
    }

    const parsed = JSON.parse(jsonMatch[0]) as IntentResult
    return {
      intent: parsed.intent || 'text',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || 'LLM routed',
      asksClarification: parsed.asksClarification === true,
    }
  } catch (err: any) {
    return {
      intent: 'text',
      confidence: 0.5,
      reasoning: `LLM routing failed: ${err.message || "unknown"}`,
      asksClarification: false,
    }
  }
}
