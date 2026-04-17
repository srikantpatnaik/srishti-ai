import { test, expect } from '@playwright/test';

test.describe('Simple Page Test', () => {
  test('should load the page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Take screenshot immediately
    await page.screenshot({ path: 'test-results/loaded-page.png' });
    
    // Get all text content
    const bodyText = await page.locator('body').textContent();
    console.log('Page body text (first 2000 chars):');
    console.log(bodyText?.substring(0, 2000));
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Count all elements
    const allElements = await page.locator('*').count();
    console.log(`Total elements on page: ${allElements}`);
    
    // Count buttons
    const buttons = await page.locator('button').count();
    console.log(`Buttons on page: ${buttons}`);
    
    // Count inputs/textareas
    const inputs = await page.locator('input, textarea').count();
    console.log(`Inputs/Textareas on page: ${inputs}`);
    
    // Count divs with class containing 'message'
    const messageDivs = await page.locator('div[class*="message"]').count();
    console.log(`Message divs: ${messageDivs}`);
    
    // Count divs with class containing 'chat'
    const chatDivs = await page.locator('div[class*="chat"]').count();
    console.log(`Chat divs: ${chatDivs}`);
  });
});
