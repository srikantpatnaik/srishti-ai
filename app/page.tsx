"use client"

import React, { useState, useEffect, useRef } from "react"
import { Send, Square, ChevronRight, ChevronLeft, Bot, Eye, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat-message"
import { PreviewPanel } from "@/components/preview-panel"
import { StatusIndicator } from "@/components/status-indicator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderPicker } from "@/components/folder-picker"
import { useChat } from "@ai-sdk/react"

type AgentStatus = "idle" | "planning" | "coding" | "testing" | "fixing" | "ready" | "error"

interface Provider {
  name: string
  type: string
  model: string
  default: boolean
}

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState("")
  const [status, setStatus] = useState<AgentStatus>("idle")
  const [darkMode, setDarkMode] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [sessionId, setSessionId] = useState<string>("")
  const [projectFolder, setProjectFolder] = useState<string>("")
  const [serverStarted, setServerStarted] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(30)
  const [isResizing, setIsResizing] = useState(false)
  const abortControllerRef = React.useRef<AbortController | null>(null)

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
      projectFolder,
      sessionId,
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
        if (phase === "planning" && previewUrl && !showPreview) {
          setShowPreview(true)
        }
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
      if (e.ctrlKey && e.altKey && e.key === 'b') {
        e.preventDefault()
        setShowPreview(!showPreview)
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
    const savedSessionId = localStorage.getItem("sessionId")
    
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
    if (savedSessionId) {
      setSessionId(savedSessionId)
      localStorage.setItem("sessionId", savedSessionId)
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
    if (sessionId) {
      localStorage.setItem("sessionId", sessionId)
    }
  }, [sessionId])

  useEffect(() => {
    if (showPreview && !serverStarted && sessionId) {
      fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectFolder }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.url) {
          setPreviewUrl(data.url)
          setServerStarted(true)
        }
      })
      .catch(err => console.error("Failed to start preview server:", err))
    }
  }, [showPreview, serverStarted, sessionId, projectFolder])

  useEffect(() => {
    if (!showPreview && serverStarted) {
      fetch("/api/preview", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectFolder }),
      })
      .then(() => setServerStarted(false))
      .catch(err => console.error("Failed to stop preview server:", err))
    }
  }, [showPreview, serverStarted, projectFolder])

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
    
    async function createSession() {
      try {
        const existingSessionId = localStorage.getItem("sessionId")
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: existingSessionId || undefined }),
        })
        const data = await res.json()
        if (mounted && data.success) {
          setSessionId(data.sessionId)
          setProjectFolder(data.folder)
          localStorage.setItem("sessionId", data.sessionId)
        }
      } catch (error) {
        console.error("Failed to create session:", error)
      }
    }
    
    loadProviders()
    createSession()
    
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
    
    await append({ role: "user", content: input })
    setInput("")
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

          <div className="p-4 border-b">
            <FolderPicker folderPath={projectFolder} />
          </div>

          <div className="p-4 border-t mt-auto">
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
            {previewUrl ? (
              <PreviewPanel previewUrl={previewUrl} onConsoleMessage={handleConsoleMessage} stopAutoReload={status === "ready"} />
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
              className="h-6 w-6"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setShowPreview(!showPreview)
                } else {
                  if (!showPreview) {
                    setShowPreview(true)
                  } else {
                    setShowPreview(false)
                  }
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
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-1`}>
                  <div className="max-w-[85%] sm:max-w-[70%]">
                    <ChatMessage message={message} />
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="border-t p-4 bg-card"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
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
                     className="min-h-[50px] max-h-[150px] resize-none rounded-xl border-input shadow-sm pr-20 text-left"
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
          </div>
        </form>
      </div>

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
                  {previewUrl ? (
                    <PreviewPanel previewUrl={previewUrl} onConsoleMessage={handleConsoleMessage} stopAutoReload={status === "ready"} />
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