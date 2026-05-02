import { test, expect } from '@playwright/test'

test('check bundled intent code works', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const consoleMessages: string[] = []
  page.on('console', msg => consoleMessages.push(msg.text()))

  await page.getByRole('textbox').fill('mausam delhi')
  await page.getByRole('textbox').press('Enter')

  await page.waitForTimeout(5000)

  const debugLogs = consoleMessages.filter(m => m.includes('[debug]'))
  console.log('DEBUG:', debugLogs)

  // Intent should be weather, not app
  const weatherMatch = debugLogs.find(m => m.includes('weather'))
  const appMatch = debugLogs.find(m => m.includes('app intent wins'))
  expect(weatherMatch).toBeTruthy()
  expect(appMatch).toBeFalsy()
})
