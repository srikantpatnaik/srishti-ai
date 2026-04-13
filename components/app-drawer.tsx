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
}

type Category = "All" | "Apps" | "Games" | "Media"

const GAME_KEYWORDS = ["game", "puzzle", "sudoku", "chess", "solitaire", "arcade", "racing", "shooter", "adventure", "strategy", "board", "tic tac toe", "snake"]
const MEDIA_KEYWORDS = ["music", "video", "photo", "camera", "media", "player", "streaming", "radio", "podcast", "gallery", "editor", "image", "audio"]

function getCategory(name: string): Category {
  const lowerName = name.toLowerCase()
  if (GAME_KEYWORDS.some(k => lowerName.includes(k))) return "Games"
  if (MEDIA_KEYWORDS.some(k => lowerName.includes(k))) return "Media"
  return "Apps"
}

function isMediaFile(code: string): boolean {
  return code.startsWith('data:image/') || code.startsWith('data:video/') || code.startsWith('data:audio/')
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
}: AppDrawerProps) {
  const _editApp = editApp ?? (() => {})
  const _shareApp = shareApp ?? (() => {})
  const _runApp = runApp ?? (() => {})
  const _deleteApp = deleteApp ?? (() => {})
  const _downloadApp = downloadApp ?? (() => {})
  const _handleSwitchToSavedApp = handleSwitchToSavedApp ?? (() => {})
  const _setLongPressedApp = setLongPressedApp ?? (() => {})
  
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [hoveredApp, setHoveredApp] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'app' | 'media'>('grid')
  const [previewApp, setPreviewApp] = useState<SavedApp | null>(null)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [contextMenuPos, setContextMenuPos] = useState<{x: number, y: number, app: SavedApp} | null>(null)
  const mediaScrollRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const touchStartY = useRef(0)

  const filteredApps = savedApps.filter(app => {
    if (activeCategory === "All") return true
    return getCategory(app.name) === activeCategory
  })

  const mediaApps = filteredApps.filter(app => isMediaFile(app.code))
  const appGames = filteredApps.filter(app => !isMediaFile(app.code))

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
      const idx = mediaApps.findIndex(a => a.id === app.id)
      setMediaIndex(idx >= 0 ? idx : 0)
      setViewMode('media')
    } else {
      _handleSwitchToSavedApp(app)
    }
  }

  const handleBack = () => {
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
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.touches[0].clientY
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) handleNext()
      else handlePrev()
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleTwoFingerSwipe = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const deltaY = lastScrollY.current - e.touches[0].clientY
      if (Math.abs(deltaY) > 30) {
        if (deltaY > 0) handleNext()
        else handlePrev()
        lastScrollY.current = e.touches[0].clientY
      }
    }
  }

  useEffect(() => {
    lastScrollY.current = 0
  }, [viewMode])

  const categories: Category[] = ["All", "Apps", "Games", "Media"]
  const currentItem = viewMode === 'media' ? mediaApps[mediaIndex] : (viewMode === 'app' ? previewApp : filteredApps[selectedIndex])

  if (!showAppDrawer) return null

  if (viewMode === 'app' && previewApp) {
    return (
      <div className="w-[50%] h-full bg-[#121215] flex flex-col">
        <div className="flex items-center gap-3 px-3 pt-3 pb-2 border-b border-[#2e2e32]">
          <button onClick={handleBack} className="p-1.5 rounded-lg bg-[#2a2a2e] text-[#8b8b8d] hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-medium text-white flex-1 truncate">{previewApp.name}</h2>
          <button onClick={() => { _editApp(previewApp); handleBack(); }} className="p-1.5 rounded-lg bg-[#2a2a2e] text-[#8b8b8d] hover:text-white">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => { _deleteApp(previewApp.id); handleBack(); }} className="p-1.5 rounded-lg bg-[#2a2a2e] text-red-400 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div 
            onClick={() => { _runApp(previewApp); setShowAppDrawer(false); }}
            className="w-[180px] h-[360px] rounded-[30px] bg-gradient-to-br from-[#3a3a42] to-[#2a2a2e] border-[6px] border-[#1a1a1a] overflow-hidden flex flex-col cursor-pointer hover:scale-105 transition-transform shadow-2xl"
          >
            <div className="h-full w-full flex flex-col">
              <div className="flex-1 flex items-center justify-center text-7xl">
                {previewApp.icon || "📱"}
              </div>
              <div className="pb-4 text-center">
                <span className="text-white text-xs font-medium">{previewApp.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 p-3 border-t border-[#2e2e32]">
          <p className="text-sm text-white mb-3">{previewApp.description || 'Tap icon to open'}</p>
          <div className="flex gap-2">
            <button
              onClick={() => { _runApp(previewApp); setShowAppDrawer(false); }}
              className="flex-1 py-2 bg-[#de0f17] hover:bg-[#b80d12] text-white rounded-lg text-sm font-medium"
            >
              Run App
            </button>
            <button
              onClick={() => { _handleSwitchToSavedApp(previewApp); setShowAppDrawer(false); }}
              className="flex-1 py-2 bg-[#2a2a2e] hover:bg-[#343541] text-white rounded-lg text-sm font-medium"
            >
              Load
            </button>
          </div>
        </div>
      </div>
    )
  }

 if (viewMode === 'media' && mediaApps.length > 0) {
    const currentMedia = mediaApps[mediaIndex]

    return (
      <div 
        className="w-[50%] h-full bg-black flex flex-col touch-pan-y"
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
          <button onClick={() => { _deleteApp(currentMedia.id); handleBack(); }} className="p-1.5 rounded-lg bg-white/10 text-red-400 hover:bg-white/20">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={handleBack} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
            <X className="h-4 w-4" />
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

        <div className="flex-shrink-0 p-3 bg-black/80 border-t border-white/10">
          <p className="text-sm text-white truncate">{currentMedia?.name}</p>
          <p className="text-xs text-white/50 mt-1">Swipe up/down or use arrows to navigate</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[50%] h-full bg-[#121215] border-l border-[#2e2e32] flex flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[#2e2e32]">
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

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3 p-3">
          {filteredApps.map((app) => (
            <div key={app.id}>
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
                  className="aspect-square rounded-xl bg-[#1e1e23] border border-[#2e2e32] hover:border-[#de0f17]/50 hover:scale-105 transition-all cursor-pointer overflow-hidden"
                >
                <div className="w-full h-full flex items-center justify-center">
                  {app.code.startsWith('data:image/') ? (
                    <img src={app.code} alt={app.name} className="w-full h-full object-cover" />
                  ) : app.code.startsWith('data:video/') || app.code.startsWith('data:audio/') ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-[#1a1a2e]">
                      <Play className="h-8 w-8 text-white/70" />
                    </div>
                  ) : (
                    <span className="text-3xl">{app.icon || "📱"}</span>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-[#888888] text-center truncate">{app.name}</p>
            </div>
          ))}
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
              onClick={() => { _editApp(contextMenuPos.app); setContextMenuPos(null); }}
              className="w-full px-4 py-2 text-left text-sm text-[#d1d1d1] hover:bg-[#2a2a2e]"
            >
              Edit
            </button>
            <button
              onClick={() => { _deleteApp(contextMenuPos.app.id); setContextMenuPos(null); }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#2a2a2e]"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}