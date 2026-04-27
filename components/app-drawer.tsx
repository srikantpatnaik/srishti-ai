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

type Category = "All" | "Apps" | "Media"

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
    return <img src={code} alt={name} className="w-full h-full object-cover object-top" />
  }

  if (code.startsWith('data:video/') || code.startsWith('data:audio/')) {
    return <div className="relative w-full h-full flex items-center justify-center bg-[#1a1a2e]"><Play className="h-10 w-10 text-white/70"/></div>
  }

  // Gallery thumbnails: show emoji icon only, no blob URL (saves memory)
  return <span className="text-lg">{getAppIcon(name)}</span>
}

function getAppIcon(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('calculator')) return '🔢'
  if (lower.includes('todo') || lower.includes('task')) return '✅'
  if (lower.includes('game')) return '🎮'
  if (lower.includes('music') || lower.includes('audio')) return '🎵'
  if (lower.includes('video')) return '🎬'
  if (lower.includes('photo') || lower.includes('image') || lower.includes('camera')) return '📷'
  if (lower.includes('weather')) return '🌤️'
  if (lower.includes('note') || lower.includes('notes')) return '📝'
  if (lower.includes('calendar')) return '📅'
  if (lower.includes('timer') || lower.includes('clock')) return '⏰'
  if (lower.includes('quiz')) return '❓'
  if (lower.includes('card')) return '🎴'
  if (lower.includes('puzzle')) return '🧩'
  if (lower.includes('chat')) return '💬'
  if (lower.includes('draw') || lower.includes('paint')) return '🎨'
  return '📱'
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

  const filteredApps = savedApps.filter(app => getCategory(app.name) === activeCategory)

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
        </div>

        <button onClick={handleBack} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2a2a2e] text-[#8b8b8d] hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-[#de0f17] text-white"
                : "bg-[#2a2a2e] text-[#8b8b8d] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" onClick={(e) => { e.stopPropagation(); setContextMenuPos(null); }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
        <div className="grid grid-cols-4 gap-4 p-3">
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
                  className={isMedia ? "w-32 h-32 rounded-xl bg-[#1e1e23] border border-[#2e2e32]/50 hover:border-[#de0f17]/50 hover:scale-105 transition-all cursor-pointer overflow-hidden" : "w-24 h-24 rounded-xl bg-[#1e1e23] border border-[#2e2e32]/50 hover:border-[#de0f17]/50 hover:scale-105 transition-all cursor-pointer overflow-hidden flex items-center justify-center"}
                >
                  <AppPreviewIcon code={app.code} name={app.name} isMedia={isMedia} />
                </div>
                <p className={`mt-1.5 text-xs text-[#888888] text-center truncate ${isMedia ? 'w-32' : 'w-24'}`}>{app.name}</p>
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