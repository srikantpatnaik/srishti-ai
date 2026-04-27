import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Chat Spinner and Tick', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });
  });

  test('spinner should appear on user message submit', async ({ page }) => {
    const chatInput = page.locator('textarea');
    await chatInput.fill('Hello world');
    await chatInput.press('Enter');

    // Spinner should appear in bottom-right of user message bubble
    const spinner = page.getByTestId('message-spinner');
    await expect(spinner).toBeVisible({ timeout: 10000 });
  });

  test('tick should replace spinner after response completes', async ({ page }) => {
    const chatInput = page.locator('textarea');
    await chatInput.fill('Hello');
    await chatInput.press('Enter');

    // Wait for assistant response to appear
    const assistantMsg = page.locator('[data-testid="assistant-message"]');
    await expect(assistantMsg).toBeVisible({ timeout: 30000 });

    // Tick should be visible on user message
    const tick = page.getByTestId('message-tick');
    await expect(tick).toBeVisible({ timeout: 10000 });

    // Spinner should no longer be visible
    const spinner = page.getByTestId('message-spinner');
    await expect(spinner).not.toBeVisible();
  });

  test('spinner should not appear on idle status', async ({ page }) => {
    // Page loads with status=idle, no spinner should be visible
    const spinner = page.getByTestId('message-spinner');
    await expect(spinner).not.toBeVisible();
  });

  test('tick should not appear until response completes', async ({ page }) => {
    const chatInput = page.locator('textarea');
    await chatInput.fill('Hello');
    await chatInput.press('Enter');

    // Spinner should appear before response
    const spinner = page.getByTestId('message-spinner');
    await expect(spinner).toBeVisible({ timeout: 10000 });

    // Tick should not appear until after response
    const tick = page.getByTestId('message-tick');
    // Tick should not be visible immediately (while streaming)
    await expect(tick).not.toBeVisible({ timeout: 5000 });
  });
});
