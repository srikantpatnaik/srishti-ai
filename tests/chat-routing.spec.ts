import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Chat API — App Building Routing', () => {
  test('chat API accepts purpose=app and starts streaming', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        messages: [{ role: 'user', content: 'make a calculator app' }],
        purpose: 'app',
      },
    })
    expect(resp.status()).toBe(200)
    // Just read a small amount — don't wait for full stream
    const body = await resp.body().catch(() => Buffer.from(''))
    const text = body.toString()
    // Should start with SSE data
    expect(text.length).toBeGreaterThan(0)
  })

  test('chat API accepts purpose=general and starts streaming', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        messages: [{ role: 'user', content: 'hello' }],
        purpose: 'general',
      },
    })
    expect(resp.status()).toBe(200)
  })

  test('chat API handles message with app intent even when purpose=general', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        messages: [{ role: 'user', content: 'make a calculator app' }],
        purpose: 'general',
      },
    })
    expect(resp.status()).toBe(200)
  })
})

test.describe('Router API — Intent Routing', () => {
  test('router routes app intent to text_generation', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'make a calculator app' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing).toBeDefined()
    expect(json.routing.route).toBe('text_generation')
  })

  test('router routes image intent to image_generation', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'draw a cat' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing.route).toBe('image_generation')
  })

  test('router routes audio intent to audio_generation', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'text to speech hello' },
    })
    expect(resp.status()).toBe(503)
    const json = await resp.json()
    expect(json.routing.route).toBe('audio_generation')
  })

  test('router routes general chat to text_generation', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'hello how are you' },
    })
    expect(resp.status()).toBe(200)
    const json = await resp.json()
    expect(json.routing.route).toBe('text_generation')
  })
})
