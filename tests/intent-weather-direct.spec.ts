import { test, expect } from '@playwright/test'

test('weather delhi → weather intent', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const consoleMessages: string[] = []
  page.on('console', msg => consoleMessages.push(msg.text()))

  await page.getByRole('textbox').fill('weather delhi')
  await page.getByRole('textbox').press('Enter')

  await page.waitForTimeout(8000)

  const debugLogs = consoleMessages.filter(m => m.includes('[debug]'))
  console.log('DEBUG weather delhi:', debugLogs)

  // Check intent is weather with high confidence
  const weatherDebug = debugLogs.find(m => m.includes('weather') && m.includes('0.9'))
  expect(weatherDebug).toBeTruthy()
  expect(weatherDebug).toContain('weather')
})

test('mausam delhi → weather intent', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const consoleMessages: string[] = []
  page.on('console', msg => consoleMessages.push(msg.text()))

  await page.getByRole('textbox').fill('mausam delhi')
  await page.getByRole('textbox').press('Enter')

  await page.waitForTimeout(8000)

  const debugLogs = consoleMessages.filter(m => m.includes('[debug]'))
  console.log('DEBUG mausam delhi:', debugLogs)

  // Check intent is weather
  const weatherDebug = debugLogs.find(m => m.includes('weather') && m.includes('0.8'))
  expect(weatherDebug).toBeTruthy()
})
