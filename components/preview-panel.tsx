"use client"

import { useState, useEffect, useRef } from "react"
import { Play, X, ExternalLink, Terminal as TerminalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PreviewPanelProps {
  previewUrl: string
  onConsoleMessage: (msg: string) => void
}

export function PreviewPanel({ previewUrl, onConsoleMessage }: PreviewPanelProps) {
  const [consoleMessages, setConsoleMessages] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleMessages])

  const handleConsoleMessage = (event: MessageEvent) => {
    if (event.data?.type === "console") {
      setConsoleMessages((prev) => [...prev, event.data.message])
      onConsoleMessage(event.data.message)
    }
  }

  useEffect(() => {
    window.addEventListener("message", handleConsoleMessage)
    return () => window.removeEventListener("message", handleConsoleMessage)
  }, [])

  const copyConsoleMessage = (msg: string, index: number) => {
    navigator.clipboard.writeText(msg)
    setConsoleMessages(consoleMessages.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Iframe Preview */}
      <div className="flex-1 bg-white relative">
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="App Preview"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => window.open(previewUrl, "_blank")}>
            <ExternalLink className="h-3 w-3 mr-1" />
            Open
          </Button>
        </div>
      </div>

      {/* Console Panel */}
      <div className={showConsole ? "h-48 border-t" : "h-8"}>
        <div
          className="flex items-center justify-between px-4 py-2 bg-muted cursor-pointer"
          onClick={() => setShowConsole(!showConsole)}
        >
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Console</span>
            {consoleMessages.length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {consoleMessages.length}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              setShowConsole(!showConsole)
            }}
          >
            {showConsole ? <X className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
        </div>

        {showConsole && (
          <div
            ref={consoleRef}
            className="h-[calc(100%-36px)] overflow-y-auto p-2 bg-black"
          >
            {consoleMessages.length === 0 ? (
              <div className="text-gray-500 text-sm p-2">No console messages</div>
            ) : (
              <div className="space-y-1">
                {consoleMessages.map((msg, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs p-1 rounded hover:bg-gray-800 cursor-pointer group"
                    onClick={() => copyConsoleMessage(msg, index)}
                  >
                    <span className="text-red-400 shrink-0">✕</span>
                    <span className="text-green-400 flex-1 break-all">
                      {msg}
                    </span>
                    <span className="text-gray-500 opacity-0 group-hover-opacity-100">
                      Click to insert to chat
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}