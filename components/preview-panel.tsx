"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PreviewPanelProps {
  previewUrl: string
  onConsoleMessage: (msg: string) => void
}

export function PreviewPanel({ previewUrl, onConsoleMessage }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "console") {
        const msg = `[${event.data.level}] ${event.data.message}`
        setConsoleOutput((prev) => [...prev.slice(-49), msg])
        if (event.data.level === "error") {
          onConsoleMessage(msg)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onConsoleMessage])

  const reloadPreview = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = iframeRef.current.src
    }
  }

  if (!previewUrl) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No preview available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b p-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <RefreshCw 
            className="h-3 w-3 cursor-pointer" 
            onClick={reloadPreview}
          />
          <span className="text-xs truncate">{previewUrl}</span>
        </div>
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-sm text-muted-foreground">Loading preview...</div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          onLoad={() => {
            setIsLoaded(true)
            setIsLoading(false)
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      {consoleOutput.length > 0 && (
        <div className="h-32 border-t bg-black/90 text-xs font-mono p-2 overflow-y-auto">
          {consoleOutput.map((log, i) => (
            <div key={i} className={log.includes("error") ? "text-red-400" : "text-gray-300"}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
