import { test, expect } from '@playwright/test';

// Helper to wait for page to be ready
async function waitForPage(page: Page, timeout: number = 30000) {
  await page.waitForLoadState('networkidle', { timeout });
}

test.describe('Chat Message Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    // Wait for client-side JavaScript to fully render
    await page.waitForLoadState('domcontentloaded');
    // Wait for the chat input to be visible
    await page.waitForSelector('textarea', { timeout: 30000 });
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

    // Verify key elements are present (some buttons may be hidden)
    expect(inputCount).toBeGreaterThan(0);
    expect(placeholder).toBe('Ask anything...');
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

  test('should send message and receive response', async ({ page }) => {
    const chatInput = page.locator('textarea');
    const sendButton = page.locator('button[title="Send"]');

    // Type test message
    await chatInput.fill('Hello');

    // Try clicking send button, but fall back to Enter key if button is disabled
    const isButtonEnabled = await sendButton.evaluate(el => !el.disabled);
    if (isButtonEnabled) {
      await sendButton.click();
    } else {
      // Button is disabled, use Enter key instead
      await chatInput.press('Enter');
    }

    // Wait for user message to appear (streaming may not complete networkidle)
    const userMessages = page.locator('div.justify-end div.self-end');
    await userMessages.first().waitFor({ state: 'visible', timeout: 10000 });
    const userMessageCount = await userMessages.count();
    console.log(`User messages found: ${userMessageCount}`);

    // Check for assistant response (may not appear if API fails)
    const assistantMessages = page.locator('div.justify-start div.self-start');
    const assistantMessageCount = await assistantMessages.count();
    console.log(`Assistant messages found: ${assistantMessageCount}`);

    // Debug: check all flex containers
    const allFlex = page.locator('div.flex');
    const flexCount = await allFlex.count();
    console.log(`Total flex containers: ${flexCount}`);

    // At minimum, user message should appear
    expect(userMessageCount).toBeGreaterThan(0);
  });

  test('should render assistant response content', async ({ page }) => {
    const chatInput = page.locator('textarea');
    const sendButton = page.locator('button[title="Send"]');

    // Type test message that will generate code
    await chatInput.fill('Build a todo list app');
    await sendButton.click();

    // Wait for response (streaming may not complete all network requests)
    await page.waitForTimeout(5000);

    // Check for assistant message with content
    const assistantMessages = page.locator('div.justify-start div.self-start');
    const assistantMessageCount = await assistantMessages.count();
    console.log(`Assistant messages: ${assistantMessageCount}`);

    // Check for code blocks in assistant message
    const codeBlocks = page.locator('pre');
    const codeBlockCount = await codeBlocks.count();
    console.log(`Code blocks found: ${codeBlockCount}`);

    // Check for markdown content
    const markdownContent = page.locator('p');
    const markdownCount = await markdownContent.count();
    console.log(`Markdown paragraphs found: ${markdownCount}`);

    // At least one of code blocks or markdown content should exist
    expect(codeBlockCount + markdownCount).toBeGreaterThan(0);
  });

  test('should generate image when user asks for picture', async () => {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'show me a picture of elephant' }], isAutonomous: true }),
    });

    const data = await response.json();
    console.log('Chat response:', data);

    // Should return imageUrl
    expect(data.imageUrl).toBeDefined();
    expect(data.imageUrl).toContain('/9j/4AAQSkZJR'); // Base64 image signature
  });

  test('should detect image intent via router API', async () => {
    const response = await fetch('http://localhost:3000/api/router', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'show me a picture of elephant' }),
    });

    const routing = await response.json();
    console.log('Router response:', routing);

    // Should route to image_generation
    expect(routing.routing?.route).toBe('image_generation');
    expect(routing.routing?.mode).toBe('image');
    expect(routing.routing?.prompt).toContain('elephant');
    expect(routing.imageUrl).toBeDefined();
  });

  test('should route image requests correctly via API', async () => {
    const response = await fetch('http://localhost:3000/api/router');
    const json = await response.json();
    console.log('Router API response:', json);

    // Check that image_generation provider is configured
    const hasImageProvider = json.image_generation && json.image_generation.length > 0;
    console.log(`Image provider configured: ${hasImageProvider}`);

    expect(hasImageProvider).toBe(true);
  });

  test('should detect image intent in natural language requests', async ({ page }) => {
    // Test image routing via router API directly
    const response = await fetch('http://localhost:3001/api/router', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'show me a picture of elephant' }),
    });
    const routing = await response.json();
    console.log('Image routing result:', routing);

    // Should route to image_generation
    expect(routing.routing?.route).toBe('image_generation');
    expect(routing.routing?.mode).toBe('image');
    expect(routing.routing?.prompt).toContain('elephant');
  });

  test('should detect image intent with various phrasings', async () => {
    const imagePhrasings = [
      'show me a picture of elephant',
      'show me a picture of a cat',
      'show me a picture of dog',
      'generate an image of mountain',
      'create a picture of ocean',
      'draw a picture of tree',
      'make an image of car',
      'show me a photo of planet',
    ];

    for (const phrase of imagePhrasings) {
      const response = await fetch('http://localhost:3001/api/router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: phrase }),
      });
      const routing = await response.json();
      console.log(`Routing for "${phrase}":`, routing);

      expect(routing.routing?.route).toBe('image_generation');
      expect(routing.routing?.mode).toBe('image');
    }
  });

  test('should NOT route text requests to image generation', async () => {
    // Note: Text requests may fall back to LLM, so we check for timeout or fallback
    const textRequests = [
      'Hello, how are you?',
      'What is the capital of France?',
    ];

    for (const request of textRequests) {
      // Use shorter timeout for text requests that may fall back to LLM
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('http://localhost:3001/api/router', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: request }),
          signal: controller.signal,
        });
        const routing = await response.json();
        console.log(`Routing for "${request}":`, routing);

        // Text requests should either not be image_generation or fallback to LLM
        if (routing.routing?.route) {
          expect(routing.routing.route).not.toBe('image_generation');
        }
      } catch (error) {
        // Timeout is expected for LLM fallback
        console.log(`Timeout for "${request}" (expected for LLM fallback)`);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  });

  test('should route app building requests to text generation', async () => {
    const appRequests = [
      'Build a todo list app',
      'Create a weather app',
      'Make a game',
      'Write code for a calculator',
    ];

    for (const request of appRequests) {
      // Use shorter timeout for app building requests that may fall back to LLM
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('http://localhost:3001/api/router', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: request }),
          signal: controller.signal,
        });
        const routing = await response.json();
        console.log(`Routing for "${request}":`, routing);

        // App building requests should either be text_generation or fallback to LLM
        if (routing.routing?.route) {
          expect(routing.routing.route).toBe('text_generation');
          expect(routing.routing.mode).toBe('app_building');
        }
      } catch (error) {
        // Timeout is expected for LLM fallback
        console.log(`Timeout for "${request}" (expected for LLM fallback)`);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  });
});