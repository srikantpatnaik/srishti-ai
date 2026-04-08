"use client"

import React, { useState, useEffect, useRef } from "react"
import { Send, Square, Settings, ChevronRight, ChevronLeft, Bot } from "lucide-react"
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
  })

  const [isAutonomous, setIsAutonomous] = useState(true)

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
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

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
        const res = await fetch("/api/session", { method: "POST" })
        const data = await res.json()
        if (mounted && data.success) {
          setSessionId(data.sessionId)
          setProjectFolder(data.folder)
          // Start preview server but don't show yet
          try {
            const previewRes = await fetch("/api/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectFolder: data.folder }),
            })
            const previewData = await previewRes.json()
            if (previewData.success && previewData.url) {
              setPreviewUrl(previewData.url)
              setServerStarted(true)
            }
          } catch (previewError) {
            console.error("Failed to start preview server:", previewError)
          }
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
    stopChat()
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isGenerating) return
    
    await append({ role: "user", content: input })
    setInput("")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Settings Panel */}
      {showSettings && (
        <div className="w-[30%] border-r bg-card flex flex-col transition-all duration-300 overflow-y-auto"
             style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Settings</h2>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Dark Mode</span>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? "bg-primary" : "bg-muted"
                }`}
                onClick={() => setDarkMode(!darkMode)}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">Autonomous Mode</span>
              <button
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isAutonomous
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setIsAutonomous(!isAutonomous)}
              >
                {isAutonomous ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <div className="p-4 border-b">
            <FolderPicker folderPath={projectFolder} />
          </div>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowSettings(false)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </Button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-4 py-3 flex items-center justify-between bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg">Srishti</h1>
            <StatusIndicator status={status} />
            {!showSettings && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
              disabled={isGenerating || loadingProviders}
            >
              <SelectTrigger className="h-7 w-32 text-xs">
                <Bot className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.name} value={provider.name}>
                    {provider.name} ({provider.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!showPreview && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowPreview(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>

        <ScrollArea className="flex-1 p-4"
                    style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-16 w-16 mx-auto mb-4 opacity-20 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-3xl">🤖</span>
                </div>
                <p className="text-xl font-medium mb-2">What would you like to build?</p>
                <p className="text-sm max-w-md mx-auto">
                  Describe your app and I&apos;ll autonomously plan, code, test, and prepare it for deployment
                </p>
              </div>
            )}
            {messages.filter(m => m.role !== 'data').map((message) => (
              <div key={message.id} className="max-w-[70%] mx-auto">
                <ChatMessage message={message} />
              </div>
            ))}
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="border-t p-4 bg-card"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              {isGenerating && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-8 right-0 h-7 w-7 rounded-lg"
                  onClick={stopGeneration}
                >
                  <Square className="h-3 w-3" />
                </Button>
              )}
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
                  className="min-h-[50px] max-h-[150px] resize-none pr-10 rounded-xl border-input shadow-sm"
                  disabled={isGenerating}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-2 bottom-2 rounded-lg"
                  disabled={!input.trim() || isGenerating}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Right Preview Panel - Full Height */}
      {showPreview && (
        <>
          <div
            className="border-l bg-card flex flex-col"
            style={{ width: `${previewWidth}%` }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
              <span className="text-sm font-medium">Preview</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowPreview(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1"
                 style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
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
          <div
            className="cursor-col-resize hover:bg-primary/20 transition-colors"
            style={{ width: '4px' }}
            onMouseDown={() => setIsResizing(true)}
          />
        </>
      )}
    </div>
  )
}