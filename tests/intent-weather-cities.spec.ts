import { test, expect } from '@playwright/test'

// Test weather card renders for any city via geocoding pipeline
const queries = [
  'weather ranchi',
  'weather kolkata',
  'mausam mumbai',
  'temperature chennai',
  'weather bhopal',
]

for (const query of queries) {
  test(`weather ${query} → card`, async ({ page }) => {
    await page.goto('http://localhost:3000')

    const consoleMessages: string[] = []
    page.on('console', msg => consoleMessages.push(msg.text()))

    await page.getByRole('textbox').fill(query)
    await page.getByRole('textbox').press('Enter')

    await page.waitForTimeout(10000)

    const body = await page.locator('body').textContent()

    // Intent detected as weather
    const debugLogs = consoleMessages.filter(m => m.includes('[debug]'))
    const weatherDebug = debugLogs.find(m => m.includes('weather'))
    expect(weatherDebug).toBeTruthy()

    // Card renders with temperature (any city name from geocoding)
    expect(body).toContain('°')

    // Card contains weather description (not error, not app)
    expect(body).not.toContain('Weather error')
    expect(body).not.toContain('unavailable')
  })
}
