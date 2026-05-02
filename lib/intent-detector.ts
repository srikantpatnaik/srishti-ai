// Multilingual intent detection — delegates to structured matcher (intent-matcher.ts)
// Language-specific keywords from intent-keywords.ts are now supplementary only

import { INTENT_KEYWORDS, DEFAULT_KEYWORDS } from "./intent-keywords"

export {
  INTENT_KEYWORDS,
  DEFAULT_KEYWORDS,
}

export {
  detectIntent,
  detectImageIntent,
  detectAudioIntent,
  detectAppIntent,
  detectWeatherIntent,
  detectCricketIntent,
  detectNewsIntent,
  detectMultiIntent,
  type IntentResult,
  type MultiIntentResult,
} from "./intent-matcher"

// Legacy language check (kept for backwards compatibility)
const SUPPORTED_LANGUAGES = new Set(Object.keys(INTENT_KEYWORDS))
export function isSupportedLanguage(lang: string): boolean {
  return SUPPORTED_LANGUAGES.has(lang)
}
