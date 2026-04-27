const HTML_HEAD = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>`
const HTML_HEAD_CLOSE = `</title><style>*{margin:0;padding:0;box-sizing:border-box;}html,body{height:100%;width:100%;overflow:hidden;display:flex;justify-content:center;align-items:center;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e;color:#eaeaea;width:100vw;height:100vh;}.app-container{width:100%;height:100%;}</style></head><body><div class="app-container">`
const HTML_TAIL = `</div><script>window.parent.postMessage({ type: 'loaded' }, '*');</script></body></html>`

/** Wrap raw HTML code in a complete preview shell */
export function wrapHtml(code: string, title = "My App"): string {
  return `${HTML_HEAD}${title}${HTML_HEAD_CLOSE}${code}${HTML_TAIL}`
}

/** Create a blob URL from wrapped HTML code */
export function createBlobUrl(code: string, title = "My App"): string {
  const blob = new Blob([wrapHtml(code, title)], { type: 'text/html' })
  return URL.createObjectURL(blob)
}

/** Generate an app name from raw user input by stripping filler words */
const FILLER_WORDS = ['a', 'an', 'the', 'make', 'make a', 'build', 'build a', 'create', 'create a', 'can you', 'please', 'i want', 'build me', 'create me', 'app', 'application', 'in', 'telugu', 'hindi', 'tamil', 'kannada', 'malayalam', 'bengali', 'marathi', 'gujarati', 'your', 'my', 'its', 'this', 'that']

export function generateAppName(rawText: string, fallback = "My App"): string {
  let name = rawText.replace(/```html[\s\S]*?```/g, '').trim() || fallback
  FILLER_WORDS.forEach(word => {
    name = name.replace(new RegExp('\\b' + word + '\\b', 'gi'), ' ')
  })
  name = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  const words = name.split(' ').filter(w => w.trim().length > 0)
  let result = words.slice(0, 2).join(' ').trim() || fallback
  result = capitalizeWords(result)
  return result || fallback
}

function capitalizeWords(s: string): string {
  return s.split(' ').map((w, i) => {
    const c = w.trim()
    if (!c) return ''
    return i === 0 ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : c.toLowerCase()
  }).join(' ').trim()
}

/** Generate a file name from raw prompt text */
export function generateFileName(rawPrompt: string, fallback = "image"): string {
  const imageFillers = ['a', 'an', 'the', 'generate', 'show', 'me', 'picture', 'photo', 'image', 'of', 'create', 'make']
  let name = rawPrompt
  imageFillers.forEach(word => {
    name = name.replace(new RegExp('\\b' + word + '\\b', 'gi'), ' ')
  })
  name = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  const words = name.split(' ').filter(w => w.trim().length > 0)
  let fileName = words.slice(0, 4).join('-').trim() || fallback
  fileName = fileName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()
  return fileName || fallback
}

/** Extract HTML code from an assistant message */
export function extractHtmlCode(msg: any): string | null {
  if (msg.role === 'assistant' && msg.content) {
    const match = msg.content.match(/```html([\s\S]*?)```/)
    if (match) return match[1].trim()
  }
  return null
}

/** Find the latest HTML code from a list of messages */
export function findLatestHtmlCode(messages: any[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const code = extractHtmlCode(messages[i])
    if (code) return code
  }
  return null
}
