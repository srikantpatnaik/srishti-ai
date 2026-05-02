import { test, expect } from '@playwright/test'

test('mausam delhi → weather intent', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const consoleMessages: string[] = []
  page.on('console', msg => consoleMessages.push(msg.text()))

  await page.getByRole('textbox').fill('mausam delhi')
  await page.getByRole('textbox').press('Enter')

  // Wait for response
  await page.waitForTimeout(8000)

  // Check that weather intent was detected (debug log contains 'weather' + confidence)
  const debugLogs = consoleMessages.filter(m => m.includes('[debug]'))
  const weatherDebug = debugLogs.find(m => m.includes('weather') && m.includes('0.8'))
  expect(weatherDebug).toBeTruthy()

  // Check that weather card rendered (not an app)
  const text = await page.locator('body').textContent()
  expect(text).toContain('Delhi')
  expect(text).toContain('°')
})
