# Agent Guidelines for App Builder PWA

## Overview
This is an autonomous AI-powered webapp builder that creates complete, production-ready applications with minimal user input. Built with Next.js 14, Vercel AI SDK for multi-provider LLM support.

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router and Turbopack
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Integration**: Vercel AI SDK (v4) with tool calling
- **Type Safety**: Full TypeScript support with path aliases
- **PWA**: Service worker, manifest, offline support
- **Database**: IndexedDB for persistent app storage

### File Structure
```
app/
  ├── layout.tsx              # Root layout (dark mode default)
  ├── page.tsx                # Main chat interface with resizable panels
  └── api/
      ├── chat/
      │   └── route.ts        # AI chat endpoint with tool calling
      ├── preview/
      │   └── route.ts        # Preview server API endpoint
      └── session/
          └── route.ts        # Session management API
components/
  ├── ui/                     # shadcn/ui components
  ├── chat-message.tsx        # Chat messages with markdown rendering
  ├── preview-panel.tsx       # Live preview iframe with edit button
  ├── app-drawer.tsx          # Gallery with app icons and context menu
  ├── chat-input.tsx          # Input with edit/save buttons
  └── status-indicator.tsx    # Status indicator for agent phases
lib/
  ├── db.ts                   # IndexedDB utilities for app storage
  └── utils.ts                # Utility functions (cn, clsx, tailwind-merge)
public/
  ├── manifest.json           # PWA manifest
  └── sw.js                   # Service worker
settings.yaml                 # AI provider configuration
tmp/                          # Session project folders (auto-created)
types/
  └── index.ts                # Type definitions (SavedApp, AgentStatus, Provider)
hooks/
  └── use-ui-utils.ts         # Custom hooks (useDarkMode, useKeyboardShortcuts, useResizing)
```

## Core Capabilities

### 1. Autonomous Development Workflow
- **Plan**: Analyze requirements and create detailed development plans
- **Code**: Generate optimized, production-ready code
- **Test**: Write comprehensive tests for all components
- **Fix**: Automatically detect and fix errors from dev console
- **Deploy**: Prepare applications for deployment with all checks

### 2. Tool Usage Optimization
- Use minimal tokens in tool calls
- Be concise in file operations
- Batch operations when possible
- Only read files when necessary
- Write complete files in one operation

### 3. Error Handling Loop
1. Detect errors from preview console
2. Analyze error message
3. Fix the issue automatically
4. Re-test to verify fix
5. Continue until all errors resolved

### 4. Code Quality Standards
- Write clean, maintainable code
- Follow best practices for the framework
- Include error handling
- Add TypeScript types
- Make apps mobile-responsive
- Ensure accessibility

## Available Tools

### File Operations
- `read(path)`: Read file content
- `write(path, content)`: Write file with auto-directory creation
- `bash(command, timeout)`: Execute shell commands

### Development Tools
- `plan(description)`: Create development plan
- `test(filePath, content)`: Write test files
- `fix(error, filePath, fix)`: Fix errors in code

### Announcement Tool
- `announce(phase, message)`: Announce current development phase (planning, coding, testing, fixing, ready)

## AI Response Guidelines

### Language & Tone
- **Keep answers VERY SHORT** - Max 1 sentence
- **Use SAME language as user** - Hindi→Hindi, Spanish→Spanish
- **No technical terms** - No code, files, CSS, React
- **Just explain what the app does** - Simple everyday words
- **Friendly, warm tone** - Like talking to a friend or grandpa
- **Small emojis only** - Not overwhelming 😊

### Examples
```
User: "Make a todo app"
You: "This app helps you list tasks and tick them when done! (यह ऐप आपको काम लिखने और tick करने देगा!)"

User: "कैलकुलेटर बनाओ"
You: "यह ऐप गणित के सवाल हल करेगा।"

User: "Hindi mein batao"
You: "ज़रूर! मैं हिंदी में बताता हूँ।"
```

## Response Format

### Planning Phase
```
## Development Plan

### Requirements
- List key requirements

### Architecture
- Tech stack
- Component structure

### Implementation Steps
1. Step 1
2. Step 2
3. ...
```

### Code Generation
- Write complete, working code
- Include all imports
- Add TypeScript types
- Handle edge cases

### Error Fixing
```
## Error Detected
{error_message}

## Fix Applied
- What was wrong
- How it was fixed
- Verification steps
```

## Best Practices

1. **Token Efficiency**
   - Use concise tool calls
   - Avoid redundant reads
   - Write complete files at once

2. **Code Quality**
   - Follow framework conventions
   - Add error handling
   - Write tests
   - Document complex logic

3. **User Experience**
   - Make apps responsive
   - Add loading states
   - Handle errors gracefully
   - Ensure accessibility

4. **Security**
   - Never expose API keys
   - Validate user input
   - Use environment variables
   - Sanitize outputs

## Example Workflow

User: "Create a todo app"

