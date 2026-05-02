import { test, expect } from '@playwright/test'

test('verify mausam detection in browser', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const consoleMessages: string[] = []
  page.on('console', msg => {
    if (msg.text().includes('[debug]') || msg.text().includes('[chat]')) {
      consoleMessages.push(msg.text())
    }
  })

  await page.getByRole('textbox').fill('mausam delhi')
  await page.getByRole('textbox').press('Enter')

  await page.waitForTimeout(8000)

  const debugLogs = consoleMessages.filter(m => m.includes('[debug]'))
  console.log('DEBUG LOGS:', debugLogs)

  // Weather intent should be detected
  const weatherMatch = debugLogs.find(m => m.includes('weather') && m.includes('0.8'))
  expect(weatherMatch).toBeTruthy()
})
