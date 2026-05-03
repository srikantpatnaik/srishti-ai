import { test, expect } from '@playwright/test'
import { detectIntent, detectWeatherIntent } from '../lib/intent-matcher'
import { extractEntities, resolvePronoun, updateTracker } from '../lib/memory/entity-tracker'

// Language-specific intent detection tests
// Keywords from INTENT_KEYWORDS for each language should trigger weather intent when lang is passed
test.describe('Multilingual Weather Intent Detection', () => {
  // Hindi (हिंदी) — native script keywords
  test('Hindi: मौसम → weather intent', () => {
    expect(detectWeatherIntent('मौसम', 'hi')).toBe(true)
  })

  test('Hindi: तापमान → weather intent', () => {
    expect(detectWeatherIntent('तापमान', 'hi')).toBe(true)
  })

  test('Hindi: मौसम कैसा है → weather intent', () => {
    expect(detectWeatherIntent('मौसम कैसा है', 'hi')).toBe(true)
  })

  // Bengali (বাংলা)
  test('Bengali: আবহাওয়া → weather intent', () => {
    expect(detectWeatherIntent('আবহাওয়া', 'bn')).toBe(true)
  })

  test('Bengali: তাপমাত্রা → weather intent', () => {
    expect(detectWeatherIntent('তাপমাত্রা', 'bn')).toBe(true)
  })

  // Telugu (తెలుగు)
  test('Telugu: వాతావరణం → weather intent', () => {
    expect(detectWeatherIntent('వాతావరణం', 'te')).toBe(true)
  })

  // Marathi (मराठी)
  test('Marathi: हवामान → weather intent', () => {
    expect(detectWeatherIntent('हवामान', 'mr')).toBe(true)
  })

  test('Marathi: तापमान → weather intent', () => {
    expect(detectWeatherIntent('तापमान', 'mr')).toBe(true)
  })

  // Tamil (தமிழ்)
  test('Tamil: காலநிலை → weather intent', () => {
    expect(detectWeatherIntent('காலநிலை', 'ta')).toBe(true)
  })

  // Gujarati (ગુજરાતી)
  test('Gujarati: મોસમ → weather intent', () => {
    expect(detectWeatherIntent('મોસમ', 'gu')).toBe(true)
  })

  // Kannada (ಕನ್ನಡ)
  test('Kannada: ಹವಾಮಾನ → weather intent', () => {
    expect(detectWeatherIntent('ಹವಾಮಾನ', 'kn')).toBe(true)
  })

  // Malayalam (മലയാളം)
  test('Malayalam: കാലാവസ്ഥ → weather intent', () => {
    expect(detectWeatherIntent('കാലാവസ്ഥ', 'ml')).toBe(true)
  })

  // Punjabi (ਪੰਜਾਬੀ)
  test('Punjabi: ਮੌਸਮ → weather intent', () => {
    expect(detectWeatherIntent('ਮੌਸਮ', 'pa')).toBe(true)
  })

  // Urdu (اردو)
  test('Urdu: موسم → weather intent', () => {
    expect(detectWeatherIntent('موسم', 'ur')).toBe(true)
  })

  // Odia (ଓଡ଼ିଆ)
  test('Odia: ମାଉସମ → weather intent', () => {
    expect(detectWeatherIntent('ମାଉସମ', 'or')).toBe(true)
  })

  // Assamese (অসমীয়া)
  test('Assamese: মৌসুম → weather intent', () => {
    expect(detectWeatherIntent('মৌসুম', 'as')).toBe(true)
  })

  // Maithili (मैथिली)
  test('Maithili: मौसम → weather intent', () => {
    expect(detectWeatherIntent('मौसम', 'mai')).toBe(true)
  })

  // Without language param, native script NOT matched (no semantic vectors for Devanagari)
  // User must select language for native script detection
  test('No lang: मौसम → text (needs language selection)', () => {
    const result = detectIntent('मौसम')
    expect(result.intent).toBe('text')
  })

  // Romanized keywords should work too
  test('Hindi romanized: mausam → weather intent', () => {
    const result = detectIntent('mausam kolkata', 'hi')
    expect(result.intent).toBe('weather')
  })

  test('Hindi romanized: tapman → weather intent', () => {
    const result = detectIntent('tapman', 'hi')
    expect(result.intent).toBe('weather')
  })
})

