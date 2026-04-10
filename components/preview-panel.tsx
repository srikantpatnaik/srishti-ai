import { useEffect, useRef, useState } from "react"
import { RefreshCw, ExternalLink, Download, Bookmark, ChevronLeft, ChevronRight } from "lucide-react"
import JSZip from "jszip"

interface PreviewPanelProps {
  previewUrl: string
  localCode?: string
  onConsoleMessage: (msg: string) => void
  stopAutoReload?: boolean
  onSaveToGallery?: (code: string, name: string) => void
  hasSavedToGallery?: boolean
  sessionApps?: any[]
  currentAppIndex?: number
  onNavigateNext?: () => void
  onNavigatePrev?: () => void
}

export function PreviewPanel({
  previewUrl,
  localCode = "",
  onConsoleMessage,
  stopAutoReload = false,
  onSaveToGallery,
  hasSavedToGallery = false,
  sessionApps = [],
  currentAppIndex = -1,
  onNavigateNext,
  onNavigatePrev
}: PreviewPanelProps) {
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

  const getHtmlForDownload = () => {
    if (localCode) {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>My App</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eaeaea; min-height: 100vh; padding: 16px; }
            .app-container { max-width: 100%; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="app-container">
            ${localCode}
          </div>
          <script>
            window.parent.postMessage({ type: 'loaded' }, '*');
          </script>
        </body>
        </html>
      `
    }
    return null
  }

  const handleSaveToGallery = () => {
    const html = getHtmlForDownload()
    if (html) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
      const appName = titleMatch ? titleMatch[1].trim() : 'My App'
      if (onSaveToGallery) onSaveToGallery(html, appName)
    }
  }

  const displayUrl = previewUrl

  if (!displayUrl && !localCode) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 h-full bg-card relative">
        <div className="absolute top-4 left-4 z-10 flex gap-1">
          {sessionApps.length > 1 && (
            <>
              <button
                onClick={onNavigatePrev}
                disabled={currentAppIndex <= 0}
                className={`p-1.5 backdrop-blur-xl rounded-md border transition-all ${
                  currentAppIndex <= 0
                    ? 'bg-muted/30 border-muted/20 text-muted/50 cursor-not-allowed'
                    : 'bg-card/30 border-card-foreground/5 hover:bg-card/40'
                }`}
                title="Previous version"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-xs text-muted-foreground self-center bg-card/50 rounded">
                {currentAppIndex + 1}/{sessionApps.length}
              </span>
              <button
                onClick={onNavigateNext}
                disabled={currentAppIndex >= sessionApps.length - 1}
                className={`p-1.5 backdrop-blur-xl rounded-md border transition-all ${
                  currentAppIndex >= sessionApps.length - 1
                    ? 'bg-muted/30 border-muted/20 text-muted/50 cursor-not-allowed'
                    : 'bg-card/30 border-card-foreground/5 hover:bg-card/40'
                }`}
                title="Next version"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleSaveToGallery}
            className={`p-1.5 backdrop-blur-xl rounded-md border transition-all ${
              hasSavedToGallery
                ? 'bg-green-500/20 border-green-500/30 text-green-500'
                : 'bg-primary/20 border-primary/10 hover:bg-primary/30 text-primary'
            }`}
            title={hasSavedToGallery ? "Saved to Gallery" : "Save to Gallery"}
          >
            <Bookmark className={`h-3.5 w-3.5 ${hasSavedToGallery ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => {
              const html = getHtmlForDownload()
              if (html) {
                const blob = new Blob([html], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                window.open(url, '_blank')
                setTimeout(() => URL.revokeObjectURL(url), 10000)
              } else {
                window.open(previewUrl, '_blank')
              }
            }}
            className="p-1.5 bg-card/30 backdrop-blur-xl rounded-md border border-card-foreground/5 hover:bg-card/40 transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={async () => {
              try {
                const zip = new JSZip()
                let html = getHtmlForDownload()
                if (!html) {
                  html = await (await fetch(previewUrl)).text()
                }
                
                const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
                const appName = titleMatch ? titleMatch[1].trim() : 'offline-app'
                const safeAppName = appName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
                zip.file("index.html", html)
                const zipBlob = await zip.generateAsync({ type: "blob" })
                const url = URL.createObjectURL(zipBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `${safeAppName}.zip`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              } catch (error) {
                console.error('Failed to download:', error)
                alert('Download failed. Try opening in a new tab and saving the page manually.')
              }
            }}
            className="p-1.5 bg-card/30 backdrop-blur-xl rounded-md border border-card-foreground/5 hover:bg-card/40 transition-all"
            title="Download as offline app"
          >
            <Download className="h-3.5 w-3.5" />
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
          src={displayUrl}
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
