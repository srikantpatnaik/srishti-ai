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
  ├── settings-panel.tsx      # Left sidebar with recent chats and settings
  ├── chat-message.tsx        # Chat messages with markdown rendering
  ├── preview-thumbnail.tsx    # Preview thumbnail below latest AI response
  ├── chat-input.tsx          # Input with + and send button
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

## Modern UI Guidelines

### Layout Structure

#### Left Sidebar (Settings Panel)
- **Width**: 280px on desktop
- **Background**: #202123
- **Border**: 1px solid #343541
- **Content**: Srishti AI branding, recent chats grouped by date
- **Close button**: Inside header

#### Main Chat Area
- **Width**: 55% of viewport on desktop
- **Background**: #121215
- **Padding**: 16px horizontal

#### Dock (Above Input)
- **Position**: Above chat input, with negative margin for text flow behind
- **Style**: Translucent pill with blur backdrop
- **Icons**: Language selector, New Chat, Gallery
- **Each icon**: Individual buttons with subtle borders

#### Chat Input
- **Background**: #1f1f23
- **Border**: 1px solid #2e2e32
- **Border radius**: 16px
- **Send button**: Blue (#3b82f6)

#### Full-Screen Gallery
- **Background**: Frosted glass with #0a0a0c backdrop blur
- **Atmosphere**: Animated gradient orbs
- **App cards**: Hover glow effects
- **Category pills**: Gradient styling

### Color Scheme

```css
--bg-primary: #121215        /* Main chat background */
--bg-secondary: #202123     /* Left sidebar */
--bg-input: #1f1f23        /* Chat input background */
--bg-dock: #1f1f23/40     /* Dock with transparency */
--bg-gallery: #0a0a0c       /* Full screen gallery */

--text-primary: #e5e5e5      /* Main text */
--text-secondary: #888888      /* Secondary text */
--text-muted: #666666        /* Muted text */

--accent-primary: #de0f17     /* Cherry red - Srishti AI */
--accent-blue: #3b82f6        /* Send button */
--accent-green: #19c37d      /* Success */

--border-default: #2e2e32   /* Default borders */
--border-sidebar: #343541     /* Sidebar border */
```

### Chat Bubbles

- **User messages**: Right-aligned, background #3a3a42, border-radius 20px
- **AI messages**: Left-aligned, background #1e1e23, border-radius 20px

### Features

- **Auto-scroll**: Smooth scroll to new messages
- **Language selector**: In dock with dropdown menu
- **Tool calling**: generateImage tool for image generation
- **Image preview**: Opens in right panel with Save/Download
- **Text flow**: Allow text to flow behind translucent dock

## Recent Updates

- **Full-Screen Gallery**: Ultra modern dark theme with blur and gradient orbs
- **Dock**: Translucent pill above input with 3 icons
- **Settings Panel**: Srishti AI branding with cherry red accent
- **Language in Dock**: Language selector with dropdown
- **Tool Calling**: generateImage tool for robust image generation
- **Auto-scroll**: Smooth scroll to new messages only