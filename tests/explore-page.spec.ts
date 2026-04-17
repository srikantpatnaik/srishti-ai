import { test, expect } from '@playwright/test';

test.describe('Explore Page Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should explore page structure', async ({ page }) => {
    // Take screenshot
    await page.screenshot({ path: 'test-results/explore-page.png' });

    // Get all text content
    const bodyText = await page.locator('body').textContent();
    console.log('Full page text content:');
    console.log(bodyText);

    // Get all classes from the page
    const allClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const classes = new Set();
      elements.forEach(el => {
        if (el.className) {
          if (typeof el.className === 'string') {
            el.className.split(' ').forEach(c => classes.add(c));
          } else {
            // SVG className
            el.className.baseVal.split(' ').forEach(c => classes.add(c));
          }
        }
      });
      return Array.from(classes).sort();
    });

    console.log(`\n\nFound ${allClasses.length} unique classes:`);
    console.log(allClasses.join(', '));

    // Look for specific patterns
    const chatClasses = allClasses.filter(c => c.includes('chat') || c.includes('message'));
    console.log(`\nChat/message related classes: ${chatClasses.join(', ')}`);

    // Get HTML structure (first 5000 chars)
    const html = await page.locator('html').innerHTML();
    console.log('\n\nHTML structure (first 3000 chars):');
    console.log(html.substring(0, 3000));
  });
});