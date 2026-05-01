// Structured intent detection with semantic tiebreaker
// Three-tier pipeline: phrase matching → word matching → semantic cosine similarity

type IntentType = 'image' | 'audio' | 'app' | 'text'

interface KeywordEntry {
  keyword: string
  intent: IntentType
  category: 'phrase' | 'word'
  priority: number
}

// Phrase patterns — exact multi-word matches, high priority
const PHRASES: KeywordEntry[] = [
  // App-building phrases
  { keyword: 'build a calculator', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'make a calculator', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'create a calculator', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'build a todo list', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'make a todo list', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'create a todo list', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'build a game', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'make a game', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'create a game', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'build a website', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'make a website', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'create a website', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'build an app', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'make an app', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'create an app', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'build a tool', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a tool', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a program', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a program', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a software', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a dashboard', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a dashboard', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a converter', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a converter', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a tracker', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a tracker', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a clock', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a clock', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a timer', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a timer', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a puzzle', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a puzzle', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a sudoku', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'make a sudoku', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'build a calculator app', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'make a calculator app', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'create a calculator app', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'todo list', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'todo app', intent: 'app', category: 'phrase', priority: 10 },
  { keyword: 'sudoku game', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'write code', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'write a program', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'develop an app', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'develop a game', intent: 'app', category: 'phrase', priority: 9 },
  { keyword: 'develop a website', intent: 'app', category: 'phrase', priority: 9 },

  // Audio phrases
  { keyword: 'text to speech', intent: 'audio', category: 'phrase', priority: 10 },
  { keyword: 'convert text to speech', intent: 'audio', category: 'phrase', priority: 10 },
  { keyword: 'text to voice', intent: 'audio', category: 'phrase', priority: 10 },
  { keyword: 'generate audio', intent: 'audio', category: 'phrase', priority: 10 },
  { keyword: 'generate music', intent: 'audio', category: 'phrase', priority: 10 },
  { keyword: 'generate a song', intent: 'audio', category: 'phrase', priority: 10 },
  { keyword: 'generate an audio', intent: 'audio', category: 'phrase', priority: 10 },
  { keyword: 'generate an song', intent: 'audio', category: 'phrase', priority: 10 },
  { keyword: 'create audio', intent: 'audio', category: 'phrase', priority: 9 },
  { keyword: 'create music', intent: 'audio', category: 'phrase', priority: 9 },
  { keyword: 'create a song', intent: 'audio', category: 'phrase', priority: 9 },
  { keyword: 'make audio', intent: 'audio', category: 'phrase', priority: 9 },
  { keyword: 'make music', intent: 'audio', category: 'phrase', priority: 9 },
  { keyword: 'make a song', intent: 'audio', category: 'phrase', priority: 9 },
  { keyword: 'voice synthesis', intent: 'audio', category: 'phrase', priority: 9 },
  { keyword: 'synthesize voice', intent: 'audio', category: 'phrase', priority: 9 },
  { keyword: 'read aloud', intent: 'audio', category: 'phrase', priority: 8 },
  { keyword: 'speak', intent: 'audio', category: 'phrase', priority: 7 },
  { keyword: 'pronounce', intent: 'audio', category: 'phrase', priority: 7 },

  // Image phrases
  { keyword: 'show me a picture', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me a photo', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me an image', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me a drawing', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me a painting', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me a cartoon', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me a sketch', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me a portrait', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me a logo', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me an icon', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me a', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'show me an', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate an image', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate an picture', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a picture', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a photo', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate an illustration', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate an artwork', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'draw a', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'draw an', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'draw the', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'draw me a', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'draw me an', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'draw me the', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'create a picture', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a photo', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create an image', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'create an illustration', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a drawing', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a painting', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a cartoon', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a sketch', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a portrait', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a logo', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create an icon', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make a picture', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make a photo', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make an image', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make an illustration', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make a drawing', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make a painting', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make a cartoon', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make a sketch', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make a portrait', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make a logo', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make an icon', intent: 'image', category: 'phrase', priority: 8 },
  { keyword: 'make me a picture', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a photo', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me an image', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a drawing', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a painting', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a cartoon', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a sketch', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a portrait', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a logo', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me an icon', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me an illustration', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a artwork', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a diagram', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me an infographic', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a poster', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make me a mockup', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make a diagram', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make an infographic', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make a poster', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'make a mockup', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a diagram', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create an infographic', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a poster', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'create a mockup', intent: 'image', category: 'phrase', priority: 9 },
  { keyword: 'generate a picture', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a photo', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a drawing', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a painting', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a cartoon', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a sketch', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a portrait', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a logo', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate an icon', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate an illustration', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate an artwork', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a diagram', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate an infographic', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a poster', intent: 'image', category: 'phrase', priority: 10 },
  { keyword: 'generate a mockup', intent: 'image', category: 'phrase', priority: 10 },
]

// Word keywords — single-word matches with word boundary regex
const WORDS: KeywordEntry[] = [
  // App-building core terms (high priority)
  { keyword: 'app', intent: 'app', category: 'word', priority: 8 },
  { keyword: 'application', intent: 'app', category: 'word', priority: 8 },
  { keyword: 'game', intent: 'app', category: 'word', priority: 8 },
  { keyword: 'website', intent: 'app', category: 'word', priority: 8 },
  { keyword: 'calculator', intent: 'app', category: 'word', priority: 8 },
  { keyword: 'tool', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'program', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'software', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'code', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'sudoku', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'puzzle', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'dashboard', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'converter', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'tracker', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'clock', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'timer', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'player', intent: 'app', category: 'word', priority: 6 },
  { keyword: 'viewer', intent: 'app', category: 'word', priority: 6 },
  { keyword: 'editor', intent: 'app', category: 'word', priority: 6 },
  { keyword: 'form', intent: 'app', category: 'word', priority: 6 },
  { keyword: 'page', intent: 'app', category: 'word', priority: 6 },
  { keyword: 'webpage', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'todolist', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'todo', intent: 'app', category: 'word', priority: 7 },
  { keyword: 'build', intent: 'app', category: 'word', priority: 6 },
  { keyword: 'create', intent: 'app', category: 'word', priority: 6 },
  { keyword: 'develop', intent: 'app', category: 'word', priority: 6 },
  { keyword: 'write', intent: 'app', category: 'word', priority: 6 },

  // Audio terms
  { keyword: 'podcast', intent: 'audio', category: 'word', priority: 8 },
  { keyword: 'tts', intent: 'audio', category: 'word', priority: 9 },
  { keyword: 'synthesize', intent: 'audio', category: 'word', priority: 7 },
  { keyword: 'music', intent: 'audio', category: 'word', priority: 8 },
  { keyword: 'song', intent: 'audio', category: 'word', priority: 8 },
  { keyword: 'voice', intent: 'audio', category: 'word', priority: 8 },
  { keyword: 'sound', intent: 'audio', category: 'word', priority: 8 },
  { keyword: 'audio', intent: 'audio', category: 'word', priority: 8 },
  { keyword: 'speech', intent: 'audio', category: 'word', priority: 8 },
  { keyword: 'jingle', intent: 'audio', category: 'word', priority: 7 },
  { keyword: 'tone', intent: 'audio', category: 'word', priority: 6 },
  { keyword: 'melody', intent: 'audio', category: 'word', priority: 6 },

  // Image terms — high certainty
  { keyword: 'photo', intent: 'image', category: 'word', priority: 7 },
  { keyword: 'picture', intent: 'image', category: 'word', priority: 7 },
  { keyword: 'image', intent: 'image', category: 'word', priority: 7 },
  { keyword: 'cartoon', intent: 'image', category: 'word', priority: 7 },
  { keyword: 'portrait', intent: 'image', category: 'word', priority: 7 },
  { keyword: 'mockup', intent: 'image', category: 'word', priority: 7 },
  { keyword: 'poster', intent: 'image', category: 'word', priority: 7 },
  { keyword: 'diagram', intent: 'image', category: 'word', priority: 7 },
  { keyword: 'infographic', intent: 'image', category: 'word', priority: 7 },

  // Ambiguous image words — low priority, easily overridden by app keywords
  { keyword: 'draw', intent: 'image', category: 'word', priority: 4 },
  { keyword: 'illustration', intent: 'image', category: 'word', priority: 4 },
  { keyword: 'sketch', intent: 'image', category: 'word', priority: 4 },
  { keyword: 'painting', intent: 'image', category: 'word', priority: 4 },
  { keyword: 'art', intent: 'image', category: 'word', priority: 3 },
  { keyword: 'design', intent: 'image', category: 'word', priority: 3 },
  { keyword: 'logo', intent: 'image', category: 'word', priority: 3 },
  { keyword: 'icon', intent: 'image', category: 'word', priority: 3 },
  { keyword: 'artwork', intent: 'image', category: 'word', priority: 3 },
  { keyword: 'rendering', intent: 'image', category: 'word', priority: 3 },
  { keyword: 'visual', intent: 'image', category: 'word', priority: 3 },
]

// Compile phrase regex once (sorted by length desc for longest-match-first)
const PHRASE_REGEX = (() => {
  const sorted = [...PHRASES]
    .filter(e => e.category === 'phrase')
    .sort((a, b) => b.keyword.length - a.keyword.length)
  const escaped = sorted.map(e => e.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return {
    regex: new RegExp(`(?:${escaped.join('|')})`, 'gi'),
    map: new Map(sorted.map(e => [e.keyword.toLowerCase(), e])),
  }
})()

// Word regex — single compiled pattern for all word keywords
const WORD_REGEX = (() => {
  const wordEntries = WORDS.filter(e => e.category === 'word')
  const sorted = [...new Map(wordEntries.map(e => [e.keyword.toLowerCase(), e])).values()]
  sorted.sort((a, b) => b.keyword.length - a.keyword.length)
  const escaped = sorted.map(e => e.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return {
    regex: new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'gi'),
    map: new Map(sorted.map(e => [e.keyword.toLowerCase(), e])),
  }
})()

function detectIntentStructured(message: string): {
  intent: IntentType
  confidence: number
  matchedPatterns: string[]
  reasoning: string
  scores: { image: number; audio: number; app: number }
} {
  const lower = message.toLowerCase()
  const scores: Map<string, { maxPriority: number; matched: string[] }> = new Map()

  // 1. Check ALL phrase patterns (use lastIndex loop)
  const phraseRe = PHRASE_REGEX.regex
  phraseRe.lastIndex = 0
  let phraseMatch
  while ((phraseMatch = phraseRe.exec(lower)) !== null) {
    const entry = PHRASE_REGEX.map.get(phraseMatch[0])
    if (entry) {
      const existing = scores.get(entry.intent)
      if (!existing || entry.priority > existing.maxPriority) {
        scores.set(entry.intent, { maxPriority: entry.priority, matched: [entry.keyword] })
      } else {
        existing.matched.push(entry.keyword)
      }
    }
  }

  // 2. Check ALL word patterns with word boundaries
  const wordRe = WORD_REGEX.regex
  wordRe.lastIndex = 0
  let wordMatch
  while ((wordMatch = wordRe.exec(lower)) !== null) {
    const entry = WORD_REGEX.map.get(wordMatch[0])
    if (entry) {
      const existing = scores.get(entry.intent)
      if (!existing || entry.priority > existing.maxPriority) {
        scores.set(entry.intent, { maxPriority: entry.priority, matched: [entry.keyword] })
      } else {
        existing.matched.push(entry.keyword)
      }
    }
  }

  console.log("DEBUG scores:", [...scores.entries()])
  // 3. Apply disambiguation rules
  const hasApp = scores.has('app')
  const hasImage = scores.has('image')
  const hasAudio = scores.has('audio')

  // "show me" phrase always wins (image) — "show me a calculator" = show a picture
  const showMePhrase = PHRASES.find(e =>
    e.category === 'phrase' &&
    e.intent === 'image' &&
    e.priority >= 10 &&
    (e.keyword.startsWith('show me ') || e.keyword.startsWith('show me an ')),
  )
  if (showMePhrase && (scores.get('image')?.maxPriority ?? 0) >= 10) {
    return {
      intent: 'image',
      confidence: 0.95,
      matchedPatterns: scores.get('image')!.matched,
      reasoning: '"show me" phrase overrides all other intents',
      scores: { image: scores.get('image')!.maxPriority, audio: 0, app: 0 },
    }
  }

  // App + image: compare actual scores, phrase patterns win over single words
  if (hasApp && hasImage) {
    const appScore = scores.get('app')!.maxPriority
    const imageScore = scores.get('image')!.maxPriority
    // Image phrase (priority >= 9) beats app word (priority < 9)
    // e.g., "create an image" (priority 10) beats "create" (priority 6)
    if (imageScore >= 9 && appScore < 8) {
      return {
        intent: 'image',
        confidence: 0.95,
        matchedPatterns: scores.get('image')!.matched,
        reasoning: `image phrase (${scores.get('image')!.matched.join(', ')}) beats app word (priority ${imageScore} >= 9, app ${appScore} < 8)`,
        scores: { image: imageScore, audio: 0, app: 0 },
      }
    }
    // App wins if it has high-priority app keywords (app, calculator, game, etc.)
    if (appScore >= 8) {
      return {
        intent: 'app',
        confidence: 0.95,
        matchedPatterns: scores.get('app')!.matched,
        reasoning: `app intent (${scores.get('app')!.matched.join(', ')}) wins over image (priority ${appScore} >= 6)`,
        scores: { image: scores.get('image')?.maxPriority || 0, audio: 0, app: appScore },
      }
    }
  }

  // App + audio: app wins
  if (hasApp && hasAudio) {
    return {
      intent: 'app',
      confidence: 0.95,
      matchedPatterns: scores.get('app')!.matched,
      reasoning: 'app intent wins over audio',
      scores: { image: 0, audio: scores.get('audio')?.maxPriority || 0, app: scores.get('app')!.maxPriority },
    }
  }

  // Image + audio: ambiguous
  if (hasImage && hasAudio) {
    return {
      intent: 'text',
      confidence: 0.45,
      matchedPatterns: [...(scores.get('image')?.matched || []), ...(scores.get('audio')?.matched || [])],
      reasoning: 'ambiguous: image + audio conflict',
      scores: { image: scores.get('image')!.maxPriority, audio: scores.get('audio')!.maxPriority, app: 0 },
    }
  }

  // 4. Calculate confidence from best priority
  let bestIntent: IntentType = 'text'
  let bestPriority = 0
  for (const [intent, data] of scores) {
    if (data.maxPriority > bestPriority) {
      bestPriority = data.maxPriority
      bestIntent = intent as IntentType
    }
  }

  const confidence = bestPriority > 0 ? Math.min(0.98, 0.5 + (bestPriority - 3) * 0.07) : 0.4

  return {
    intent: bestIntent,
    confidence,
    matchedPatterns: scores.get(bestIntent === 'text' ? 'image' : bestIntent)?.matched || [],
    reasoning: bestPriority > 0
      ? `matched ${bestIntent} intent via priority ${bestPriority}`
      : 'no intent matched, defaulting to text',
    scores: {
      image: scores.get('image')?.maxPriority || 0,
      audio: scores.get('audio')?.maxPriority || 0,
      app: scores.get('app')?.maxPriority || 0,
    },
  }
}

// Lightweight semantic similarity using pre-computed term vectors
const TERM_VECTORS: Record<string, Map<string, number>> = {
  image: new Map([
    ['show', 1], ['picture', 1], ['photo', 1], ['draw', 1],
    ['generate', 0.8], ['image', 1], ['create', 0.3],
    ['cartoon', 1], ['illustration', 1], ['sketch', 1],
    ['paint', 1], ['render', 0.8], ['visual', 1],
    ['logo', 1], ['icon', 1], ['art', 1], ['portrait', 1],
    ['design', 0.3], ['artwork', 1], ['diagram', 1],
    ['infographic', 1], ['poster', 1], ['mockup', 1],
  ]),
  audio: new Map([
    ['audio', 1], ['music', 1], ['song', 1], ['voice', 1],
    ['sound', 1], ['speech', 1], ['tts', 1], ['synthesize', 1],
    ['podcast', 1], ['jingle', 1], ['tone', 1], ['melody', 1],
    ['speak', 0.8], ['pronounce', 0.8], ['read', 0.5],
  ]),
  app: new Map([
    ['build', 1], ['app', 1], ['application', 1], ['game', 1],
    ['website', 1], ['code', 1], ['program', 1], ['tool', 1],
    ['software', 1], ['develop', 1], ['calculator', 1],
    ['todo', 1], ['sudoku', 1], ['clock', 1], ['timer', 1],
    ['dashboard', 1], ['converter', 1], ['tracker', 1],
    ['player', 1], ['viewer', 1], ['editor', 1], ['form', 1],
    ['page', 0.5], ['webpage', 1], ['write', 0.8],
    ['create', 0.3],
  ]),
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .split(/[\s,;:!?(){}[\]/\\'"`]+/)
    .filter(t => t.length > 2)
}

function cosineSimilarity(vector: Map<string, number>, tokens: string[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (const [term, va] of vector) {
    const vb = tokens.includes(term) ? 1 : 0
    dot += va * vb
    normA += va * va
  }
  normB = Math.sqrt(tokens.length)
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * normB)
}

function detectIntentSemantic(message: string): { image: number; audio: number; app: number } {
  const tokens = tokenize(message)
  return {
    image: cosineSimilarity(TERM_VECTORS.image, tokens),
    audio: cosineSimilarity(TERM_VECTORS.audio, tokens),
    app: cosineSimilarity(TERM_VECTORS.app, tokens),
  }
}

export interface IntentResult {
  intent: 'image' | 'audio' | 'app' | 'text'
  confidence: number
  reasoning: string
  asksClarification: boolean
  scores: { image: number; audio: number; app: number }
}

export function detectIntent(
  message: string,
  _lang?: string,
): IntentResult {
  const structured = detectIntentStructured(message)
  const semantic = detectIntentSemantic(message)

  // If structured confidence is high, use it directly
  if (structured.confidence >= 0.8) {
    return {
      intent: structured.intent,
      confidence: structured.confidence,
      reasoning: `${structured.reasoning} (structured match)`,
      asksClarification: structured.intent === 'text' && structured.confidence < 0.5,
      scores: {
        image: semantic.image,
        audio: semantic.audio,
        app: semantic.app,
      },
    }
  }

  // Use semantic scoring as tiebreaker
  const topIntent = Object.entries(semantic).sort((a, b) => b[1] - a[1])[0] as [string, number]
  const secondIntent = Object.entries(semantic).sort((a, b) => b[1] - a[1])[1] as [string, number]
  const gap = topIntent[1] - secondIntent[1]

  // If semantic scores are close, return text (needs LLM clarification)
  if (gap < 0.05) {
    return {
      intent: 'text',
      confidence: 0.4 + gap * 5,
      reasoning: `ambiguous: image=${topIntent[1].toFixed(3)} audio=${secondIntent[1].toFixed(3)} app=${(semantic.app + semantic.image + semantic.audio - topIntent[1] - secondIntent[1]).toFixed(3)} (gap ${gap.toFixed(3)})`,
      asksClarification: true,
      scores: semantic,
    }
  }

  // Top intent wins
  const intent = topIntent[0] as 'image' | 'audio' | 'app'
  const confidence = 0.5 + topIntent[1] * 0.48
  return {
    intent,
    confidence,
    reasoning: `semantic: ${intent}=${topIntent[1].toFixed(3)} beats ${secondIntent[0]}=${secondIntent[1].toFixed(3)} (gap ${gap.toFixed(3)})`,
    asksClarification: false,
    scores: semantic,
  }
}

// Convenience functions (backwards-compatible with intent-detector.ts exports)
export function detectImageIntent(message: string, _lang?: string): boolean {
  return detectIntent(message).intent === 'image'
}

export function detectAudioIntent(message: string, _lang?: string): boolean {
  return detectIntent(message).intent === 'audio'
}

export function detectAppIntent(message: string, _lang?: string): boolean {
  return detectIntent(message).intent === 'app'
}

export interface MultiIntentResult {
  intents: ('image' | 'audio' | 'text')[]
  confidence: number
  reasoning: string
}

export function detectMultiIntent(message: string, _lang?: string): MultiIntentResult {
  const result = detectIntent(message)
  const intents: ('image' | 'audio' | 'text')[] = []

  if (result.intent === 'image') intents.push('image')
  if (result.intent === 'audio') intents.push('audio')
  if (result.intent === 'app' || result.intent === 'text') intents.push('text')
  if (intents.length === 0) intents.push('text')

  return {
    intents,
    confidence: result.confidence,
    reasoning: `Detected ${intents.length} intent(s): ${intents.join(', ')}`,
  }
}
