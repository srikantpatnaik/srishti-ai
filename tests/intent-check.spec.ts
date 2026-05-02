import { test, expect } from '@playwright/test'

test('check what matches for mausam delhi', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const consoleMessages: string[] = []
  page.on('console', msg => consoleMessages.push(msg.text()))

  await page.getByRole('textbox').fill('mausam delhi')
  await page.getByRole('textbox').press('Enter')

  await page.waitForTimeout(5000)

  const debugLogs = consoleMessages.filter(m => m.includes('[debug]'))
  console.log('=== ALL DEBUG ===')
  debugLogs.forEach(m => console.log(m))

  // Intent should be weather
  expect(debugLogs.some(m => m.includes('weather'))).toBe(true)
})
