import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Multi-node Ollama Routing', () => {
  test('router API returns provider list', async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/api/router`);
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.text_generation).toBeInstanceOf(Array);
    expect(json.image_generation).toBeInstanceOf(Array);
  });

   test('router routes image intent with routing metadata', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'draw a cat' },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.routing).toBeDefined();
    expect(json.routing.route).toBe('image_generation');
  });

  test('router routes audio intent with routing metadata', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/router`, {
      data: { message: 'convert text to speech hello world' },
    });
    // Audio provider disabled → 503 with routing metadata
    expect(resp.status()).toBe(503);
    const json = await resp.json();
    expect(json.routing).toBeDefined();
    expect(json.routing.route).toBe('audio_generation');
  });

  test('settings.yaml has two text providers with purpose', async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/api/router`);
    const json = await resp.json();
    const providers = json.text_generation;
    const purposes = providers.map((p: any) => p.name);
    expect(purposes).toContain('llamacpp-general');
    expect(purposes).toContain('llamacpp-app');
  });
});

test.describe('Static Assets', () => {
  test('main HTML loads', async ({ request }) => {
    const resp = await request.get(BASE_URL);
    expect(resp.status()).toBe(200);
    const html = await resp.text();
    expect(html).toContain('Srishti AI');
  });

  test('polyfills.js loads', async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/_next/static/chunks/polyfills.js`);
    expect(resp.status()).toBe(200);
  });

  test('webpack.js loads', async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/_next/static/chunks/webpack.js`);
    expect(resp.status()).toBe(200);
  });

  test('build manifest exists', async ({ request }) => {
    const resp = await request.get(`${BASE_URL}/_next/static/development/_buildManifest.js`);
    expect(resp.status()).toBe(200);
  });
});

test.describe('Page UI', () => {
  test('page loads without 404s', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', resp => {
      if (resp.status() === 404) {
        errors.push(resp.url());
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });

  test('chat input visible', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea', { timeout: 30000 });
    await expect(page.locator('textarea')).toBeVisible();
  });
});
