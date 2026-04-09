"use client"

import React, { useState, useEffect, useRef } from "react"
import { Send, Square, ChevronRight, ChevronLeft, Bot, Eye, Moon, Sun, Grid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat-message"
import { PreviewPanel } from "@/components/preview-panel"
import { StatusIndicator } from "@/components/status-indicator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useChat } from "@ai-sdk/react"

type AgentStatus = "idle" | "planning" | "coding" | "testing" | "fixing" | "ready" | "error"

interface Provider {
  name: string
  type: string
  model: string
  default: boolean
}

interface SavedApp {
  id: string
  name: string
  icon: string
  code: string
  url: string
}

export default function Home() {
  const [status, setStatus] = useState<AgentStatus>("idle")
  const [darkMode, setDarkMode] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAppDrawer, setShowAppDrawer] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [previewWidth, setPreviewWidth] = useState(30)
  const [isResizing, setIsResizing] = useState(false)
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [localPreviewCode, setLocalPreviewCode] = useState("")
  const [blobUrl, setBlobUrl] = useState<string>("")
  const [savedApps, setSavedApps] = useState<SavedApp[]>([])
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [contextMenu, setContextMenu] = useState<{ appId: string; x: number; y: number } | null>(null)
  const [longPressedApp, setLongPressedApp] = useState<SavedApp | null>(null)

  const {
    messages,
    input,
    setInput,
    isLoading: isGenerating,
    append,
    stop: stopChat,
  } = useChat({
    api: "/api/chat",
    body: {
      isAutonomous: true,
      selectedProvider,
    },
    onError: (error) => {
      console.error("Chat error:", error)
      setStatus("error")
    },
    onFinish: () => {
      setStatus("ready")
    },
    onToolCall: (params) => {
      if (params.toolCall.toolName === "announce") {
        const { phase } = params.toolCall.args as any
        setStatus(phase as AgentStatus)
      }
    },
    experimental_throttle: 100,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b' && !e.altKey) {
        e.preventDefault()
        setShowSettings(!showSettings)
      }
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault()
        setShowPreview(!showPreview)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, showPreview])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const percentage = ((window.innerWidth - e.clientX) / window.innerWidth) * 100
        if (percentage >= 20 && percentage <= 80) {
          setPreviewWidth(percentage)
        }
      }
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode")
    const savedShowPreview = localStorage.getItem("showPreview")
    const savedShowSettings = localStorage.getItem("showSettings")
    
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === "true")
      if (savedDarkMode === "true") {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    if (savedShowPreview !== null) {
      setShowPreview(savedShowPreview === "true")
    }
    if (savedShowSettings !== null) {
      setShowSettings(savedShowSettings === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString())
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem("showPreview", showPreview.toString())
  }, [showPreview])

  useEffect(() => {
    localStorage.setItem("showSettings", showSettings.toString())
  }, [showSettings])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isGenerating])

  useEffect(() => {
    const saved = localStorage.getItem("savedApps")
    if (saved) {
      try {
        const apps: SavedApp[] = JSON.parse(saved)
        setSavedApps(apps)
      } catch (e) {
        console.error("Failed to load saved apps")
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("savedApps", JSON.stringify(savedApps))
  }, [savedApps])

  useEffect(() => {
    let mounted = true
    
    async function loadProviders() {
      try {
        const res = await fetch("/api/chat")
        const data = await res.json()
        if (mounted) {
          setProviders(data.providers)
          if (data.defaultProvider) {
            setSelectedProvider(data.defaultProvider)
          } else if (data.providers.length > 0) {
            const defaultProvider = data.providers.find((p: Provider) => p.default)
            if (defaultProvider) {
              setSelectedProvider(defaultProvider.name)
            }
          }
        }
      } catch (error) {
        console.error("Failed to load providers:", error)
      } finally {
        if (mounted) setLoadingProviders(false)
      }
    }
    
    loadProviders()
    
    return () => { mounted = false }
  }, [])

  const handleConsoleMessage = (msg: string) => {
    const event = new CustomEvent("addErrorToFixer", { detail: msg })
    window.dispatchEvent(event)
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = null
    stopChat()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isGenerating) return
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = null
    
    setLocalPreviewCode("")
    setBlobUrl("")
    setStatus("idle")
    
    await append({ role: "user", content: input })
    setInput("")
  }

  function getAppIcon(appName: string): string {
    const lowered = appName.toLowerCase()
    if (lowered.includes('todo') || lowered.includes('task')) return '✅'
    if (lowered.includes('calc')) return '🔢'
    if (lowered.includes('note') || lowered.includes('memo')) return '📝'
    if (lowered.includes('clock') || lowered.includes('timer') || lowered.includes('time')) return '⏰'
    if (lowered.includes('weather')) return '🌤️'
    if (lowered.includes('game')) return '🎮'
    if (lowered.includes('photo') || lowered.includes('image') || lowered.includes('pic')) return '📷'
    if (lowered.includes('music') || lowered.includes('song') || lowered.includes('audio')) return '🎵'
    if (lowered.includes('contact') || lowered.includes('phone') || lowered.includes('phonebook')) return '📱'
    if (lowered.includes('shop') || lowered.includes('cart') || lowered.includes('buy')) return '🛒'
    if (lowered.includes('food') || lowered.includes('recipe') || lowered.includes('cook')) return '🍳'
    if (lowered.includes('chat') || lowered.includes('talk') || lowered.includes('message')) return '💬'
    if (lowered.includes('fitness') || lowered.includes('workout') || lowered.includes('health')) return '💪'
    if (lowered.includes('travel') || lowered.includes('trip') || lowered.includes('plane')) return '✈️'
    return '🎨'
  }

  useEffect(() => {
    let htmlCode = ""
    for (const message of messages) {
      if (message.role === 'assistant' && message.content) {
        const match = message.content.match(/```html([\s\S]*?)```/)
        if (match) {
          htmlCode = match[1].trim()
          break
        }
      }
    }
    if (htmlCode) {
      setLocalPreviewCode(htmlCode)
    }
  }, [messages])

  useEffect(() => {
    if (status === "ready" && localPreviewCode) {
      const lastUserMsg = messages.filter(m => m.role === 'user').pop()
      const appName = lastUserMsg?.content?.substring(0, 20).replace(/[^a-zA-Z0-9]/g, ' ').trim() || 'My App'
      const icon = getAppIcon(appName)
      
      const newApp: SavedApp = {
        id: Date.now().toString(),
        name: appName,
        icon: icon,
        code: localPreviewCode,
        url: ""
      }
      
      setSavedApps(prev => {
        const existingIndex = prev.findIndex(a => a.name === appName)
        if (existingIndex >= 0) {
          return prev
        }
        return [newApp, ...prev]
      })
    }
  }, [status, localPreviewCode])

  useEffect(() => {
    if (localPreviewCode) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>My App</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background: #1a1a2e; 
              color: #eaeaea;
              min-height: 100vh;
              padding: 16px;
            }
            .app-container { max-width: 100%; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="app-container">
            ${localPreviewCode}
          </div>
          <script>
            window.parent.postMessage({ type: 'loaded' }, '*');
          <\/script>
        </body>
        </html>
      `
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [localPreviewCode])

  const openSavedApp = (app: SavedApp) => {
    setLocalPreviewCode(app.code)
    setBlobUrl(app.url)
    setShowPreview(true)
    setShowAppDrawer(false)
  }

  const deleteSavedApp = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const app = savedApps.find(a => a.id === appId)
    setSavedApps(prev => prev.filter(a => a.id !== appId))
  }

  const handleLongPressStart = (app: SavedApp, e: React.MouseEvent) => {
    e.preventDefault()
    setLongPressedApp(app)
    const timer = setTimeout(() => {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setContextMenu({
        appId: app.id,
        x: rect.left,
        y: rect.bottom + 5
      })
    }, 500)
    setLongPressTimer(timer)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setContextMenu(null)
    setLongPressedApp(null)
  }

  const downloadApp = (app: SavedApp) => {
    const blob = new Blob([app.code], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${app.name.replace(/\s+/g, '_').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setContextMenu(null)
    setLongPressedApp(null)
  }

  const removeApp = (appId: string) => {
    const app = savedApps.find(a => a.id === appId)
    setSavedApps(prev => prev.filter(a => a.id !== appId))
    setContextMenu(null)
    setLongPressedApp(null)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Settings Panel */}
      {showSettings && (
        <div className="w-full sm:w-[20%] border-r bg-card flex flex-col transition-all duration-300 overflow-y-auto"
             style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Settings</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => setShowSettings(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm mb-2 block">Model</label>
              <Select
                value={selectedProvider}
                onValueChange={setSelectedProvider}
                disabled={loadingProviders}
              >
                <SelectTrigger className="h-9">
                  <Bot className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.name} value={provider.name}>
                      {provider.name} ({provider.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 border-t mt-auto sm:block hidden">
            <h3 className="text-sm font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Toggle Settings</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+B</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Toggle Preview</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+X</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fullscreen Preview */}
      {showPreview && window.innerWidth < 768 && (
        <div className="fixed inset-0 z-50 bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">Preview</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowPreview(false)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-[calc(100vh-53px)]">
            {blobUrl ? (
              <PreviewPanel previewUrl={blobUrl} onConsoleMessage={handleConsoleMessage} stopAutoReload={status === "ready"} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Preview will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-4 py-3 flex items-center justify-between bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <h1 className="font-semibold text-lg">Srishti <span className="text-red-600">AI</span></h1>
            <StatusIndicator status={status} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 relative"
              onClick={() => setShowAppDrawer(!showAppDrawer)}
              title="My Apps"
            >
              <Grid className="h-4 w-4" />
              {savedApps.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white">
                  {savedApps.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setShowPreview(!showPreview)
                } else {
                  setShowPreview(!showPreview)
                }
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4"
                    style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isUser = message.role === 'user'
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
                  <div className="max-w-[80%] sm:max-w-[70%]">
                    <ChatMessage message={message} />
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="border-t p-4 bg-card"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Describe the app you want to build..."
                className="min-h-[50px] max-h-[150px] resize-none rounded-xl border-input shadow-sm pr-24 text-left"
                disabled={isGenerating}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isGenerating && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={stopGeneration}
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  disabled={!input.trim() || isGenerating}
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* App Drawer - Android/iPhone style */}
      {showAppDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Background overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAppDrawer(false)}
          />
          
          {/* Main content area */}
          <div className="relative z-10 flex-1 flex flex-col p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">My Apps</h2>
              <button
                className="text-muted-foreground hover:text-foreground text-2xl"
                onClick={() => setShowAppDrawer(false)}
              >
                ✕
              </button>
            </div>
            
            {/* All apps section */}
            {savedApps.length > 0 && (
              <div className="flex-1">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">My Apps</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {savedApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col items-center gap-2"
                    >
                      {/* App icon */}
                      <div
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-md hover:scale-105 transition-transform cursor-pointer bg-card/50 border border-card-foreground/10"
                        onClick={() => openSavedApp(app)}
                        onContextMenu={(e: React.MouseEvent) => {
                          e.preventDefault()
                          handleLongPressStart(app, e)
                        }}
                        onMouseDown={() => handleLongPressStart(app, { target: document.activeElement } as any)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={(e) => {
                          const timer = setTimeout(() => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect()
                            setContextMenu({
                              appId: app.id,
                              x: rect.left,
                              y: rect.bottom + 5
                            })
                          }, 500)
                          setLongPressTimer(timer)
                        }}
                        onTouchEnd={handleLongPressEnd}
                      >
                        {app.icon}
                        {/* Dot indicator */}
                        <div className="absolute -bottom-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full" />
                      </div>
                      {/* App name */}
                      <p className="text-xs sm:text-sm text-muted-foreground text-center truncate w-full px-1">
                        {app.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Context Menu */}
          {contextMenu && longPressedApp && (
            <div
              className="absolute z-50 bg-card border border-card-foreground/20 rounded-xl shadow-xl overflow-hidden"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 text-foreground"
                onClick={() => downloadApp(longPressedApp)}
              >
                <span className="text-xl">⬇️</span>
                <span>Download</span>
              </button>
              <button
                className="w-full px-4 py-3 text-left hover:bg-destructive/20 flex items-center gap-3 text-destructive"
                onClick={() => removeApp(contextMenu.appId)}
              >
                <span className="text-xl">🗑️</span>
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Right Preview Panel - Full Height */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          showPreview ? "w-full sm:w-[50%]" : "w-0"
        }`}
      >
        {showPreview && (
          <>
            <div
              className="flex flex-col"
              style={{ width: '100%', height: '100%' }}
            >
              <div className="flex-1 overflow-hidden"
                    style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
                <div className="h-full">
                  {blobUrl ? (
                    <PreviewPanel previewUrl={blobUrl} onConsoleMessage={handleConsoleMessage} stopAutoReload={status === "ready"} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">Preview will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              className="cursor-col-resize hover:bg-primary/20 transition-colors"
              style={{ width: '4px' }}
              onMouseDown={() => setIsResizing(true)}
            />
          </>
        )}
      </div>
    </div>
  )
}
