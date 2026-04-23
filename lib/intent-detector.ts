// Collapsed regex patterns for intent detection

const imageIntentPatterns = [
  /show\s+me\s+(?:a\s+)?(?:picture|photo|image)/i,
  /(?:generate|create|draw|make)\s+(?:a\s+)?(?:picture|photo|image)/i,
  /(?:want|need)\s+(?:image|picture|photo)/i,
]

const audioIntentPatterns = [
  /(?:generate|create)\s+(?:an\s+)?(?:audio|music|song)/i,
  /text\s+to\s+(?:speech|voice)/i,
  /tts/i,
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
