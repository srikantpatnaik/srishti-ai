import { test, expect } from '@playwright/test';

test.describe('Table Rendering Test', () => {
  test('should render table from chat response', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('textarea', { timeout: 15000 });

    // Type the test message
    const chatInput = page.locator('textarea');
    await chatInput.fill('compare carbs and proteins in a table');

    // Take screenshot before sending
    await page.screenshot({ path: 'test-results/before-send.png' });

    // Click the send button
    const sendButton = page.locator('button[title="Send"]');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(10000);

    // Take screenshot after response
    await page.screenshot({ path: 'test-results/after-response.png' });

    // Look for any tables in the response
    const tables = page.locator('table');
    const tableCount = await tables.count();
    console.log(`Tables found: ${tableCount}`);

    // Look for markdown code blocks (which might contain the table)
    const codeBlocks = page.locator('pre, code, [class*="code"], [class*="pre"]');
    const codeCount = await codeBlocks.count();
    console.log(`Code blocks found: ${codeCount}`);

    // Look for any assistant messages
    const assistantMessages = page.locator('[class*="assistant"], [class*="bot"], [class*="model"]');
    const assistantCount = await assistantMessages.count();
    console.log(`Assistant messages found: ${assistantCount}`);

    // Get the body text content
    const bodyText = await page.locator('body').textContent();
    console.log(`Body text (first 3000 chars): ${bodyText?.substring(0, 3000)}`);
  });
});