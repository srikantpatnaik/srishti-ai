import React, { useState, useMemo } from "react"
import { SavedApp } from "@/types"
import { Edit, Share2, ExternalLink, Trash2, Search, X, Download, FolderHeart } from "lucide-react"
import JSZip from "jszip"

interface AppDrawerProps {
  showAppDrawer: boolean
  setShowAppDrawer: (val: boolean) => void
  savedApps: SavedApp[]
  openSavedApp: (app: SavedApp) => void
  removeApp: (appId: string) => void
  editApp: (app: SavedApp) => void
  shareApp: (app: SavedApp) => void
  handleLongPressStart: (app: SavedApp, e: any) => void
  handleLongPressEnd: () => void
  handleSwitchToSavedApp: (app: SavedApp) => void
  setContextMenu: (val: any) => void
  setLongPressedApp: (val: any) => void
  setLongPressTimer: (val: any) => void
  contextMenu: { appId: string; x: number; y: number } | null
  longPressedApp: SavedApp | null
  onDownloadApp?: (app: SavedApp) => void
  onSaveApp?: (app: SavedApp) => void
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

export function AppDrawer({
  showAppDrawer,
  setShowAppDrawer,
  savedApps,
  openSavedApp,
  removeApp,
  editApp,
  shareApp,
  handleLongPressStart,
  handleLongPressEnd,
  handleSwitchToSavedApp,
  setContextMenu,
  setLongPressedApp,
  setLongPressTimer,
  contextMenu,
  longPressedApp,
  onDownloadApp,
  onSaveApp
}: AppDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [menuOpenedByTouch, setMenuOpenedByTouch] = useState(false)

  const downloadApp = async (app: SavedApp) => {
    try {
      const zip = new JSZip()
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${app.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eaeaea; min-height: 100vh; padding: 16px; }
    .app-container { max-width: 100%; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="app-container">
    ${app.code}
  </div>
</body>
</html>`
      zip.file("index.html", htmlContent)
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${app.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  const handleContextMenu = (app: SavedApp, e: React.MouseEvent) => {
    e.preventDefault()
    setMenuOpenedByTouch(false)
    setContextMenu({
      appId: app.id,
      x: e.clientX,
      y: e.clientY
    })
    setLongPressedApp(app)
  }

  const filteredApps = useMemo(() => {
    return savedApps.filter(app => {
      const matchesSearch = searchQuery === "" || app.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === "All" || getCategory(app.name) === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [savedApps, searchQuery, activeCategory])

  if (!showAppDrawer) return null

  const categories: Category[] = ["All", "Apps", "Games", "Media"]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowAppDrawer(false)}
      />
      
      {/* Desktop: GNOME-style dash - centered panel with same width as chat */}
      {/* Mobile: Native app drawer - slides from bottom, full width */}
      <div className="relative z-10 flex flex-col bg-[#1e1e23] md:bg-[#121215] border border-[#2e2e32] md:border-[#2e2e32]
        md:rounded-2xl md:shadow-2xl md:border
        w-full md:w-[70%] md:max-w-[70%]
        max-h-[85vh] md:max-h-[80vh]
        rounded-t-2xl md:mt-0
        overflow-hidden">
        
        {/* Drag handle for mobile */}
        <div className="md:hidden w-12 h-1 bg-[#4a4a4a] rounded-full mx-auto mt-2 mb-1" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e32]">
          <div className="flex items-center gap-3">
            <FolderHeart className="h-5 w-5 text-[#e94560]" />
            <h2 className="text-base font-medium text-white">Gallery</h2>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            onClick={() => setShowAppDrawer(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2e2e32]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[#e94560] text-white"
                  : "bg-[#2e2e32] text-[#888888] hover:text-white hover:bg-[#3e3e42]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* App grid */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {filteredApps.length > 0 ? (
            /* Desktop: 4-5 columns, Mobile: 4 columns */
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3 p-4">
              {filteredApps.map((app) => (
                <div key={app.id} className="flex flex-col items-center gap-1.5 py-2">
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-3xl md:text-4xl 
                      bg-gradient-to-br from-[#e94560]/15 to-[#e94560]/5 
                      hover:from-[#e94560]/25 hover:to-[#e94560]/10
                      shadow-md hover:shadow-lg
                      transition-all cursor-pointer border border-[#e94560]/20 hover:border-[#e94560]/30
                      active:scale-95"
                    onClick={() => handleSwitchToSavedApp(app)}
                    onContextMenu={(e) => handleContextMenu(app, e)}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      const timer = setTimeout(() => {
                        setMenuOpenedByTouch(true)
                        const target = e.target as HTMLElement
                        const rect = target.getBoundingClientRect()
                        setContextMenu({
                          appId: app.id,
                          x: rect.left + rect.width / 2 - 80,
                          y: rect.bottom + 8
                        })
                      }, 500)
                      setLongPressTimer(timer)
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault()
                      if (!menuOpenedByTouch) {
                        handleLongPressEnd()
                      }
                    }}
                  >
                    {app.icon}
                  </div>
                  <p className="text-[10px] md:text-xs text-white/80 text-center truncate w-full px-0.5 leading-tight">
                    {app.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-white/40">
              <FolderHeart className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No apps yet</p>
              <p className="text-xs mt-1">Save apps to see them here</p>
            </div>
          )}
        </div>
      </div>

      {contextMenu && longPressedApp && (
        <div
          className="absolute z-50 bg-[#1f1f23] rounded-xl shadow-2xl overflow-hidden border border-[#2e2e32] min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => {
            if (!menuOpenedByTouch) {
              setContextMenu(null)
              setLongPressedApp(null)
            }
          }}
        >
          <button
            className="w-full px-4 py-2.5 text-left hover:bg-[#2e2e32] flex items-center gap-3 text-[#e5e5e5] text-sm"
            onClick={() => {
              openSavedApp(longPressedApp)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open</span>
          </button>
          {onSaveApp && (
            <button
              className="w-full px-4 py-2.5 text-left hover:bg-[#2e2e32] flex items-center gap-3 text-[#e5e5e5] text-sm"
              onClick={() => {
                onSaveApp(longPressedApp)
                setContextMenu(null)
                setLongPressedApp(null)
              }}
            >
              <FolderHeart className="h-4 w-4" />
              <span>Save</span>
            </button>
          )}
          <button
            className="w-full px-4 py-2.5 text-left hover:bg-[#2e2e32] flex items-center gap-3 text-[#e5e5e5] text-sm"
            onClick={() => {
              if (longPressedApp) downloadApp(longPressedApp)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          <div className="h-px bg-[#2e2e32] mx-2" />
          <button
            className="w-full px-4 py-2.5 text-left hover:bg-red-500/20 flex items-center gap-3 text-red-400 text-sm"
            onClick={() => {
              removeApp(contextMenu.appId)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  )
}
