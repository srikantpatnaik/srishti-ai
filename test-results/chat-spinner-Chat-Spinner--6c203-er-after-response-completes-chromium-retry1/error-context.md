# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: chat-spinner.spec.ts >> Chat Spinner and Tick >> tick should replace spinner after response completes
- Location: tests/chat-spinner.spec.ts:21:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="assistant-message"]')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('[data-testid="assistant-message"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - button [ref=e5] [cursor=pointer]:
      - img [ref=e6]
    - generic [ref=e19]:
      - textbox "Ask anything..." [active] [ref=e20]
      - button "Menu" [ref=e22] [cursor=pointer]:
        - img [ref=e23]
      - button "Send" [disabled] [ref=e25]:
        - img [ref=e26]
  - alert [ref=e28]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE_URL = 'http://localhost:3000';
  4  | 
  5  | test.describe('Chat Spinner and Tick', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  8  |     await page.waitForSelector('textarea', { timeout: 30000 });
  9  |   });
  10 | 
  11 |   test('spinner should appear on user message submit', async ({ page }) => {
  12 |     const chatInput = page.locator('textarea');
  13 |     await chatInput.fill('Hello world');
  14 |     await chatInput.press('Enter');
  15 | 
  16 |     // Spinner should appear in bottom-right of user message bubble
  17 |     const spinner = page.getByTestId('message-spinner');
  18 |     await expect(spinner).toBeVisible({ timeout: 10000 });
  19 |   });
  20 | 
  21 |   test('tick should replace spinner after response completes', async ({ page }) => {
  22 |     const chatInput = page.locator('textarea');
  23 |     await chatInput.fill('Hello');
  24 |     await chatInput.press('Enter');
  25 | 
  26 |     // Wait for assistant response to appear
  27 |     const assistantMsg = page.locator('[data-testid="assistant-message"]');
> 28 |     await expect(assistantMsg).toBeVisible({ timeout: 30000 });
     |                                ^ Error: expect(locator).toBeVisible() failed
  29 | 
  30 |     // Tick should be visible on user message
  31 |     const tick = page.getByTestId('message-tick');
  32 |     await expect(tick).toBeVisible({ timeout: 10000 });
  33 | 
  34 |     // Spinner should no longer be visible
  35 |     const spinner = page.getByTestId('message-spinner');
  36 |     await expect(spinner).not.toBeVisible();
  37 |   });
  38 | 
  39 |   test('spinner should not appear on idle status', async ({ page }) => {
  40 |     // Page loads with status=idle, no spinner should be visible
  41 |     const spinner = page.getByTestId('message-spinner');
  42 |     await expect(spinner).not.toBeVisible();
  43 |   });
  44 | 
  45 |   test('tick should not appear until response completes', async ({ page }) => {
  46 |     const chatInput = page.locator('textarea');
  47 |     await chatInput.fill('Hello');
  48 |     await chatInput.press('Enter');
  49 | 
  50 |     // Spinner should appear before response
  51 |     const spinner = page.getByTestId('message-spinner');
  52 |     await expect(spinner).toBeVisible({ timeout: 10000 });
  53 | 
  54 |     // Tick should not appear until after response
  55 |     const tick = page.getByTestId('message-tick');
  56 |     // Tick should not be visible immediately (while streaming)
  57 |     await expect(tick).not.toBeVisible({ timeout: 5000 });
  58 |   });
  59 | });
  60 | 
```