import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Image Generation Intent', () => {
  test('router routes image intent with routing metadata', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'show me a photo of a cat' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing).toBeDefined()
    expect(json.routing.route).toBe('image_generation')
  })

  test('router routes "picture of" as image intent', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'picture of sunset' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing.route).toBe('image_generation')
  })

  test('router routes "generate a picture" as image intent', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'generate a picture of a flower' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing.route).toBe('image_generation')
  })

  test('router routes "draw" as image intent', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'draw a cat' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing.route).toBe('image_generation')
  })

  test('router routes "photo of" as image intent', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'photo of dog riding cycle' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing.route).toBe('image_generation')
  })

  test('router routes "create an image" as image intent', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'create an image of a mountain' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing.route).toBe('image_generation')
  })

  test('router returns 503 for audio when provider disabled', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'generate audio hello world' },
    })
    expect(resp.status()).toBe(503)
    const json = await resp.json()
    expect(json.routing.route).toBe('audio_generation')
  })

  test('chat API accepts image intent messages', { timeout: 120000 }, async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        messages: [{ role: 'user', content: 'show me a photo' }],
        purpose: 'general',
        isAutonomous: false,
      },
    })
    expect(resp.status()).toBe(200)
    const text = await resp.text()
    expect(text.length).toBeGreaterThan(0)
  })

  test('chat API accepts app building intent messages', { timeout: 120000 }, async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        messages: [{ role: 'user', content: 'build a calculator' }],
        purpose: 'app',
        isAutonomous: false,
      },
    })
    expect(resp.status()).toBe(200)
    const text = await resp.text()
    expect(text).toContain('```')
  })
})
