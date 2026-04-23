export const languageNames: Record<string, string> = {
  hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi", ta: "Tamil",
  gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ur: "Urdu",
  or: "Odia", as: "Assamese", mai: "Maithili",
}

export function getLangInstruction(code?: string): string {
  if (!code || !languageNames[code]) return ""
  return `You MUST respond in ${languageNames[code]} language only.`
}
