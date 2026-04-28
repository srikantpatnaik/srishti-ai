import React, { useState, useRef, useEffect } from "react"
import { SavedApp } from "@/types"
import { Edit, Share2, X, ChevronLeft, ChevronRight, ArrowLeft, Play, Pause, Maximize2, Trash2, Download } from "lucide-react"

interface AppDrawerProps {
  showAppDrawer: boolean
  setShowAppDrawer: (val: boolean) => void
  savedApps: SavedApp[]
  openSavedApp?: (app: SavedApp) => void
  removeApp?: (appId: string) => void
  deleteApp?: (appId: string) => void
  downloadApp?: (app: SavedApp) => void
  editApp?: (app: SavedApp) => void
  shareApp?: (app: SavedApp) => void
  runApp?: (app: SavedApp) => void
  handleLongPressStart?: (app: SavedApp, e: any) => void
  handleLongPressEnd?: () => void
  handleSwitchToSavedApp?: (app: SavedApp) => void
  setContextMenu?: (val: any) => void
  setLongPressedApp?: (val: any) => void
  setLongPressTimer?: (val: any) => void
  contextMenu?: { appId: string; x: number; y: number } | null
  longPressedApp?: SavedApp | null
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  renameApp?: (app: SavedApp) => void
  onMediaClick?: (app: SavedApp) => void
}

type Category = "All" | "Apps" | "Media" | "Gallery"

const MEDIA_KEYWORDS = ["music", "video", "photo", "camera", "media", "player", "streaming", "radio", "podcast", "gallery", "editor", "image", "audio"]

function isMediaFile(code: string): boolean {
  return code.startsWith('data:image/') || code.startsWith('data:video/') || code.startsWith('data:audio/')
}

function getCategory(name: string): Category {
  const lowerName = name.toLowerCase()
  if (MEDIA_KEYWORDS.some(k => lowerName.includes(k))) return "Media"
  return "Apps"
}

function AppPreviewIcon({ code, name, isMedia }: { code: string, name: string, isMedia: boolean }) {
  if (code.startsWith('data:image/')) {
    return <img src={code} alt={name} className="w-full h-full object-cover object-top rounded-xl" />
  }

  if (code.startsWith('data:video/') || code.startsWith('data:audio/')) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-[#1a1a2e] rounded-xl overflow-hidden">
        <Play className="h-10 w-10 text-white/70" />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] px-1 py-0.5 truncate">
          {name}
        </div>
      </div>
    )
  }

  // Lazy-loaded iframe thumbnail — renders actual app front page at small size
  const [url, setUrl] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const blobRef = useRef<Blob | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !isVisible) {
          setIsVisible(true)
        } else if (!e.isIntersecting && isVisible) {
          setIsVisible(false)
        }
      },
      { threshold: 0, rootMargin: "80px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (isVisible && !url) {
      const blob = new Blob([`<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"><style>body{margin:0;padding:0;overflow:hidden;width:120px;height:120px;}</style></head><body>${code}</body></html>`], { type: 'text/html' })
      blobRef.current = blob
      setUrl(URL.createObjectURL(blob))
    }
    return () => {
      if (url) { URL.revokeObjectURL(url); setUrl(null) }
    }
  }, [isVisible])

  // Extract title from HTML (first <title> or <h1> or fallback to name)
  const title = (() => {
    const m = code.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (m?.[1]) return m[1].trim()
    const h = code.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i)
    if (h?.[1]) return h[1].trim()
    return name
  })()

  return (
    <div ref={ref} className="w-full h-full relative overflow-hidden rounded-xl">
      {url && <iframe src={url} className="w-full h-full border-0 rounded-xl" sandbox="allow-same-origin" scrolling="no" style={{ pointerEvents: 'none' }} />}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] px-1 py-0.5 truncate">
        {title}
      </div>
    </div>
  )
}

