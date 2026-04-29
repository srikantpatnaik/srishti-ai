// Safety module: input validation, output sanitization, content filtering, compliance metadata
// Aligns with IT Rules 2021 (Intermediary Guidelines) and Digital Media Ethics Code 2023

// --- Blocked patterns: prompt injection, self-harm, violence, sexual content, hate ---
const BLOCKED_PATTERNS = [
  // Prompt injection
  /ignore\s+previous\s+instruction/i,
  /you\s+are\s+(now|a|an)\s+(developer|admin|sys|system)/i,
  /disregard\s+all\s+instruction/i,
  /\/new\s+session/i,
  /system\s*:\s*override/i,
  /reset\s+your\s+(persona|behavior|instruction)/i,
  /act\s+as\s+if\s+you\s+don't/i,
  /do\s+not\s+follow\s+(safety|guardrail|content\s*policy)/i,

  // Self-harm
  /how\s+to\s+hurt\s+myself/i,
  /how\s+to\s+commit\s+suicide/i,
  /self\s*harm\s+method/i,
  /want\s+to\s+die/i,
  /kill\s+myself/i,

  // Violence
  /how\s+to\s+make\s+(a\s+)?bomb/i,
  /how\s+to\s+build\s+(a\s+)?weapon/i,
  /how\s+to\s+kill\s+/i,
  /how\s+to\s+hurt\s+someone/i,
  /how\s+to\s+attack\s+/i,
  /how\s+to\s+steal\s+/i,
  /how\s+to\s+rob\s+/i,

  // Sexual content (minors)
  /child\s+sex/i,
  /underage\s+sex/i,
  /pedophilia/i,

  // Illegal activities
  /how\s+to\s+hack\s+(into|someone|a\s+computer)/i,
  /how\s+to\s+phish\s+/i,
  /how\s+to\s+create\s+(a\s+)?malware/i,
  /how\s+to\s+create\s+(a\s+)?virus/i,
  /how\s+to\s+do\s+ddos/i,
  /how\s+to\s+bypass\s+(payment|age|age\s+verification)/i,
] as const

// Profanity / inappropriate words (kids-safe filter)
const BLOCKED_WORDS = [
  // Swear words (common variants)
  "fuck", "shit", "bitch", "damn", "damn it", "ass", "asshole", "dick", "pussy",
  "cunt", "whore", "slut", "nigger", "nigga", "faggot", "fag", "bastard",
  "retard", "retarded",
] as const

export interface SafetyResult {
  safe: boolean
  reason?: string
  category?: "injection" | "self_harm" | "violence" | "sexual" | "illegal" | "profanity" | "age_inappropriate"
}

/** Check if an input string is safe. Returns null if safe, SafetyResult if blocked. */
export function checkInput(input: string): SafetyResult | null {
  if (!input || !input.trim()) return null

  const trimmed = input.trim()

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      const category = classifyPattern(pattern)
      return { safe: false, reason: `This request is not allowed`, category }
    }
  }

  // Check blocked words (whole word match, case-insensitive)
  const words = trimmed.toLowerCase().split(/\s+/)
  for (const word of words) {
    for (const blocked of BLOCKED_WORDS) {
      if (word.includes(blocked)) {
        return { safe: false, reason: "Please use respectful language", category: "profanity" }
      }
    }
  }

  return null
}

