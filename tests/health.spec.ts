import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('App Health', () => {
  test('CSS file loads', async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/_next/static/css/app/layout.css`);
    expect(resp.status()).toBe(200);
    const text = await resp.text();
    expect(text).toContain('min-h-screen');
    expect(text).toContain('bg-background');
  });

  test('page has CSS classes applied', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });

    const body = page.locator('body');
    const classes = await body.getAttribute('class');
    expect(classes).toContain('antialiased');
    expect(classes).toContain('min-h-screen');
    expect(classes).toContain('bg-background');
  });

  test('chat input has correct styling', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });

    const input = page.locator('textarea');
    await expect(input).toBeVisible();

    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toBe('Ask anything...');

    const classes = await input.getAttribute('class');
    expect(classes).toContain('rounded-2xl');
    expect(classes).toContain('bg-[#0a0a0a]');
  });

  test('settings toggle button present', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });

    const btn = page.locator('#settings-toggle');
    await expect(btn).toBeVisible();

    const svg = btn.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('send button present and disabled when empty', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });

    const sendBtn = page.locator('button[title="Send"]');
    await expect(sendBtn).toBeVisible();
    await expect(sendBtn).toBeDisabled();
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });

    // Wait a beat for any async errors
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('page title and meta', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });

    await expect(page).toHaveTitle('Srishti AI');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain('Create webapps');
  });
});