const THEME_PALETTE: Record<string, { bg1: string; bg2: string; symbol: string }> = {
  calculator: { bg1: '#ff6b35', bg2: '#f7931e', symbol: '🔢' },
  todo: { bg1: '#00b894', bg2: '#00cec9', symbol: '✅' },
  task: { bg1: '#00b894', bg2: '#00cec9', symbol: '✅' },
  game: { bg1: '#6c5ce7', bg2: '#a29bfe', symbol: '🎮' },
  music: { bg1: '#e84393', bg2: '#fd79a8', symbol: '🎵' },
  audio: { bg1: '#e84393', bg2: '#fd79a8', symbol: '🎵' },
  video: { bg1: '#d63031', bg2: '#e17055', symbol: '🎬' },
  photo: { bg1: '#0984e3', bg2: '#74b9ff', symbol: '📷' },
  image: { bg1: '#0984e3', bg2: '#74b9ff', symbol: '📷' },
  camera: { bg1: '#0984e3', bg2: '#74b9ff', symbol: '📷' },
  weather: { bg1: '#fdcb6e', bg2: '#e17055', symbol: '🌤️' },
  note: { bg1: '#55a3f0', bg2: '#74b9ff', symbol: '📝' },
  notes: { bg1: '#55a3f0', bg2: '#74b9ff', symbol: '📝' },
  calendar: { bg1: '#d63031', bg2: '#ff7675', symbol: '📅' },
  timer: { bg1: '#636e72', bg2: '#b2bec3', symbol: '⏰' },
  clock: { bg1: '#636e72', bg2: '#b2bec3', symbol: '⏰' },
  quiz: { bg1: '#fdcb6e', bg2: '#f39c12', symbol: '❓' },
  card: { bg1: '#e84393', bg2: '#e17055', symbol: '🎴' },
  puzzle: { bg1: '#00b894', bg2: '#55efc4', symbol: '🧩' },
  chat: { bg1: '#0984e3', bg2: '#00cec9', symbol: '💬' },
  draw: { bg1: '#e84393', bg2: '#fd79a8', symbol: '🎨' },
  paint: { bg1: '#e84393', bg2: '#fd79a8', symbol: '🎨' },
}

function getAppTheme(name: string) {
  const lower = name.toLowerCase()
  for (const [key, theme] of Object.entries(THEME_PALETTE)) {
    if (lower.includes(key)) return theme
  }
  return { bg1: '#6c5ce7', bg2: '#a29bfe', symbol: '📱' }
}

function AndroidIcon({ name, code }: { name: string; code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 96
    canvas.width = size * 2 // 2x for retina
    canvas.height = size * 2
    const s = 2 // scale factor

    const theme = getAppTheme(name)

    // Rounded rect background
    const r = 20 * s
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(size * s - r, 0)
    ctx.arcTo(size * s, 0, size * s, r, r)
    ctx.lineTo(size * s, size * s - r)
    ctx.arcTo(size * s, size * s, size * s - r, size * s, r)
    ctx.lineTo(r, size * s)
    ctx.arcTo(0, size * s, 0, size * s - r, r)
    ctx.lineTo(0, r)
    ctx.arcTo(0, 0, r, 0, r)
    ctx.closePath()

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, size * s, size * s)
    grad.addColorStop(0, theme.bg1)
    grad.addColorStop(1, theme.bg2)
    ctx.fillStyle = grad
    ctx.fill()

    // Subtle inner shadow
    const innerGrad = ctx.createRadialGradient(size * s / 2, size * s / 2, size * s * 0.2, size * s / 2, size * s / 2, size * s * 0.7)
    innerGrad.addColorStop(0, 'rgba(255,255,255,0)')
    innerGrad.addColorStop(1, 'rgba(0,0,0,0.15)')
    ctx.fillStyle = innerGrad
    ctx.fill()

    // Glossy top reflection
    const glossGrad = ctx.createLinearGradient(0, 0, 0, size * s * 0.5)
    glossGrad.addColorStop(0, 'rgba(255,255,255,0.35)')
    glossGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)')
    glossGrad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = glossGrad
    ctx.fill()

    // White border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1.5 * s
    ctx.stroke()

    // Render app title text
    const words = name.split(' ')
    const isTwoWords = words.length >= 2
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    let fontSize = 42 * s
    if (isTwoWords) fontSize = 28 * s
    if (name.length > 10) fontSize = 24 * s

    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 3 * s
    ctx.shadowOffsetY = 2 * s

    if (isTwoWords) {
      // Two lines for two words
      ctx.fillText(words[0], size * s / 2, size * s / 2 - fontSize * 0.55)
      ctx.fillText(words[1], size * s / 2, size * s / 2 + fontSize * 0.55)
    } else {
      // Single word centered
      ctx.fillText(name, size * s / 2, size * s / 2)
    }
    ctx.shadowBlur = 0
  }, [name])

  return (
    <canvas
      ref={canvasRef}
      width={96}
      height={96}
      className="w-full h-full rounded-xl shadow-lg"
      style={{ imageRendering: 'auto' }}
    />
  )
}

