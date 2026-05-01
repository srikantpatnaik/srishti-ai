import { test, expect } from '@playwright/test'

test.describe('Lighthouse Performance Audit', () => {
  test('homepage performance meets thresholds', async ({ page }) => {
    // Measure page load performance using Playwright's Web Vitals
    const metrics = await page.evaluate(async () => {
      // Get Navigation Timing API
      const nav = performance.getEntriesByType('navigation')[0]
      const navMetrics = nav
        ? {
            ttfb: nav.responseStart - nav.requestStart,
            domInteractive: nav.domInteractive - nav.startTime,
            domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
            load: nav.loadEventEnd - nav.startTime,
          }
        : null

      // Get Performance Observer entries for paint timing
      const paintEntries = performance.getEntriesByType('paint')
      const paintMetrics: Record<string, number> = {}
      paintEntries.forEach((entry: any) => {
        paintMetrics[entry.name] = entry.startTime
      })

      // Get resource timing for JS bundle sizes
      const resources = performance.getEntriesByType('resource')
        .filter((r: any) => r.initiatorType === 'script')
        .map((r: any) => ({
          name: r.name.split('/').pop() || r.name,
          size: Math.round(r.transferSize / 1024),
          duration: Math.round(r.duration),
        }))

      // Memory stats if available
      const mem = (performance as any).memory
      const memory = mem
        ? {
            heapUsed: mem.usedJSHeapSize / 1024 / 1024,
            heapTotal: mem.totalJSHeapSize / 1024 / 1024,
          }
        : null

      return { navMetrics, paintMetrics, resources, memory }
    })

    // Collect console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Navigate and wait for load
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Take screenshot for visual reference
    await page.screenshot({
      path: 'test-results/lighthouse-homepage.png',
      fullPage: true,
    })

    // Print metrics
    console.log('\n=== PAGE LOAD METRICS ===')
    if (metrics.navMetrics) {
      console.log(`  TTFB: ${Math.round(metrics.navMetrics.ttfb)}ms`)
      console.log(`  DOM Interactive: ${Math.round(metrics.navMetrics.domInteractive)}ms`)
      console.log(`  DOM Content Loaded: ${Math.round(metrics.navMetrics.domContentLoaded)}ms`)
      console.log(`  Full Load: ${Math.round(metrics.navMetrics.load)}ms`)
    }
    console.log('\n=== PAINT METRICS ===')
    for (const [name, time] of Object.entries(metrics.paintMetrics)) {
      console.log(`  ${name}: ${Math.round(time)}ms`)
    }
    console.log('\n=== JS BUNDLES ===')
    metrics.resources.forEach((r: any) => {
      console.log(`  ${r.name}: ${r.size}KB, ${r.duration}ms`)
    })
    if (metrics.memory) {
      console.log(`\n=== MEMORY ===`)
      console.log(`  Heap Used: ${metrics.memory.heapUsed.toFixed(1)}MB`)
      console.log(`  Heap Total: ${metrics.memory.heapTotal.toFixed(1)}MB`)
    }
    console.log(`\nConsole Errors: ${errors.length}`)
    errors.slice(0, 5).forEach(e => console.log(`  - ${e.substring(0, 100)}`))

    // Assertions - thresholds for a well-optimized PWA
    // Use Navigation Timing API (paint timing may not work in headless)
    expect(metrics.navMetrics.domInteractive).toBeLessThan(5000) // < 5s interactive
    expect(metrics.navMetrics.load).toBeLessThan(10000) // < 10s full load
    expect(metrics.memory.heapUsed).toBeLessThan(100) // < 100MB heap
    expect(errors.length).toBeLessThan(5) // No critical errors
  })
})