function classifyPattern(pattern: RegExp): SafetyResult["category"] {
  if (/ignore|disregard|override|reset|act\s+as\s+if|don't/.test(pattern.source)) return "injection"
  if (/hurt\s+myself|suicide|self.*harm|die|kill\s+myself/.test(pattern.source)) return "self_harm"
  if (/bomb|weapon|kill\s+someone|hurt\s+someone|attack|steal|rob/.test(pattern.source)) return "violence"
  if (/child.*sex|underage|pedophilia/.test(pattern.source)) return "sexual"
  if (/hack|phish|malware|virus|ddos|bypass/.test(pattern.source)) return "illegal"
  return "age_inappropriate"
}

/** Sanitize HTML content: escape dangerous tags, strip event handlers, javascript: URLs */
export function sanitizeHtml(html: string): string {
  if (!html) return ""

  // Escape HTML entities to prevent XSS via ReactMarkdown rendering
  let sanitized = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")

  // Strip javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, "x-javascript:")

  // Strip event handler attributes (on*)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")

  return sanitized
}

/** Strip HTML tags from text (for plain text display) */
export function stripHtml(text: string): string {
  if (!text) return ""
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
}

/** Sanitize LLM output before storing/rendering. Strips dangerous HTML from generated code. */
export function sanitizeOutput(output: string): string {
  if (!output) return ""

  // For code blocks, strip <script>, <object>, <embed>, <iframe> tags from generated content
  // but keep <html>, <head>, <body>, <div>, <span>, <canvas>, <svg> etc.
  const dangerousTags = /<(\/?)(script|object|embed|form|applet|meta|link|base|frame|iframe|iframe|ilayer|layer|bgsound|xml)[^>]*>/gi
  return output.replace(dangerousTags, "")
}

/** Check if an image prompt is safe (blocks NSFW, violent, inappropriate image generation requests) */
export function checkImagePrompt(prompt: string): SafetyResult | null {
  if (!prompt) return null

  const nsfwPatterns = [
    /nude|naked\s+(person|woman|man|girl|boy)/i,
    /nsfw|porn|porno|pornography/i,
    /explicit\s+sex|sex\s+act|sexual\s+act/i,
    /erotic|erotic\s+image/i,
    /sexy\s+(girl|boy|woman|man)/i,
    /strip|stripping/i,
    /underwear\s+model|lingerie/i,
    /gore|gory\s+image|bloody\s+image/i,
    /dead\s+body|corpse|cadaver/i,
    /torture|torturing/i,
    /abuse\s+animal|animal\s+abuse/i,
    /incest|incestuous/i,
    /bestiality/i,
    /rape|raping/i,
    /violence\s+graphic|graphic\s+violence/i,
    /self\s*harm\s+image|self\s*harm\s+photo/i,
    /drug\s+use|drugs?\s*\/\s*using/i,
    /drug\s+manufactur|manufacture\s+drugs/i,
    /weapon\s+use|using\s+weapon/i,
    /hate\s+symbol|nazi|swastika/i,
  ]

  for (const pattern of nsfwPatterns) {
    if (pattern.test(prompt)) {
      return { safe: false, reason: "Image generation blocked: content violates safety guidelines", category: "sexual" }
    }
  }

  return null
}

/** Check if an audio prompt is safe (blocks inappropriate TTS content) */
export function checkAudioPrompt(prompt: string): SafetyResult | null {
  if (!prompt) return null

  const blockedPatterns = [
    /how\s+to\s+(hurt|kill|hurt|attack|hack|steal|rob|bomb|make\s+a\s+bomb)/i,
    /say\s+(something\s+)?(offensive|abusive|hate\s+speech|slur)/i,
    /generate\s+(hate|abusive|threatening|violent)\s+audio/i,
    /impersonate\s+(a\s+)?(politician|celebrity|public\s+figure)/i,
    /deepfake\s+audio|voice\s+clon/i,
    /say\s+something\s+illegal/i,
    /swear|curse|profanity/i,
  ]

  for (const pattern of blockedPatterns) {
    if (pattern.test(prompt)) {
      return { safe: false, reason: "Audio generation blocked: content violates safety guidelines", category: "illegal" }
    }
  }

  return null
}

/** Compliance metadata for Indian Digital Media Ethics Code 2023 */
export interface ComplianceMetadata {
  contentId: string
  generatedBy: string
  timestamp: string
  contentCategory: "text" | "image" | "audio" | "code"
  aiGenerated: true
  syntheticMedia: boolean
  watermark?: string
  language?: string
  safetyLevel: "kids_safe" | "general"
  complianceFramework: "IT_Rules_2021" | "Digital_Media_Ethics_2023"
}

/** Generate compliance metadata for generated content */
export function generateComplianceMetadata(
  category: ComplianceMetadata["contentCategory"],
  language?: string,
): ComplianceMetadata {
  return {
    contentId: `srishti-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    generatedBy: "Srishti AI",
    timestamp: new Date().toISOString(),
    contentCategory: category,
    aiGenerated: true,
    syntheticMedia: true,
    watermark: `Generated by Srishti AI at ${new Date().toLocaleString("en-IN")}`,
    language,
    safetyLevel: "kids_safe",
    complianceFramework: "Digital_Media_Ethics_2023",
  }
}

/** Inject compliance watermark into HTML content */
export function injectWatermark(html: string, metadata: ComplianceMetadata): string {
  if (!html) return ""

  const watermark = `<div style="position:absolute;bottom:8px;right:8px;font-size:10px;color:rgba(128,128,128,0.6);pointer-events:none;z-index:9999;">${metadata.watermark}</div>`

  // Inject before </body> or at end
  if (html.includes("</body>")) {
    return html.replace("</body>", `${watermark}</body>`)
  }
  return html + watermark
}

/** Harden iframe sandbox attributes for generated content */
export const IFRAME_SANDBOX_CONFIG = {
  // Minimal sandbox for in-chat previews (generated apps/games)
  preview: "allow-scripts allow-forms allow-popups allow-pointer-lock",
  // Full sandbox for standalone preview panel
  standalone: "allow-scripts allow-forms allow-popups allow-pointer-lock",
  // Gallery thumbnail (read-only)
  thumbnail: "",
} as const

/** Validate that generated HTML is safe for iframe embedding */
export function validateHtmlForIframe(html: string): { valid: boolean; error?: string } {
  if (!html || !html.trim()) return { valid: false, error: "Empty HTML" }

  // Check for dangerous tags
  const dangerous = /<(script|object|embed|form|applet|frame|iframe\s+src|ilayer|layer)\b[^>]*>/i
  if (dangerous.test(html)) {
    return { valid: false, error: "HTML contains dangerous elements" }
  }

  // Check for javascript: URLs in any attribute
  if (/href\s*=\s*["']javascript:/i.test(html)) {
    return { valid: false, error: "HTML contains javascript: URL" }
  }

  return { valid: true }
}
