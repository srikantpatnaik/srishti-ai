"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"

interface PreviewPanelProps {
  previewUrl: string
  onConsoleMessage: (msg: string) => void
  stopAutoReload?: boolean
}

export function PreviewPanel({ previewUrl, onConsoleMessage, stopAutoReload = false }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "console") {
        const msg = `[${event.data.level}] ${event.data.message}`
        if (event.data.level === "error") {
          onConsoleMessage(msg)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onConsoleMessage])

  useEffect(() => {
    const handleInteract = () => {
      setHasUserInteracted(true)
    }

    window.addEventListener('mousedown', handleInteract)
    window.addEventListener('touchstart', handleInteract)
    window.addEventListener('keydown', handleInteract)

    return () => {
      window.removeEventListener('mousedown', handleInteract)
      window.removeEventListener('touchstart', handleInteract)
      window.removeEventListener('keydown', handleInteract)
    }
  }, [])

  useEffect(() => {
    if (stopAutoReload || hasUserInteracted || !isLoaded) {
      return
    }

    const interval = setInterval(() => {
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isLoaded, stopAutoReload, hasUserInteracted])

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  if (!previewUrl) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 h-full bg-card relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Waiting for preview</p>
            </div>
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
          allow="fullscreen"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