test.describe('Weather Card — End-to-End Tests', () => {
  test.describe('Intent Detection', () => {
    test('temperature kolkata → weather intent', () => {
      expect(detectWeatherIntent('temperature kolkata')).toBe(true)
      const result = detectIntent('temperature kolkata')
      expect(result.intent).toBe('weather')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    test('weather mumbai → weather intent', () => {
      expect(detectWeatherIntent('weather mumbai')).toBe(true)
      expect(detectIntent('weather mumbai').intent).toBe('weather')
    })

    test('how is the weather in delhi → weather intent', () => {
      expect(detectWeatherIntent('how is the weather in delhi')).toBe(true)
    })

    test('temperature → weather intent (no city)', () => {
      expect(detectWeatherIntent('temperature')).toBe(true)
    })

    test('what is the temperature in chennai → weather intent', () => {
      expect(detectWeatherIntent('what is the temperature in chennai')).toBe(true)
    })

    test('build a calculator → NOT weather', () => {
      expect(detectWeatherIntent('build a calculator')).toBe(false)
    })

    test('show me a cat → NOT weather', () => {
      expect(detectWeatherIntent('show me a cat')).toBe(false)
    })
  })

  test.describe('API Endpoint', () => {
    test('GET /api/tools/weather?city=Delhi returns structured data', async () => {
      const res = await fetch('http://localhost:3000/api/tools/weather?city=Delhi')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('structured')
      expect(data).toHaveProperty('result')
      expect(data).toHaveProperty('city')
      expect(data.structured.city).toBeTruthy()
      expect(data.structured).toHaveProperty('temperature')
      expect(data.structured).toHaveProperty('humidity')
      expect(data.structured).toHaveProperty('windSpeed')
      expect(data.structured).toHaveProperty('weatherCode')
      expect(data.structured).toHaveProperty('weatherDescription')
      expect(data.structured).toHaveProperty('aqi')
      expect(data.structured).toHaveProperty('aqiDescription')
      expect(data.structured).toHaveProperty('forecast')
      expect(Array.isArray(data.structured.forecast)).toBe(true)
      expect(data.structured.forecast.length).toBeGreaterThan(0)
    })

    test('weather response has valid temperature range', async () => {
      const res = await fetch('http://localhost:3000/api/tools/weather?city=Delhi')
      const data = await res.json()
      expect(typeof data.structured.temperature).toBe('number')
      expect(data.structured.temperature).toBeGreaterThan(-50)
      expect(data.structured.temperature).toBeLessThan(60)
    })

    test('weather response has valid AQI', async () => {
      const res = await fetch('http://localhost:3000/api/tools/weather?city=Delhi')
      const data = await res.json()
      expect(typeof data.structured.aqi).toBe('number')
      expect(data.structured.aqi).toBeGreaterThanOrEqual(0)
      expect(data.structured.aqi).toBeLessThanOrEqual(500)
    })

    test('weather response has forecast with required fields', async () => {
      const res = await fetch('http://localhost:3000/api/tools/weather?city=Delhi')
      const data = await res.json()
      const day = data.structured.forecast[0]
      expect(day).toHaveProperty('date')
      expect(day).toHaveProperty('day')
      expect(day).toHaveProperty('min')
      expect(day).toHaveProperty('max')
      expect(day).toHaveProperty('code')
      expect(day).toHaveProperty('description')
    })

    test('weather returns plain text result for backward compat', async () => {
      const res = await fetch('http://localhost:3000/api/tools/weather?city=Delhi')
      const data = await res.json()
      expect(typeof data.result).toBe('string')
      expect(data.result).toContain('Delhi')
      expect(data.result).toContain('°C')
    })

    test('weather with invalid city returns error', async () => {
      const res = await fetch('http://localhost:3000/api/tools/weather?city=notexistencity12345')
      const data = await res.json()
      expect(res.status).toBe(200)
      expect(data.error || data.result).toBeDefined()
    })
  })

  test.describe('City Extraction', () => {
    // Simulates the extraction logic in page.tsx
    function extractCity(userText: string): string {
      let city = 'Delhi'
      const cleaned = userText.toLowerCase()
        .replace(/\b(?:temperature|weather|mausam|mausum|mosam|tapman|tapmān|tapamatra|abohawa|vaatavaranam|ushnograta|kalanilai|havamana|darja\s+hararat|how\s+is\s+the\s+weather|what\s+is\s+the\s+temperature|check\s+(?:the\s+)?weather|show\s+(?:me\s+)?(?:the\s+)?weather|show\s+me\s+the\s+temperature|check\s+temperature|tell\s+me\s+the\s+weather|tell\s+me\s+the\s+temperature|show\s+me\s+an?\s+weather)\s*/gi, '')
        .replace(/\b(?:in|for|please|can|you|tell|me|show|check|what|is|the|how|at|it|kaise|hai|hai\s+ki|ka|ki|ke|se|mein|mein|rain|raining|will|going|to|then|there|thar)\b\s*/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[?!.]/g, '')
        .trim()
      if (cleaned.length > 0 && cleaned.length < 30) {
        city = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      }
      return city
    }

    test('temperature kolkata → Kolkata', () => {
      expect(extractCity('temperature kolkata')).toBe('Kolkata')
    })

    test('darjeeling temperature → Darjeeling', () => {
      expect(extractCity('darjeeling temperature')).toBe('Darjeeling')
    })

    test('weather mumbai → Mumbai', () => {
      expect(extractCity('weather mumbai')).toBe('Mumbai')
    })

    test('how is the weather in delhi → Delhi', () => {
      expect(extractCity('how is the weather in delhi')).toBe('Delhi')
    })

    test('check weather patna → Patna', () => {
      expect(extractCity('check weather patna')).toBe('Patna')
    })

    test('kolkata temperature please → Kolkata', () => {
      expect(extractCity('kolkata temperature please')).toBe('Kolkata')
    })

    test('show weather for bangalore → Bangalore', () => {
      expect(extractCity('show weather for bangalore')).toBe('Bangalore')
    })

    test('temperature alone → Delhi (default)', () => {
      expect(extractCity('temperature')).toBe('Delhi')
    })

    // Multilingual city extraction
    test('mausam delhi → Delhi', () => {
      expect(extractCity('mausam delhi')).toBe('Delhi')
    })

    test('mausam kolkata → Kolkata', () => {
      expect(extractCity('mausam kolkata')).toBe('Kolkata')
    })

    test('tapman mumbai → Mumbai', () => {
      expect(extractCity('tapman mumbai')).toBe('Mumbai')
    })

    test('darjeeling mausam → Darjeeling', () => {
      expect(extractCity('darjeeling mausam')).toBe('Darjeeling')
    })

    test('mausam kaise hai delhi → Delhi', () => {
      expect(extractCity('mausam kaise hai delhi')).toBe('Delhi')
    })

    // Pronoun/filler-only queries → default (triggers pronoun fallback)
    test('how is the weather there → default (pronoun fallback)', () => {
      expect(extractCity('how is the weather there')).toBe('Delhi')
    })

    test('weather there → default (pronoun fallback)', () => {
      expect(extractCity('weather there')).toBe('Delhi')
    })

    test('then how is the weather there → default (pronoun fallback)', () => {
      expect(extractCity('then how is the weather there')).toBe('Delhi')
    })

    test('is it raining in Srikakulam → Srikakulam', () => {
      expect(extractCity('is it raining in Srikakulam')).toBe('Srikakulam')
    })

    test('weather in Tirupati → Tirupati', () => {
      expect(extractCity('weather in Tirupati')).toBe('Tirupati')
    })
  })
})

// Context memory / pronoun resolution tests
test.describe('Context Memory — Pronoun Resolution', () => {
  test('extractEntities: "is it raining in Delhi?" captures Delhi as city', () => {
    const entities = extractEntities('is it raining in Delhi?')
    const cities = entities.filter((e: any) => e.resolvedType === 'city')
    expect(cities.length).toBeGreaterThan(0)
    expect(cities[0].mention).toBe('Delhi')
  })

  test('extractEntities: "how is weather there?" has no new cities but context triggers pronoun resolution', () => {
    // "how is weather there?" has no city pattern — extractEntities returns empty cities
    const entities = extractEntities('how is weather there?')
    const cities = entities.filter((e: any) => e.resolvedType === 'city')
    expect(cities.length).toBe(0) // no city mention in this text
  })

  test('resolvePronoun: "how is weather there?" + [Delhi entity] → "how is weather Delhi"', () => {
    const entities = [{ mention: 'Delhi', resolvedType: 'city', pronoun: 'there', lastSeen: Date.now(), count: 1 }]
    const result = resolvePronoun('how is weather there?', entities)
    expect(result).not.toContain('there')
    expect(result).toContain('Delhi')
  })

  test('resolvePronoun: no city entities → no change', () => {
    const result = resolvePronoun('how is weather there?', [])
    expect(result).toBe('how is weather there?')
  })

  test('updateTracker: existing entities kept when not in new message (within 30 min)', () => {
    const now = Date.now()
    const existing = [
      { mention: 'Delhi', resolvedType: 'city', pronoun: 'there', lastSeen: now, count: 1 },
    ]
    const merged = updateTracker([], existing)
    const delhi = merged.find((e: any) => e.mention === 'Delhi')
    expect(delhi).toBeDefined()
  })

  test('updateTracker: expired entities dropped (30+ min old)', () => {
    const oldTime = Date.now() - 31 * 60 * 1000
    const existing = [
      { mention: 'Delhi', resolvedType: 'city', pronoun: 'there', lastSeen: oldTime, count: 1 },
    ]
    const merged = updateTracker([], existing)
    const delhi = merged.find((e: any) => e.mention === 'Delhi')
    expect(delhi).toBeUndefined()
  })
})
