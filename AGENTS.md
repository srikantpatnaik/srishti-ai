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

## DeepSeek-Style UI Guidelines

### Layout Structure

#### Settings Panel (Left Sidebar)
- **Width**: 20% of viewport on desktop, 70% on mobile
- **Position**: Fixed left sidebar, collapsible on mobile
- **Content**: Recent chats list only (no settings, no gallery)
- **Toggle**: Hidden by default on mobile, hamburger menu to open
- **Background**: #171717 (dark charcoal)
- **Border**: 1px solid #262626

#### Main Chat Area
- **Position**: Center, fills remaining space
- **Background**: #000000 (pure black)
- **Padding**: 16px horizontal, 24px vertical

#### Chat Input
- **Position**: Fixed at bottom of chat area
- **Buttons inside input**: "+" button (left) and send button (right) both inside the input field
- **Input background**: #1e1e1e
- **Border radius**: 12px
- **Placeholder**: "Ask anything..."

### Color Scheme

```css
--bg-primary: #000000        /* Main chat background - pure black */
--bg-secondary: #171717     /* Settings panel background - dark charcoal */
--bg-input: #1e1e1e         /* Chat input background */
--bg-hover: #262626          /* Hover states */
--bg-active: #2a2a2a         /* Active/selected states */

--text-primary: #ffffff      /* Main text - white */
--text-secondary: #8b8b8b   /* Secondary text - muted gray */
--text-tertiary: #5c5c5c     /* Disabled/placeholder - darker gray */

--accent-primary: #2d5af8    /* Primary accent - blue */
--accent-hover: #4f7afc      /* Accent hover state */
--accent-active: #1d4ed8     /* Accent active state */

--border-default: #262626    /* Default borders */
--border-focus: #2d5af8      /* Focus state borders */

--user-bubble: #2d2d2d       /* User message bubble */
--ai-bubble: transparent      /* AI messages - no bubble, just text */
```

### Chat Bubbles

- **User messages**: Right-aligned, background #2d2d2d, border-radius 12px, max-width 80%
- **AI messages**: Left-aligned, no background bubble, full-width text area for maximum readability
- **No avatars**: Clean, minimal design
- **100% width**: AI responses use full container width for maximum text display

### Preview in Chat

- **Thumbnail below latest AI response**: Show preview iframe as collapsible thumbnail
- **Toggle**: Click to expand/fullscreen, click again to collapse
- **Thumbnail size**: 320x200px when collapsed, full width when expanded
- **Placeholder**: "Generating preview..." while loading
- **Background**: #1a1a1a for thumbnail container

### Navigation & Scrolling

- **No auto-scroll**: Chat does NOT auto-scroll to bottom on new messages
- **Free navigation**: Users can scroll freely through conversation history
- **Load more**: Load older messages as user scrolls up (virtual scrolling for performance)
- **Scroll to bottom button**: Floating button appears when not at bottom, scrolls to latest

### Performance Optimizations for Long Conversations

- **Virtual scrolling**: Only render visible messages + buffer (50 above/below viewport)
- **Message virtualization**: Use react-window or similar for 1000+ messages
- **Lazy loading**: Load older messages on demand
- **Memory management**: Unmount off-screen components
- **Debounced scroll**: Debounce scroll events for performance
- **Message pagination**: Fetch 50 messages at a time
- **Max stored messages**: Keep last 500 messages in memory, older in IndexedDB

### Theme Toggle

- **Location**: Inside settings panel
- **Icons**: Sun (light mode) / Moon (dark mode)
- **Default**: Dark mode

### Responsive Behavior

- **Desktop (>1024px)**: Settings panel visible (20%), chat fills remaining, preview as thumbnail
- **Tablet (768-1024px)**: Settings panel collapsible, chat full width, preview thumbnail below AI
- **Mobile (<768px)**: Settings panel hidden (70% overlay when opened), chat full width, preview thumbnail below AI

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
- [ ] Virtual scrolling working for long conversations
- [ ] Preview thumbnail displays correctly below AI responses

## Recent Updates

- **DeepSeek-Style UI**: Complete UI redesign mimicking DeepSeek chat interface
- **Settings Panel**: 20% desktop / 70% mobile width, contains recent chats only
- **Chat Input**: "+" and send button positioned inside the input area
- **Chat Bubbles**: AI messages use full 100% width for maximum text, user messages 80% max with background
- **Preview in Chat**: Preview thumbnail displayed below latest AI response, collapsible/expandable
- **No Auto-scroll**: Free navigation through conversation history, scroll to bottom button when not at bottom
- **Virtual Scrolling**: Performance optimization for long conversations (1000+ messages)
- **Color Scheme**: Complete color palette with specific hex codes (#000000, #171717, #1e1e1e, etc.)
- **Memory Optimization**: Message pagination, lazy loading, max 500 messages in memory
- **Context Menu**: Removed (no longer needed with simplified UI)
- **Gallery/Edit/Share**: Removed from main UI (simplified to recent chats only in settings)
- **Chat Tabs**: Removed (single chat interface)
- **App Drawer**: Removed (replaced with simplified recent chats in settings panel)
- **Bookmark Feature**: Removed (gallery removed)
- **Session Navigation**: Removed (simplified single session)
- **Preview Toggle Icons**: Removed (preview in chat as thumbnail)
- **Preview Edit Button**: Removed (no gallery to edit from)