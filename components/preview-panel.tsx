import { useEffect, useRef, useState } from "react"
import { ExternalLink, Download, Bookmark } from "lucide-react"
import JSZip from "jszip"

interface PreviewPanelProps {
  previewUrl: string
  localCode?: string
  onConsoleMessage: (msg: string) => void
  stopAutoReload?: boolean
  onSaveToGallery?: () => void
  hasSavedToGallery?: boolean
}

export function PreviewPanel({
  previewUrl,
  localCode = "",
  onConsoleMessage,
  stopAutoReload = false,
  onSaveToGallery,
  hasSavedToGallery = false,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [bookmarkClicked, setBookmarkClicked] = useState(false)

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
    setBookmarkClicked(false)
  }, [previewUrl, localCode])

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
    if (onSaveToGallery) {
      onSaveToGallery()
    }
    setBookmarkClicked(true)
  }

  if (!previewUrl && !localCode) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 h-full bg-[#121215] relative">
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={handleSaveToGallery}
            className={`p-2 rounded-lg transition-all ${
              bookmarkClicked
                ? 'bg-[#3b82f6]/20 text-[#3b82f6]'
                : 'bg-[#1f1f23] text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5]'
            }`}
            title={bookmarkClicked ? "Saved to Gallery" : "Save to Gallery"}
          >
            <Bookmark className={`h-4 w-4 ${bookmarkClicked ? 'fill-current' : ''}`} />
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
            className="p-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5] transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
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
            className="p-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5] transition-all"
            title="Download as offline app"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-[#888888]">
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
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allow="fullscreen"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
