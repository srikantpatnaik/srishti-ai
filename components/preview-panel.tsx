import { useEffect, useRef, useState, useCallback } from "react"
import { X, ExternalLink, Download, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react"

interface PreviewPanelProps {
  previewUrl?: string
  imageUrl?: string | null
  localCode?: string
  appName?: string
  onConsoleMessage: (msg: string) => void
  stopAutoReload?: boolean
  onClose?: () => void
  onBack?: () => void
  hideBackButton?: boolean
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

export function PreviewPanel({
  previewUrl,
  imageUrl = null,
  localCode = "",
  appName = "My App",
  onConsoleMessage,
  stopAutoReload = false,
  onClose,
  onBack,
  hideBackButton = false,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartDistance = useRef<number | null>(null)
  const touchStartZoom = useRef<number>(1)
  const touchStartPan = useRef({ x: 0, y: 0 })
  const touchStartY = useRef<number>(0)
  const touchStartX = useRef<number>(0)
  const wheelListenerRef = useRef<((e: WheelEvent) => void) | null>(null)
  const lastTapTime = useRef<number>(0)
  const tapCount = useRef<number>(0)
  const [showTopBar, setShowTopBar] = useState(true)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDistance.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      touchStartZoom.current = zoom
      touchStartPan.current = { ...pan }
    } else if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY
      touchStartX.current = e.touches[0].clientX
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && touchStartDistance.current !== null) {
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const delta = currentDistance - touchStartDistance.current
      const newZoom = Math.max(0.5, Math.min(3, touchStartZoom.current + delta * 0.01))
      setZoom(newZoom)
    } else if (e.touches.length === 1 && zoom > 1) {
      const deltaX = e.touches[0].clientX - touchStartX.current
      const deltaY = e.touches[0].clientY - touchStartY.current
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      setShowTopBar(true)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (zoom === 1 && e.changedTouches.length === 1) {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0 && onNext) onNext()
        else if (deltaY < 0 && onPrev) onPrev()
      }
    }
    setIsDragging(false)
    touchStartDistance.current = null
    
    if (zoom > 1) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowTopBar(false)
      }, 2000)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setShowTopBar(true)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (zoom === 1) {
      setZoom(1.5)
      setPan({ x: 0, y: 0 })
      setShowTopBar(true)
    } else {
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setShowTopBar(true)
    }
  }

  useEffect(() => {
    if (!imageUrl) return

    const container = containerRef.current
    if (!container) return

    const handleWheelZoom = (e: WheelEvent) => {
      e.stopImmediatePropagation()
      e.preventDefault()
      e.stopPropagation()
      if (e.deltaY === 0) return
      const zoomStep = 0.1
      const delta = Math.sign(e.deltaY) * zoomStep
      setZoom(prev => Math.max(0.5, Math.min(3, prev - delta)))
    }

    container.style.overflow = 'hidden'
    container.style.overscrollBehavior = 'none'
    container.style.touchAction = 'none'
    container.style.pointerEvents = 'auto'

    const parent = container.parentElement
    if (parent) {
      parent.style.overflow = 'hidden'
      parent.style.overscrollBehavior = 'none'
      parent.style.touchAction = 'none'
    }

    const grandparent = parent?.parentElement
    if (grandparent) {
      grandparent.style.overflow = 'hidden'
      grandparent.style.overscrollBehavior = 'none'
    }

    const windowScrollListener = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
    }

    window.addEventListener('wheel', windowScrollListener, { passive: false, capture: true } as AddEventListenerOptions)
    document.addEventListener('wheel', windowScrollListener, { passive: false, capture: true } as AddEventListenerOptions)
    container.addEventListener('wheel', handleWheelZoom, { passive: false, capture: true } as AddEventListenerOptions)

    return () => {
      container.removeEventListener('wheel', handleWheelZoom, { passive: false, capture: true } as AddEventListenerOptions)
      document.removeEventListener('wheel', windowScrollListener, { passive: false, capture: true } as AddEventListenerOptions)
      window.removeEventListener('wheel', windowScrollListener, { passive: false, capture: true } as AddEventListenerOptions)
      if (parent) {
        parent.style.overflow = ''
        parent.style.overscrollBehavior = ''
        parent.style.touchAction = ''
      }
      if (grandparent) {
        grandparent.style.overflow = ''
        grandparent.style.overscrollBehavior = ''
      }
    }
  }, [imageUrl])

  useEffect(() => {
    if (!imageUrl) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && onPrev) {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'ArrowDown' && onNext) {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageUrl, onPrev, onNext])

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
    html, body { height: 100%; width: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); color: #eaeaea; width: 100vw; height: 100vh; }
    .app-container { width: 100%; height: 100%; }
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

  if (imageUrl) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div
          ref={containerRef}
          className="flex-1 h-full bg-[#121215] relative flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{
            overflow: 'hidden',
            WebkitOverflowScrolling: 'auto' as any,
            overscrollBehavior: 'none' as any,
            touchAction: 'none' as any
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={(e) => handleTouchEnd(e)}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <div className={`absolute top-3 right-3 z-10 flex gap-2 transition-opacity duration-300 ${showTopBar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {onBack && !hideBackButton && (
              <button
                onClick={onBack}
                className="p-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5] transition-all"
                title="Back to gallery"
              >
                <ArrowLeft className="h-4 w-4" />
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
          <div
            className="max-w-full max-h-full p-4"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out',
            }}
          >
            <img
              src={imageUrl}
              alt="Preview"
              className="object-contain"
              style={{ userSelect: 'none', pointerEvents: 'auto' }}
            />
          </div>
          {(hasPrev || hasNext) && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 pointer-events-none">
            </div>
          )}
          {zoom !== 1 && (
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
              className="absolute bottom-4 right-4 px-3 py-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5] transition-all text-sm"
            >
              Reset View
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!previewUrl && !localCode) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 h-full bg-[#121215] relative">
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          {onBack && !hideBackButton && (
            <button
              onClick={onBack}
              className="p-2 bg-[#1f1f23] rounded-lg text-[#888888] hover:bg-[#2e2e32] hover:text-[#e5e5e5] transition-all"
              title="Back to gallery"
            >
              <ArrowLeft className="h-4 w-4" />
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
          sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
          allow="fullscreen"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}