export function AppDrawer({
  showAppDrawer,
  setShowAppDrawer,
  savedApps,
  openSavedApp,
  editApp,
  shareApp,
  runApp,
  deleteApp,
  downloadApp,
  handleLongPressStart,
  handleLongPressEnd,
  handleSwitchToSavedApp,
  setLongPressedApp,
  selectedIndex,
  setSelectedIndex,
  renameApp,
  onMediaClick,
}: AppDrawerProps) {
  const handleBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAppDrawer(false)
    }
  }
  const _editApp = editApp ?? (() => {})
  const _shareApp = shareApp ?? (() => {})
  const _runApp = runApp ?? (() => {})
  const _deleteApp = deleteApp ?? (() => {})
  const _downloadApp = downloadApp ?? (() => {})
  const _handleSwitchToSavedApp = handleSwitchToSavedApp ?? (() => {})
  const _setLongPressedApp = setLongPressedApp ?? (() => {})
  const _renameApp = renameApp ?? (() => {})
  const _onMediaClick = onMediaClick ?? (() => {})
  
  const [activeCategory, setActiveCategory] = useState<Category>("Apps")
  const [hoveredApp, setHoveredApp] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'app' | 'media'>('grid')
  const [previewApp, setPreviewApp] = useState<SavedApp | null>(null)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [contextMenuPos, setContextMenuPos] = useState<{x: number, y: number, app: SavedApp} | null>(null)
  const [renamingApp, setRenamingApp] = useState<SavedApp | null>(null)
  const [renameInput, setRenameInput] = useState("")
  const mediaScrollRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const swipeThreshold = 50

  const filteredApps = activeCategory === "Gallery" ? savedApps : savedApps.filter(app => getCategory(app.name) === activeCategory)

  const mediaApps = filteredApps.filter(app => isMediaFile(app.code))

  const handlePrev = () => {
    if (viewMode === 'media' && mediaApps.length > 0) {
      setMediaIndex(mediaIndex <= 0 ? mediaApps.length - 1 : mediaIndex - 1)
    } else {
      setSelectedIndex(selectedIndex <= 0 ? filteredApps.length - 1 : selectedIndex - 1)
    }
  }

  const handleNext = () => {
    if (viewMode === 'media' && mediaApps.length > 0) {
      setMediaIndex(mediaIndex >= mediaApps.length - 1 ? 0 : mediaIndex + 1)
    } else {
      setSelectedIndex(selectedIndex >= filteredApps.length - 1 ? 0 : selectedIndex + 1)
    }
  }

  const handleAppClick = (app: SavedApp) => {
    if (isMediaFile(app.code)) {
      _onMediaClick(app)
    } else {
      _handleSwitchToSavedApp(app)
    }
  }

  const handleBack = () => {
    setContextMenuPos(null)
    if (viewMode !== 'grid') {
      setViewMode('grid')
      setPreviewApp(null)
      setMediaIndex(0)
    } else {
      setShowAppDrawer(false)
    }
  }

  const handleMediaScroll = (e: React.WheelEvent) => {
    handleNext()
  }

  const handleLongPress = (app: SavedApp, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setContextMenuPos({ x: 'clientX' in e ? e.clientX : 0, y: 'clientY' in e ? e.clientY : 0, app })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.touches[0].clientY
    const deltaX = e.touches[0].clientX - touchStartX.current
    
    if (Math.abs(deltaY) > 50 && Math.abs(deltaX) < 30) {
      if (deltaY > 0) handleNext()
      else handlePrev()
      touchStartY.current = e.touches[0].clientY
    } else if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0 && activeCategory === "Media") {
        setActiveCategory("Apps")
        setSelectedIndex(0)
      } else if (deltaX < 0 && activeCategory === "Apps") {
        setActiveCategory("Media")
        setSelectedIndex(0)
      }
      touchStartX.current = e.touches[0].clientX
    }
  }

  useEffect(() => {
    lastScrollY.current = 0
  }, [viewMode])

  useEffect(() => {
    if (renamingApp) {
      setRenameInput(renamingApp.name)
    }
  }, [renamingApp])

  const handleRename = () => {
    if (renamingApp && renameInput.trim()) {
      _renameApp({ ...renamingApp, name: renameInput.trim() })
      setRenamingApp(null)
    }
  }

  useEffect(() => {
    if (showAppDrawer) {
      setContextMenuPos(null)
    }
  }, [showAppDrawer])

  const categories: Category[] = ["Apps", "Media"]

  if (!showAppDrawer) return null

  // Only use internal media view if onMediaClick is not provided (standalone usage)
  // If onMediaClick is provided, the parent component handles media via preview panel
  if (viewMode === 'media' && mediaApps.length > 0 && !onMediaClick) {
    const currentMedia = mediaApps[mediaIndex]

    return (
      <div
        className="fixed inset-0 z-50 bg-black flex flex-col touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onWheel={handleMediaScroll}
      >
        <div className="flex items-center gap-3 px-3 pt-3 pb-2 bg-black/80">
          <button onClick={handleBack} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-white/70 flex-1">{mediaIndex + 1} / {mediaApps.length}</span>
          <button onClick={() => _downloadApp(currentMedia)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={() => { _deleteApp(currentMedia.id); handleBack(); }} className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden" ref={mediaScrollRef}>
          {currentMedia?.code.startsWith('data:video/') || currentMedia?.code.startsWith('data:audio/') ? (
            <video 
              src={currentMedia.code} 
              controls 
              className="max-w-full max-h-full object-contain"
              autoPlay 
              loop 
            />
          ) : (
            <img 
              src={currentMedia?.code} 
              alt={currentMedia?.name} 
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:w-[50%] h-full bg-[#121215] md:border-l border-l-0 border-[#2e2e32] flex flex-col" onClick={handleBgClick}>
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[#2e2e32] touch-pan-y" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-white">Gallery</h2>
          {savedApps.length > 0 && (
            clearConfirmCategory === 'Gallery' ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleClearCategory('Gallery'); }}
                  className="px-1.5 py-0.5 text-[10px] bg-[#ef4444] hover:bg-[#dc2626] text-white rounded transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCancelClear(); }}
                  className="px-1.5 py-0.5 text-[10px] bg-[#404040] hover:bg-[#4a4a4a] text-[#d1d1d1] rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setClearConfirmCategory('Gallery'); }}
                className="px-2 py-0.5 text-[10px] bg-[#2a2a2e] text-[#8b8b8d] hover:text-[#ef4444] rounded transition-colors"
                title="Clear gallery"
              >
                Clear All
              </button>
            )
          )}
        </div>

        <button onClick={handleBack} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2a2a2e] text-[#8b8b8d] hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        {categories.map((cat) => {
          const count = cat === "Gallery" ? savedApps.length : savedApps.filter(a => getCategory(a.name) === cat).length
          return (
            <div key={cat} className="flex items-center gap-1">
              <button
                onClick={() => { setActiveCategory(cat); setSelectedIndex(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-[#de0f17] text-white"
                    : "bg-[#2a2a2e] text-[#8b8b8d] hover:text-white"
                }`}
              >
                {cat}
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto" onClick={(e) => { e.stopPropagation(); setContextMenuPos(null); }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
        <div className="grid grid-cols-4 gap-3 p-3">
          {filteredApps.map((app) => {
            const isMedia = isMediaFile(app.code)
            return (
              <div key={app.id} className="flex flex-col items-center">
                <div
                  onClick={(e) => { e.stopPropagation(); handleAppClick(app); }}
                  onMouseEnter={() => setHoveredApp(app.id)}
                  onMouseLeave={() => setHoveredApp(null)}
                  onContextMenu={(e) => { e.preventDefault(); handleLongPress(app, e); }}
                  onTouchStart={(e) => {
                    touchStartY.current = e.touches[0].clientY
                  }}
                  onTouchEnd={(e) => {
                    const deltaY = Math.abs(touchStartY.current - e.changedTouches[0].clientY)
                    if (deltaY < 10) handleLongPress(app, e)
                  }}
                  className="w-24 h-24 rounded-xl bg-[#1e1e23] border border-[#2e2e32]/50 hover:border-[#de0f17]/50 hover:scale-105 transition-all cursor-pointer overflow-hidden"
                >
                  {isMedia ? (
                    <AppPreviewIcon code={app.code} name={app.name} isMedia={isMedia} />
                  ) : (
                    <AndroidIcon name={app.name} code={app.code} />
                  )}
                </div>
                <p className="mt-1 text-[9px] text-[#888888] text-center truncate w-24">{app.name}</p>
              </div>
            )
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[#666666]">
            <p className="text-sm">No apps yet</p>
          </div>
        )}

        {contextMenuPos && (
          <div 
            className="fixed bg-[#1e1e23] border border-[#2e2e32] rounded-lg shadow-xl py-1 z-50"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            <button
              onClick={() => { setRenamingApp(contextMenuPos.app); setContextMenuPos(null); }}
              className="w-full px-4 py-2 text-left text-sm text-[#d1d1d1] hover:bg-[#2a2a2e]"
            >
              Rename
            </button>
            <button
              onClick={() => { _editApp(contextMenuPos.app); setContextMenuPos(null); }}
              className="w-full px-4 py-2 text-left text-sm text-[#d1d1d1] hover:bg-[#2a2a2e]"
            >
              Edit
            </button>
            <button
              onClick={() => { _deleteApp(contextMenuPos.app.id); setContextMenuPos(null); }}
              className="w-full px-4 py-2 text-left text-sm text-[#d1d1d1] hover:bg-[#2a2a2e]"
            >
              Delete
            </button>
          </div>
        )}

        {renamingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-[#1e1e23] border border-[#2e2e32] rounded-xl p-4 w-[280px]">
              <h3 className="text-sm font-medium text-white mb-3">Rename App</h3>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="w-full px-3 py-2 bg-[#121215] border border-[#2e2e32] rounded-lg text-sm text-white placeholder:text-[#666666] focus:outline-none focus:border-[#de0f17]"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setRenamingApp(null)}
                  className="flex-1 py-2 bg-[#2a2a2e] hover:bg-[#343541] text-white rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  className="flex-1 py-2 bg-[#de0f17] hover:bg-[#b80d12] text-white rounded-lg text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}