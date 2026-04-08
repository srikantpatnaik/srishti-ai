# Agent Guidelines for App Builder PWA

## Overview
This is an autonomous AI-powered webapp builder that creates complete, production-ready applications with minimal user input. Built with Next.js 14, Rust-based tool system, and Vercel AI SDK for multi-provider LLM support.

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router and Turbopack
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Integration**: Vercel AI SDK (v3) with tool calling
- **Tool System**: Rust-based optimized file operations (via Node.js wrapper)
- **Type Safety**: Full TypeScript support with path aliases
- **PWA**: Service worker, manifest, offline support

### File Structure
```
app/
  ├── layout.tsx              # Root layout (dark mode default)
  ├── page.tsx                # Main chat interface
  └── api/
      └── chat/
          └── route.ts        # AI chat endpoint with tool calling
components/
  ├── ui/                     # shadcn/ui components
  ├── autonomous-agent.tsx    # Agent workflow UI
  ├── preview-panel.tsx       # Live preview with console
  ├── deployment-panel.tsx    # Deployment controls
  └── error-fixer.tsx         # Auto-fix interface
hooks/
  └── use-chat.ts             # Chat state management
lib/
  ├── utils.ts                # Utility functions (cn, clsx, tailwind-merge)
  └── rust-tools.ts           # Node.js wrapper for Rust tools
rust-tools/
  ├── src/lib.rs              # Rust tool implementations
  └── Cargo.toml              # Rust dependencies
public/
  ├── manifest.json           # PWA manifest
  └── sw.js                   # Service worker
settings.yaml                 # AI provider configuration
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

### 5. Project Structure
Default Next.js structure:
```
app/
  ├── layout.tsx
  ├── page.tsx
  └── api/
components/
  └── ui/
lib/
  └── utils.ts
public/
```

## Available Tools

### File Operations
- `read(path)`: Read file content
- `write(path, content)`: Write file with auto-directory creation
- `bash(command, timeout)`: Execute shell commands

### Development Tools
- `plan(description)`: Create development plan
- `test(filePath, content)`: Write test files
- `fix(error, filePath, fix)`: Fix errors in code

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

- **Default Theme**: Dark mode (toggle to light when unset)
- **Sidebars**: Left settings and right preview hidden by default with small flaps to show/hide
- **Design Inspiration**: Modern, clean UI inspired by https://www.assistant-ui.com/
- **Responsive**: Mobile-first design with collapsible panels
- **Accessibility**: WCAG compliant with proper ARIA labels

## Deployment Checklist

Before marking as deployment-ready:
- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] No console errors in preview
- [ ] PWA manifest and service worker configured
- [ ] Mobile responsive tested
- [ ] Dark/light theme working
- [ ] All tool calls optimized for token efficiency