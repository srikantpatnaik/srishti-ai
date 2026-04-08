"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, Maximize2, ExternalLink, Download } from "lucide-react"

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
    if (stopAutoReload || !isLoaded) {
      return
    }

    const interval = setInterval(() => {
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isLoaded, stopAutoReload])

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
        <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={() => window.open(previewUrl, '_blank')}
            className="p-2 bg-card/80 backdrop-blur-sm rounded-lg border border-card-foreground/20 hover:bg-card hover:shadow-lg transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const win = window.open(previewUrl, '_blank')
              if (win) {
                win.focus()
                win.document.body.style.margin = '0'
                win.document.body.style.padding = '0'
              }
            }}
            className="p-2 bg-card/80 backdrop-blur-sm rounded-lg border border-card-foreground/20 hover:bg-card hover:shadow-lg transition-all"
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch(previewUrl)
                const html = await response.text()
                const blob = new Blob([html], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'offline-app.html'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              } catch (error) {
                console.error('Failed to download:', error)
              }
            }}
            className="p-2 bg-card/80 backdrop-blur-sm rounded-lg border border-card-foreground/20 hover:bg-card hover:shadow-lg transition-all"
            title="Download as offline app"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
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
