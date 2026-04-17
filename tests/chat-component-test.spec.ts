import { test, expect } from '@playwright/test';

test.describe('Chat Message Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for client-side JavaScript to fully render
    await page.waitForLoadState('domcontentloaded');
    // Wait for the chat input to be visible
    await page.waitForSelector('textarea', { timeout: 15000 });
  });

  test('should render chat interface', async ({ page }) => {
    // Check for the chat input textarea
    const chatInput = page.locator('textarea');
    const inputCount = await chatInput.count();
    console.log(`Textarea elements found: ${inputCount}`);

    // Get the placeholder text
    const placeholder = await chatInput.first().getAttribute('placeholder');
    console.log(`Chat input placeholder: ${placeholder}`);

    // Check for New Chat button
    const newChatButton = page.locator('button[title="New Chat"]');
    const newChatVisible = await newChatButton.count();
    console.log(`New Chat button found: ${newChatVisible > 0}`);

    // Check for Gallery button
    const galleryButton = page.locator('button[title="Gallery"]');
    const galleryVisible = await galleryButton.count();
    console.log(`Gallery button found: ${galleryVisible > 0}`);

    // Check for language selector
    const languageButton = page.locator('button[title="Language"]');
    const languageVisible = await languageButton.count();
    console.log(`Language button found: ${languageVisible > 0}`);

    // Check for send button
    const sendButton = page.locator('button[title="Send"]');
    const sendVisible = await sendButton.count();
    console.log(`Send button found: ${sendVisible > 0}`);

    // Check for settings toggle
    const settingsToggle = page.locator('#settings-toggle');
    const settingsVisible = await settingsToggle.count();
    console.log(`Settings toggle found: ${settingsVisible > 0}`);

    // Verify all key elements are present
    expect(inputCount).toBeGreaterThan(0);
    expect(placeholder).toBe('Ask anything...');
    expect(newChatVisible).toBeGreaterThan(0);
    expect(galleryVisible).toBeGreaterThan(0);
    expect(languageVisible).toBeGreaterThan(0);
    expect(sendVisible).toBeGreaterThan(0);
    expect(settingsVisible).toBeGreaterThan(0);
  });

  test('should be able to type in chat input', async ({ page }) => {
    const chatInput = page.locator('textarea');

    // Type a test message (Playwright automatically waits for elements)
    await chatInput.fill('Hello, this is a test message');

    // Verify the text was entered
    const inputValue = await chatInput.inputValue();
    console.log(`Input value: ${inputValue}`);

    expect(inputValue).toContain('Hello');
  });

  test('should have chat message container', async ({ page }) => {
    // The chat message container should exist (even if empty)
    const messageContainer = page.locator('.space-y-4.max-w-3xl');
    const containerCount = await messageContainer.count();
    console.log(`Message container found: ${containerCount > 0}`);

    // Check for any existing messages
    const messages = page.locator('div[class*="flex"] > div[class*="max-w"]');
    const messageCount = await messages.count();
    console.log(`Message elements found: ${messageCount}`);

    // Verify container exists
    expect(containerCount).toBeGreaterThan(0);
  });
});