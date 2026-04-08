"use client"

import { useState, useEffect } from "react"
import { Send, Square, Settings, ChevronRight, ChevronLeft, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat-message"
import { PreviewPanel } from "@/components/preview-panel"
import { StatusIndicator } from "@/components/status-indicator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderPicker } from "@/components/folder-picker"

type AgentStatus = "idle" | "planning" | "coding" | "testing" | "fixing" | "ready" | "error"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  type?: "text" | "code" | "error" | "plan" | "file"
  filePath?: string
}

interface Provider {
  name: string
  type: string
  model: string
  default: boolean
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAutonomous, setIsAutonomous] = useState(true)
  const [previewUrl, setPreviewUrl] = useState("")
  const [status, setStatus] = useState<AgentStatus>("idle")
  const [darkMode, setDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [projectFolder, setProjectFolder] = useState<string>("")

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  useEffect(() => {
    async function loadProviders() {
      try {
        const res = await fetch("/api/chat")
        const data = await res.json()
        setProviders(data.providers)
        if (data.defaultProvider) {
          setSelectedProvider(data.defaultProvider)
        } else if (data.providers.length > 0) {
          const defaultProvider = data.providers.find((p: Provider) => p.default)
          if (defaultProvider) {
            setSelectedProvider(defaultProvider.name)
          }
        }
      } catch (error) {
        console.error("Failed to load providers:", error)
      } finally {
        setLoadingProviders(false)
      }
    }
    loadProviders()
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsGenerating(true)
    setStatus("planning")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          isAutonomous,
          selectedProvider,
          projectFolder,
        }),
      })

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const events = buffer.split("\n")
        buffer = events.pop() || ""

        for (const event of events) {
          if (!event.startsWith("data: ")) continue
          const data = JSON.parse(event.slice(6))
          if (data.type === "text" && data.text) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage?.role === "assistant") {
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + data.text },
              ])
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: data.text,
                  type: "text",
                },
              ])
            }
          }
        }
      }

      setIsGenerating(false)
      setStatus("ready")
    } catch (error) {
      console.error("Chat error:", error)
      setIsGenerating(false)
      setStatus("error")
    }
  }

  const handleConsoleMessage = (msg: string) => {
    const event = new CustomEvent("addErrorToFixer", { detail: msg })
    window.dispatchEvent(event)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Settings Flap */}
      {!showSettings && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-r-lg"
          onClick={() => setShowSettings(true)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Left Settings Panel */}
      {showSettings && (
        <div className="w-72 border-r bg-card flex flex-col transition-all duration-300">
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
            <FolderPicker onSelectFolder={setProjectFolder} />
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
      <div className="flex-1 flex flex-col">
        <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg">App Builder</h1>
            <StatusIndicator status={status} />
          </div>
          <div className="flex items-center gap-2">
            {isGenerating && (
              <Button variant="destructive" size="sm" onClick={() => setIsGenerating(false)}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
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
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="border-t p-4 bg-card"
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Select
                value={selectedProvider}
                onValueChange={setSelectedProvider}
                disabled={isGenerating || loadingProviders}
              >
                <SelectTrigger className="h-8 w-48">
                  <Bot className="h-3 w-3 mr-2" />
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
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Describe the app you want to build..."
                className="min-h-[50px] max-h-[150px] resize-none pr-12 rounded-xl border-input shadow-sm"
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
        </form>
      </div>

      {/* Right Preview Flap */}
      {!showPreview && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-l-lg"
          onClick={() => setShowPreview(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Right Preview Panel */}
      {showPreview && (
        <div className="w-96 border-l bg-card flex flex-col transition-all duration-300">
          <div className="flex items-center justify-between px-4 py-2 border-b">
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
          {previewUrl ? (
            <div className="flex-1">
              <PreviewPanel previewUrl={previewUrl} onConsoleMessage={handleConsoleMessage} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">Preview will appear here</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}