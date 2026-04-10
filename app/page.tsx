"use client"

import React, { useState, useEffect, useRef } from "react"
import { Send, Square, ChevronRight, ChevronLeft, Bot, Eye, Moon, Sun, Grid, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat-message"
import { PreviewPanel } from "@/components/preview-panel"
import { StatusIndicator } from "@/components/status-indicator"
import { useChat } from "@ai-sdk/react"
import { useDarkMode, useKeyboardShortcuts, useResizing } from "@/hooks/use-ui-utils"
import { SettingsPanel } from "@/components/settings-panel"
import { AppDrawer } from "@/components/app-drawer"
import { ChatInput } from "@/components/chat-input"
import { AgentStatus, Provider, SavedApp } from "@/types"
import { saveAppToDB, getAllAppsFromDB, deleteAppFromDB } from "@/lib/db"

export default function Home() {
  const [status, setStatus] = useState<AgentStatus>("idle")
  const [showSettings, setShowSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showAppDrawer, setShowAppDrawer] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [previewWidth, setPreviewWidth] = useState(30)
  const [isResizing, setIsResizing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [localPreviewCode, setLocalPreviewCode] = useState("")
  const [blobUrl, setBlobUrl] = useState<string>("")
  const [savedApps, setSavedApps] = useState<SavedApp[]>([])
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [contextMenu, setContextMenu] = useState<{ appId: string; x: number; y: number } | null>(null)
  const [longPressedApp, setLongPressedApp] = useState<SavedApp | null>(null)
  const [isBuilding, setIsBuilding] = useState(false)
  const [initialMessages, setInitialMessages] = useState<any[]>([])

  const { darkMode, setDarkMode } = useDarkMode()

  const { handleMouseDown: handleResizeMouseDown } = useResizing(setPreviewWidth, setIsResizing)
  
  useKeyboardShortcuts(
    showSettings, setShowSettings,
    showPreview, setShowPreview,
    showAppDrawer, setShowAppDrawer,
    setContextMenu, setLongPressedApp
  )

  const {
    messages,
    input,
    setInput,
    isLoading: isGenerating,
    append,
    stop: stopChat,
  } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages,
    body: { isAutonomous: true, selectedProvider },
    onError: (error) => {
      console.error("Chat error:", error)
      setStatus("error")
    },
    onFinish: () => {
      if (isBuilding) setStatus("ready")
    },
    onToolCall: (params) => {
      if (params.toolCall.toolName === "announce") {
        const { phase } = params.toolCall.args as any
        setStatus(phase as AgentStatus)
      }
    },
    experimental_throttle: 100,
  })

  // Persistence and loading effects
  useEffect(() => {
    const savedShowPreview = localStorage.getItem("showPreview")
    const savedShowSettings = localStorage.getItem("showSettings")
    if (savedShowPreview !== null) setShowPreview(savedShowPreview === "true")
    if (savedShowSettings !== null) setShowSettings(savedShowSettings === "true")
  }, [])

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
    const loadSavedApps = async () => {
      const savedAppsData = await getAllAppsFromDB()
      const appsWithUrls = savedAppsData.map(app => {
        try {
          const blob = new Blob([app.code], { type: 'text/html' })
          return { ...app, url: URL.createObjectURL(blob) }
        } catch (e) { return app }
      })
      setSavedApps(appsWithUrls)
    }
    loadSavedApps()
  }, [])

  useEffect(() => {
    const savedMessagesData = localStorage.getItem("chatMessages")
    if (savedMessagesData) {
      try {
        const messagesData = JSON.parse(savedMessagesData)
        if (messagesData.length > 0) {
          setInitialMessages(messagesData)
          setInput("")
          for (let i = messagesData.length - 1; i >= 0; i--) {
            const message = messagesData[i]
            if (message.role === 'assistant' && message.content) {
              const match = message.content.match(/```html([\s\S]*?)```/)
              if (match) {
                setLocalPreviewCode(match[1].trim())
                break
              }
            }
          }
        }
      } catch (e) { console.error("Failed to load chat messages") }
    }
  }, [])

  useEffect(() => {
    savedApps.forEach(app => {
      const appWithoutUrl = { ...app, url: "" }
      saveAppToDB(appWithoutUrl)
    })
  }, [savedApps])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem("chatMessages", JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    return () => {
      savedApps.forEach(app => { if (app.url) URL.revokeObjectURL(app.url) })
    }
  }, [savedApps])

  useEffect(() => {
    async function loadProviders() {
      try {
        const res = await fetch("/api/chat")
        const data = await res.json()
        setProviders(data.providers)
        const defaultProvider = data.defaultProvider || data.providers.find((p: Provider) => p.default)
        if (defaultProvider) setSelectedProvider(defaultProvider.name)
      } catch (error) {
        console.error("Failed to load providers:", error)
      } finally {
        setLoadingProviders(false)
      }
    }
    loadProviders()
  }, [])

  const handleConsoleMessage = (msg: string) => {
    window.dispatchEvent(new CustomEvent("addErrorToFixer", { detail: msg }))
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = null
    stopChat()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isGenerating) return
    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = null
    setLocalPreviewCode("")
    setBlobUrl("")
    setStatus("idle")
    setIsBuilding(true)
    setHasSavedToGallery(false)
    setSessionApps([])
    setCurrentAppIndex(-1)
    await append({ role: "user", content: input })
    setInput("")
  }

  function getAppIcon(appName: string): string {
    const lowered = appName.toLowerCase()
    if (lowered.includes('sudoku') || lowered.includes('puzzle')) return '🧩'
    if (lowered.includes('todo') || lowered.includes('task')) return '✅'
    if (lowered.includes('calc')) return '🔢'
    if (lowered.includes('note')) return '📝'
    if (lowered.includes('clock')) return '⏰'
    if (lowered.includes('weather')) return '🌤️'
    if (lowered.includes('game')) return '🎮'
    if (lowered.includes('photo') || lowered.includes('image')) return '📷'
    if (lowered.includes('music')) return '🎵'
    if (lowered.includes('contact')) return '📱'
    if (lowered.includes('shop') || lowered.includes('cart')) return '🛒'
    if (lowered.includes('food')) return '🍳'
    if (lowered.includes('chat')) return '💬'
    if (lowered.includes('fitness')) return '💪'
    if (lowered.includes('travel')) return '✈️'
    if (lowered.includes('book')) return '📚'
    if (lowered.includes('video')) return '🎬'
    if (lowered.includes('camera')) return '📸'
    if (lowered.includes('map')) return '🗺️'
    if (lowered.includes('bank') || lowered.includes('money')) return '💰'
    if (lowered.includes('art')) return '🎨'
    return '📱'
  }

  useEffect(() => {
    let htmlCode = ""
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message.role === 'assistant' && message.content) {
        const match = message.content.match(/```html([\s\S]*?)```/)
        if (match) {
          htmlCode = match[1].trim()
          break
        }
      }
    }
    if (htmlCode) setLocalPreviewCode(htmlCode)
  }, [messages])

  useEffect(() => {
    if (status === "ready" && localPreviewCode) {
      const lastUserMsg = messages.filter(m => m.role === 'user').pop()
      const rawName = lastUserMsg?.content?.substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, ' ').trim() || 'My App'
      const appName = rawName.split(' ').slice(0, 2).join(' ')
      const newApp: SavedApp = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: appName,
        icon: getAppIcon(appName),
        code: localPreviewCode,
        url: ""
      }
      setSavedApps(prev => prev.some(a => a.code === localPreviewCode) ? prev : [newApp, ...prev])
      setSessionApps(prev => [...prev.filter(a => a.code !== localPreviewCode), newApp])
      setCurrentAppIndex(prev => prev + 1)
      setIsBuilding(false)
    }
  }, [status, localPreviewCode, messages])

  useEffect(() => {
    if (localPreviewCode) {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>My App</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e;color:#eaeaea;min-height:100vh;padding:16px;}.app-container{max-width:100%;margin:0 auto;}</style></head><body><div class="app-container">${localPreviewCode}</div><script>window.parent.postMessage({ type: 'loaded' }, '*');</script></body></html>`
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [localPreviewCode])

  const openSavedApp = (app: SavedApp) => {
    setLocalPreviewCode(app.code)
    setShowPreview(true)
    setShowAppDrawer(false)
    if (app.url) {
      setBlobUrl(app.url)
    } else {
      const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>${app.name}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e;color:#eaeaea;min-height:100vh;padding:16px;}.app-container{max-width:100%;margin:0 auto;}</style></head><body><div class="app-container">${app.code}</div><script>window.parent.postMessage({ type: 'loaded' }, '*');</script></body></html>`
      const blob = new Blob([htmlContent], { type: 'text/html' })
      setBlobUrl(URL.createObjectURL(blob))
    }
  }

  const removeApp = async (appId: string) => {
    await deleteAppFromDB(appId)
    setSavedApps(prev => prev.filter(a => a.id !== appId))
    setContextMenu(null)
    setLongPressedApp(null)
  }

  const handleLongPressStart = (app: SavedApp, e: any) => {
    if (e?.preventDefault) e.preventDefault()
    setLongPressedApp(app)
    const timer = setTimeout(() => {
      const target = e?.target || document.activeElement
      const rect = (target as HTMLElement).getBoundingClientRect()
      setContextMenu({ appId: app.id, x: rect.left, y: rect.bottom + 5 })
    }, 500)
    setLongPressTimer(timer)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer)
    setLongPressTimer(null)
    setContextMenu(null)
    setLongPressedApp(null)
  }

  const newSession = () => {
    localStorage.removeItem("chatMessages")
    setInput("")
    setStatus("idle")
    setIsBuilding(false)
    setLocalPreviewCode("")
    if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl("") }
  }

  const [hasSavedToGallery, setHasSavedToGallery] = useState(false)
  const [sessionApps, setSessionApps] = useState<SavedApp[]>([])
  const [currentAppIndex, setCurrentAppIndex] = useState(-1)


  const handleSaveToGallery = () => {
    if (hasSavedToGallery) return
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()
    const rawName = lastUserMsg?.content?.substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, ' ').trim() || 'My App'
    const appName = rawName.split(' ').slice(0, 2).join(' ')
    const newApp: SavedApp = {
      id: Date.now().toString(),
      name: appName,
      icon: getAppIcon(appName),
      code: localPreviewCode,
      url: ""
    }
    setSavedApps(prev => prev.some(a => a.code === localPreviewCode) ? prev : [newApp, ...prev])
    setHasSavedToGallery(true)
  }

  const navigateToNextApp = () => {
    if (currentAppIndex < sessionApps.length - 1) {
      const nextApp = sessionApps[currentAppIndex + 1]
      setLocalPreviewCode(nextApp.code)
      setCurrentAppIndex(prev => prev + 1)
    }
  }

  const navigateToPrevApp = () => {
    if (currentAppIndex > 0) {
      const prevApp = sessionApps[currentAppIndex - 1]
      setLocalPreviewCode(prevApp.code)
      setCurrentAppIndex(prev => prev - 1)
    }
  }

    return (
    <div className="flex h-screen bg-background">
      <SettingsPanel 
        showSettings={showSettings} setShowSettings={setShowSettings}
        darkMode={darkMode} setDarkMode={setDarkMode}
        providers={providers} selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider} loadingProviders={loadingProviders}
      />

      {showPreview && window.innerWidth < 768 && (
        <div className="fixed inset-0 z-50 bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">Preview</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPreview(false)}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-[calc(100vh-53px)]">
            {blobUrl ? (
              <PreviewPanel previewUrl={blobUrl} onConsoleMessage={handleConsoleMessage} stopAutoReload={status === "ready"} onSaveToGallery={handleSaveToGallery} hasSavedToGallery={hasSavedToGallery} sessionApps={sessionApps} currentAppIndex={currentAppIndex} onNavigateNext={navigateToNextApp} onNavigatePrev={navigateToPrevApp} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground"><p className="text-sm">Preview will appear here</p></div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-4 py-3 flex items-center justify-between bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <h1 className="font-semibold text-lg">Srishti <span className="text-red-600">AI</span></h1>
            <StatusIndicator status={status} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6 relative" onClick={() => setShowAppDrawer(!showAppDrawer)}>
              <Grid className="h-4 w-4" />
              {savedApps.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white">{savedApps.length}</span>}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={newSession}><Plus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPreview(!showPreview)}><Eye className="h-4 w-4" /></Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4" style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                <div className="max-w-[80%] sm:max-w-[70%]"><ChatMessage message={msg} /></div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <ChatInput 
          input={input} setInput={setInput} isGenerating={isGenerating}
          handleSubmit={handleSubmit} stopGeneration={stopGeneration}
        />
      </div>

      <AppDrawer 
        showAppDrawer={showAppDrawer} setShowAppDrawer={setShowAppDrawer}
        savedApps={savedApps} openSavedApp={openSavedApp} removeApp={removeApp}
        handleLongPressStart={handleLongPressStart} handleLongPressEnd={handleLongPressEnd}
        contextMenu={contextMenu} setContextMenu={setContextMenu} longPressedApp={longPressedApp}
      />

      <div className={`transition-all duration-300 overflow-hidden ${showPreview ? "w-full sm:w-[50%]" : "w-0"}`}>
        {showPreview && (
          <>
            <div className="flex-1 h-full overflow-hidden" style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
              {blobUrl ? <PreviewPanel previewUrl={blobUrl} onConsoleMessage={handleConsoleMessage} stopAutoReload={status === "ready"} onSaveToGallery={handleSaveToGallery} hasSavedToGallery={hasSavedToGallery} sessionApps={sessionApps} currentAppIndex={currentAppIndex} onNavigateNext={navigateToNextApp} onNavigatePrev={navigateToPrevApp} /> : <div className="h-full flex items-center justify-center text-muted-foreground"><p className="text-sm">Preview will appear here</p></div>}
            </div>
            <div className="cursor-col-resize hover:bg-primary/20 transition-colors" style={{ width: '4px' }} onMouseDown={handleResizeMouseDown} />
          </>
        )}
      </div>
    </div>
  )
}
