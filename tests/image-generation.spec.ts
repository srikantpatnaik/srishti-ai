import { test, expect, Page } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

const IMAGE_PATTERN = /(?:show\s+me\s+(?:a\s+)?(?:picture|photo|image)|(?:generate|create|draw|make)\s+(?:a\s+)?(?:picture|photo|image)|photo\s+of|picture\s+of|image\s+of)/i
const AUDIO_PATTERN = /(?:generate|create)\s+(?:an\s+)?(?:audio|music|song)|text\s+to\s+(?:speech|voice)|\btts\b|voice\s+synthesis|synthesize\s+voice|(?:create|make)\s+(?:an\s+)?sound/i

function buildSseStream(content: string): string {
  return [
    `event: stream-event`,
    `data: {"type":"start-response"}`,
    `event: stream-event`,
    `data: {"type":"text-delta","textDelta":"${content}","index":0}`,
    `event: stream-event`,
    `data: {"type":"stop"}`,
  ].join('\n')
}

async function mockImageResponse(page: Page) {
  await page.route('http://localhost:3000/api/chat', async (route) => {
    const request = route.request()
    if (request.method() !== 'POST') {
      return await route.continue()
    }

    const postData = JSON.parse(request.postData())
    const messages = postData.messages
    const userContent = messages[messages.length - 1].content

    if (IMAGE_PATTERN.test(userContent)) {
      return await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: buildSseStream('Here is your image.'),
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    if (AUDIO_PATTERN.test(userContent)) {
      return await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: buildSseStream('Here is your audio.'),
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    return await route.fallback()
  })
}

test.describe('Image Generation Intent', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('textarea', { timeout: 30000 })
    await mockImageResponse(page)
  })

  async function submitMessage(page: Page, text: string) {
    const textarea = page.locator('textarea')
    await textarea.focus()
    await page.waitForTimeout(100)
    await page.type('textarea', text, { delay: 5 })
    await page.waitForTimeout(200)
    await textarea.press('Enter')
  }

  test('detects "photo of X" as image intent', async ({ page }) => {
    await submitMessage(page, 'photo of dog riding cycle on moon surface : 2D cartoon style')
    const assistantMsg = page.locator('[data-testid="assistant-message"]')
    await expect(assistantMsg).toBeVisible({ timeout: 15000 })
    await expect(assistantMsg).toContainText(/image/i)
  })

  test('detects "picture of X" as image intent', async ({ page }) => {
    await submitMessage(page, 'picture of sunset')
    const assistantMsg = page.locator('[data-testid="assistant-message"]')
    await expect(assistantMsg).toBeVisible({ timeout: 15000 })
    await expect(assistantMsg).toContainText(/image/i)
  })

  test('handles image generation failure gracefully', async ({ page }) => {
    await page.unroute('http://localhost:3000/api/chat')
    await page.route('http://localhost:3000/api/chat', async (route) => {
      const request = route.request()
      if (request.method() === 'POST') {
        return await route.fulfill({
          status: 503,
          contentType: 'text/plain; charset=utf-8',
          body: 'Image provider unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      } else {
        return await route.continue()
      }
    })

    await submitMessage(page, 'photo of cat')
    const assistantMsg = page.locator('[data-testid="assistant-message"]')
    await expect(assistantMsg).toBeVisible({ timeout: 15000 })
    await expect(assistantMsg).toContainText(/image generation failed/i)
  })

  test('shows image in chat when generation succeeds', async ({ page }) => {
    await submitMessage(page, 'show me a photo')
    const assistantMsg = page.locator('[data-testid="assistant-message"]')
    await expect(assistantMsg).toBeVisible({ timeout: 15000 })
    await expect(assistantMsg).toContainText(/image/i)
  })

  test('detects "generate a picture" as image intent', async ({ page }) => {
    await submitMessage(page, 'generate a picture of a flower')
    const assistantMsg = page.locator('[data-testid="assistant-message"]')
    await expect(assistantMsg).toBeVisible({ timeout: 15000 })
    await expect(assistantMsg).toContainText(/image/i)
  })
})
