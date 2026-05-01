# Graph Report - /home/sri/tools/srishti.ai  (2026-05-01)

## Corpus Check
- Corpus is ~42,320 words - fits in a single context window. You may not need a graph.

## Summary
- 315 nodes · 475 edges · 13 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Management UI|App Management UI]]
- [[_COMMUNITY_Workbox PWA|Workbox PWA]]
- [[_COMMUNITY_Chat API Backend|Chat API Backend]]
- [[_COMMUNITY_Service Worker Cache|Service Worker Cache]]
- [[_COMMUNITY_Provider Configuration|Provider Configuration]]
- [[_COMMUNITY_Chat Interaction|Chat Interaction]]
- [[_COMMUNITY_Rust Tools Integration|Rust Tools Integration]]
- [[_COMMUNITY_Intent Detection|Intent Detection]]
- [[_COMMUNITY_Server Manager|Server Manager]]
- [[_COMMUNITY_Audio API Route|Audio API Route]]
- [[_COMMUNITY_Image API Route|Image API Route]]
- [[_COMMUNITY_Preview API Route|Preview API Route]]
- [[_COMMUNITY_Service Worker|Service Worker]]

## God Nodes (most connected - your core abstractions)
1. `a` - 18 edges
2. `v` - 15 edges
3. `z()` - 14 edges
4. `RustTools` - 11 edges
5. `openDB()` - 10 edges
6. `POST()` - 10 edges
7. `detectIntent()` - 9 edges
8. `handleSubmit()` - 8 edges
9. `f()` - 8 edges
10. `T()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `handleSaveEditedApp()` --calls--> `saveAppToDB()`  [INFERRED]
  app/page.tsx → lib/db.ts
- `POST()` --calls--> `checkImagePrompt()`  [INFERRED]
  app/api/router/route.ts → lib/safety.ts
- `POST()` --calls--> `checkAudioPrompt()`  [INFERRED]
  app/api/router/route.ts → lib/safety.ts
- `POST()` --calls--> `detectIntent()`  [INFERRED]
  app/api/chat/route.ts → lib/intent-matcher.ts
- `routeTask()` --calls--> `detectIntent()`  [INFERRED]
  app/api/router/route.ts → lib/intent-matcher.ts

## Communities

### Community 0 - "App Management UI"
Cohesion: 0.06
Nodes (32): clearAllChats(), deleteChat(), getAppIcon(), handleDownloadFromChat(), handleImageDownloadFromChat(), handleImageSaveFromChat(), handleNewChat(), handleSaveEditedApp() (+24 more)

### Community 1 - "Workbox PWA"
Cohesion: 0.07
Nodes (15): $(), b(), d(), deleteCacheAndMetadata(), e(), et, f(), G (+7 more)

### Community 2 - "Chat API Backend"
Cohesion: 0.1
Nodes (24): createChatClient(), loadSettings(), POST(), selectProvider(), streamWithFallback(), getLangInstruction(), checkAudioPrompt(), checkImagePrompt() (+16 more)

### Community 3 - "Service Worker Cache"
Cohesion: 0.1
Nodes (6): a, c(), h(), j(), q(), r

### Community 4 - "Provider Configuration"
Cohesion: 0.22
Nodes (8): loadProviders(), k(), m(), st(), T(), U(), v, y

### Community 5 - "Chat Interaction"
Cohesion: 0.18
Nodes (16): handleSubmit(), setPurposeImmediate(), stopGeneration(), getPromptHistory(), onStop(), onSubmit(), savePromptToHistory(), cosineSimilarity() (+8 more)

### Community 6 - "Rust Tools Integration"
Cohesion: 0.21
Nodes (1): RustTools

### Community 8 - "Intent Detection"
Cohesion: 0.38
Nodes (9): cosineSimilarity(), detectAppIntent(), detectAudioIntent(), detectImageIntent(), detectIntent(), detectIntentSemantic(), detectIntentStructured(), detectMultiIntent() (+1 more)

### Community 10 - "Server Manager"
Cohesion: 0.38
Nodes (1): ServerManager

### Community 12 - "Audio API Route"
Cohesion: 0.7
Nodes (4): generateAudio(), GET(), loadSettings(), POST()

### Community 15 - "Image API Route"
Cohesion: 1.0
Nodes (3): GET(), loadSettings(), POST()

### Community 16 - "Preview API Route"
Cohesion: 1.0
Nodes (2): GET(), POST()

### Community 18 - "Service Worker"
Cohesion: 1.0
Nodes (2): n(), o()

## Knowledge Gaps
- **Thin community `Rust Tools Integration`** (12 nodes): `RustTools`, `.bash()`, `.createNextjs()`, `.delete()`, `.find()`, `.format()`, `.hash()`, `.lint()`, `.list()`, `.read()`, `.write()`, `rust-tools.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server Manager`** (7 nodes): `ServerManager`, `.findFreePort()`, `.getServerUrl()`, `.isPortAvailable()`, `.startNextjsServer()`, `.stopServer()`, `server-manager.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Preview API Route`** (3 nodes): `route.ts`, `GET()`, `POST()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Service Worker`** (3 nodes): `sw.js`, `n()`, `o()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handleSubmit()` connect `Chat Interaction` to `App Management UI`, `Provider Configuration`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `v` connect `Provider Configuration` to `Workbox PWA`, `Service Worker Cache`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `handleImageSaveFromChat()` connect `App Management UI` to `Provider Configuration`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `App Management UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Workbox PWA` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Chat API Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Service Worker Cache` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._