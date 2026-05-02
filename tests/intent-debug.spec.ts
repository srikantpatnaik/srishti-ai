import { test, expect } from '@playwright/test'

test('debug intent detection', async ({ page }) => {
  await page.goto('http://localhost:3000')

  const consoleMessages: string[] = []
  page.on('console', msg => consoleMessages.push(msg.text()))

  // Inject a test script to call the detection directly
  const result = await page.evaluate(() => {
    // We can't directly call the detection fn from here, so we'll use the submit path
    return 'no direct access'
  })

  // Type and submit
  await page.getByRole('textbox').fill('mausam delhi')
  await page.getByRole('textbox').press('Enter')

  // Wait for response
  await page.waitForTimeout(8000)

  // Dump all console messages
  console.log('=== ALL CONSOLE MESSAGES ===')
  consoleMessages.forEach(m => console.log(m))
  console.log('=== END ===')

  // Check for the hasWeather log
  const weatherLogs = consoleMessages.filter(m => m.includes('hasWeather') || m.includes('hasApp'))
  console.log('Weather-related logs:', weatherLogs)

  expect(weatherLogs.length).toBeGreaterThan(0)
})
