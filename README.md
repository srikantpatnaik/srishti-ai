# App Builder PWA

An AI-powered Progressive Web App that autonomously builds web applications with planning, coding, testing, error fixing, and deployment capabilities.

## Features

- **Gemini-style Chat Interface**: Clean, responsive chat with intelligent prompt input
- **Autonomous Development**: AI plans, codes, tests, and fixes errors automatically
- **Real-time Preview**: Live preview with integrated dev console
- **Error Detection & Auto-fix**: Console errors can be inserted into chat for automatic fixing
- **PWA Ready**: Installable on mobile devices with offline support
- **Optimized Token Usage**: Rust-based tools for efficient file operations
- **Deployment Ready**: Pre-deployment checks and one-click deployment

## Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **AI Integration**: Vercel AI SDK with Google Gemini
- **Chat UI**: Custom Gemini-style interface
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: next-pwa with service worker
- **Tools**: Rust-based optimized file operations

## Getting Started

### Prerequisites

- Node.js 18+
- Google AI API key (for Gemini)

### Installation

```bash
# Install dependencies
npm install

# Set up API key
export GOOGLE_AI_API_KEY="your-api-key-here"

# Run development server
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # AI chat API with tool calling
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Main chat interface
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── chat-message.tsx      # Message rendering
│   ├── preview-panel.tsx     # Live preview with console
│   ├── status-indicator.tsx  # Agent status display
│   ├── autonomous-agent.tsx  # Autonomous agent UI
│   ├── deployment-panel.tsx  # Deployment controls
│   └── error-fixer.tsx       # Error detection & fixing
├── hooks/
│   └── use-chat.ts           # Chat state management
├── lib/
│   └── utils.ts              # Utility functions
├── rust-tools/               # Rust-based optimized tools
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── public/
    ├── manifest.json         # PWA manifest
    └── sw.js                 # Service worker
```

## AI Tools

The AI agent has access to optimized tools:

- `read`: Read file content
- `write`: Write files with auto-directory creation
- `bash`: Execute shell commands with timeout
- `plan`: Create development plans
- `test`: Write and run tests
- `fix`: Automatically fix errors

## PWA Features

- Installable on mobile and desktop
- Offline support with service worker
- Responsive design for all screen sizes
- App-like experience with native feel

## Environment Variables

```env
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## License

MIT