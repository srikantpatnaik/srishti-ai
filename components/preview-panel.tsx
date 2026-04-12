import { useEffect, useRef, useState } from "react"
import { X, ExternalLink, Download, FolderHeart } from "lucide-react"

interface PreviewPanelProps {
  previewUrl?: string
  imageUrl?: string | null
  localCode?: string
  appName?: string
  onConsoleMessage: (msg: string) => void
  stopAutoReload?: boolean
  onClose?: () => void
  onImageSave?: () => void
  onImageDownload?: () => void
}

export function PreviewPanel({
  previewUrl,
  imageUrl = null,
  localCode = "",
  appName = "My App",
  onConsoleMessage,
  stopAutoReload = false,
  onClose,
  onImageSave,
  onImageDownload,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

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

  const handleOpenInNewTab = () => {
    if (!localCode) return

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${appName}</title>
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
</body>
</html>`
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  if (!previewUrl && !localCode) {
    return null
  }

  if (imageUrl) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 h-full bg-[#121215] relative flex items-center justify-center">
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            {onImageSave && (
              <button
                onClick={onImageSave}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#e94560] hover:text-white transition-all text-xs"
                title="Save to Gallery"
              >
                <FolderHeart className="h-4 w-4" />
                <span>Save</span>
              </button>
            )}
            {onImageDownload && (
              <button
                onClick={onImageDownload}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#3b82f6] hover:text-white transition-all text-xs"
                title="Download"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5] transition-all"
                title="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain p-4"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 h-full bg-[#121215] relative">
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5] transition-all text-xs"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5] transition-all"
              title="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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
