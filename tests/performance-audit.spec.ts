import { test, expect } from '@playwright/test'

test.describe('Performance Audit — App Building', () => {
  test('baseline memory & navigation metrics', async ({ page }) => {
    // Start performance metrics collection
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
      }
    })

    // Navigate and wait for page to be fully loaded
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Capture baseline metrics
    const baseline = await page.evaluate(() => {
      const mem = (performance as any).memory
      return mem
        ? {
            heapUsed: mem.usedJSHeapSize / 1024 / 1024,
            heapTotal: mem.totalJSHeapSize / 1024 / 1024,
            heapLimit: mem.jsHeapSizeLimit / 1024 / 1024,
          }
        : { heapUsed: 'N/A', heapTotal: 'N/A', heapLimit: 'N/A' }
    })

    // Capture performance entries
    const perfData = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource')
        .filter(e => e.initiatorType === 'fetch')
        .map(e => ({
          name: e.name.split('/').pop() || e.name,
          duration: Math.round(e.duration),
          decodedSize: Math.round((e.decodedBodySize || 0) / 1024),
        }))
      const nav = performance.getEntriesByType('navigation')[0]
      return {
        navigation: nav
          ? {
              dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
              tcp: Math.round(nav.connectEnd - nav.connectStart),
              ttfb: Math.round(nav.responseStart - nav.requestStart),
              download: Math.round(nav.responseEnd - nav.responseStart),
              total: Math.round(nav.loadEventEnd - nav.startTime),
            }
          : null,
        fetches: entries.slice(-5),
      }
    })

    // Take screenshot of final state
    await page.screenshot({
      path: 'test-results/perf-audit-final.png',
      fullPage: true,
    })

    // Console warnings/errors
    console.log('\n=== Console Warnings/Errors ===')
    consoleMessages.forEach(msg => console.log(msg))

    // Performance data
    console.log('\n=== Memory Metrics ===')
    console.log('Baseline Heap Used:', baseline.heapUsed, 'MB')
    console.log('Baseline Heap Total:', baseline.heapTotal, 'MB')

    console.log('\nFetch Resources:')
    perfData.fetches.forEach((r: any) => {
      console.log(`  ${r.name}: ${r.duration}ms, ${r.decodedSize}KB`)
    })
    if (perfData.navigation) {
      console.log('\nNavigation Timing:')
      console.log(`  DNS: ${perfData.navigation.dns}ms`)
      console.log(`  TCP: ${perfData.navigation.tcp}ms`)
      console.log(`  TTFB: ${perfData.navigation.ttfb}ms`)
      console.log(`  Download: ${perfData.navigation.download}ms`)
      console.log(`  Total: ${perfData.navigation.total}ms`)
    }

    // Assertions
    expect(baseline.heapUsed).toBeLessThan(200) // < 200MB is acceptable for baseline
    expect(consoleMessages.filter(m => m.includes('[error]')).length).toBeLessThan(10) // Allow some API errors
  })
})