Agent:
1. **Plan**: Create Next.js todo app with localStorage
2. **Code**: Generate layout, page, components
3. **Test**: Write component tests
4. **Preview**: Show live preview
5. **Fix**: Auto-fix any console errors
6. **Ready**: Mark as deployment-ready

## Environment Variables

```env
# OpenAI Compatible (default)
LLAMA_CPP_URL=http://localhost:8080/v1

# Other providers (optional)
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
MISTRAL_API_KEY=
TOGETHER_API_KEY=
```

Configure AI providers in `settings.yaml`. See `settings.yaml.example` for template.

## Supported Providers

- OpenAI (GPT-4, GPT-3.5)
- Google Gemini
- Anthropic Claude
- Groq (fast inference)
- Mistral AI
- Together AI
- OpenAI-compatible endpoints (llama.cpp, Ollama, etc.)

Configure in `settings.yaml`

## UI Guidelines

- **Default Theme**: Dark mode (day/night toggle inside settings panel with sun/moon icons)
- **Layout**: Left settings panel (20% width on desktop, full on mobile), main chat area (flexible), right preview panel (100% width, full height)
- **Title Bar**: Settings button after title, model dropdown on right, eye icon to toggle preview
- **Design Inspiration**: Modern, clean UI inspired by https://www.assistant-ui.com/
- **Responsive**: Mobile-first design with collapsible panels
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Preview**: Full-height iframe with no address bar, "Waiting for preview" placeholder, auto-loads when planning phase starts, no auto-reload when ready
- **Chat Input**: Stop button inside input area next to send button during generation, edit/save buttons when editing
- **Chat Bubbles**: Telegram-style (user right-aligned darker shade, assistant left-aligned lighter shade), no avatars
- **Auto-scroll**: Chat auto-scrolls to latest message
- **Loading indicator**: Shows "..." while AI is thinking
- **Scrollbars**: Black themed with custom scrollbar colors
- **Preview Toggle**: Eye icon in header (desktop: right panel, mobile: fullscreen overlay)
- **Preview Overlay Icons**: Two buttons always visible (desktop) - Open in new tab, Download as ZIP
- **Preview Edit Button**: Pencil icon in preview toolbar to load app's chat for editing
- **Keyboard Shortcuts**: Ctrl+B for settings panel, Ctrl+X for preview toggle, Ctrl+M for app drawer, Esc to close app drawer
- **Settings Footer**: Keyboard shortcuts display section (desktop only)
- **Settings Collapse**: Arrow button to collapse settings panel on mobile
- **App Drawer**: Android/iPhone style fullscreen overlay with translucent background, app icons in grid layout with emoji
- **Persistent Storage**: Apps saved to IndexedDB with chat metadata, survive page reloads
- **Gallery**: Grid layout with app icons and names, right-click/long-press shows context menu (Open, Edit, Share, Uninstall)
- **Edit Feature**: Loads saved app's chat conversation into current chat window, edit button in preview
- **Share**: Generates shareable link with encoded app data and chat history
- **New Session**: Plus button clears chat and preview for fresh conversation
- **Bookmark**: Transparent save button in preview, turns filled when saved to gallery

## Session Management

### Gallery Tabs
- **Current Chat**: Shows title of currently active chat session
- **App Tabs**: Shows saved apps with their names when edited
- **Close Tab**: Click X button to close app tab and remove from gallery

### Session Apps vs Gallery Apps
- **Session Apps**: Temporary apps generated during current session, displayed with navigation arrows
- **Gallery Apps**: Persistent apps saved to IndexedDB, displayed in full-screen drawer
- Bookmark state resets when navigating between session apps or page reload

## Gallery Features

### Context Menu Options
1. **Open**: Load app's code and chat into preview
2. **Edit**: Load app's chat into current chat window with edit capability
3. **Share**: Generate shareable link with encoded app data
4. **Uninstall**: Delete app from IndexedDB and remove from gallery

### Long Press / Right-Click
- Long press on mobile or right-click on desktop shows context menu
- Menu appears at icon position with smooth transitions
- Clicking outside dismisses menu

## Deployment Checklist

Before marking as deployment-ready:
- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] No console errors in preview
- [ ] PWA manifest and service worker configured
- [ ] Mobile responsive tested
- [ ] Dark/light theme working
- [ ] All tool calls optimized for token efficiency
- [ ] IndexedDB storage working correctly
- [ ] Edit and share features functional

## Recent Updates

- **IndexedDB Storage**: Apps now saved to IndexedDB instead of localStorage for better persistence
- **Edit Feature**: Edit button in preview loads app's chat conversation into current chat window
- **Session Navigation**: Preview arrows for navigating between session app versions
- **Share Functionality**: Generate shareable links with encoded app data and chat history
- **Gallery Grid**: Responsive grid layout for app icons with proper spacing
- **Context Menu**: Right-click/long-press menu with Open, Edit, Share, Uninstall options
- **Transparent Bookmark**: Save button matches adjacent button styling
- **Chat Tabs**: Chrome-style tabs showing current chat and saved app sessions
- **App Counter Removed**: No badge showing app count on gallery button
- **PWA Support**: Service worker and manifest for offline capability
