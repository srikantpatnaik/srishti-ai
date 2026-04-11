import React, { useState, useMemo } from "react"
import { SavedApp } from "@/types"
import { Edit, Share2, ExternalLink, Trash2, Search, X, Download } from "lucide-react"
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
}

type Category = "All" | "Apps" | "Games" | "Media"

const GAME_KEYWORDS = ["game", "puzzle", "sudoku", "chess", "solitaire", "arcade", "racing", "shooter", "adventure", "strategy", "board"]
const MEDIA_KEYWORDS = ["music", "video", "photo", "camera", "media", "player", "streaming", "radio", "podcast", "gallery", "editor"]

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
  onDownloadApp
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
    <div className="fixed inset-0 z-50 flex flex-col">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={() => setShowAppDrawer(false)}
      />
      
      <div className="relative z-10 flex-1 flex flex-col px-4 pt-4 pb-6 sm:px-6 sm:pt-6 max-w-md mx-auto w-full mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">App Library</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            onClick={() => setShowAppDrawer(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 py-2">
              {filteredApps.map((app) => (
                <div key={app.id} className="flex flex-col items-center gap-2 py-3">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-br from-white/20 to-white/5 shadow-lg hover:scale-105 hover:shadow-xl hover:from-white/30 hover:to-white/10 transition-all cursor-pointer border border-white/10"
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
                    onMouseUp={() => {
                      if (!menuOpenedByTouch && !contextMenu) {
                        handleLongPressEnd()
                      }
                    }}
                    onMouseLeave={() => {
                      if (!menuOpenedByTouch && !contextMenu) {
                        handleLongPressEnd()
                      }
                    }}
                  >
                    {app.icon}
                  </div>
                  <p className="text-xs text-white/90 text-center truncate w-20 px-1 leading-tight font-medium">
                    {app.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/50">
              No apps found
            </div>
          )}
        </div>
      </div>

      {contextMenu && longPressedApp && (
        <div
          className="absolute z-50 bg-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden border border-white/10 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => {
            if (!menuOpenedByTouch) {
              setContextMenu(null)
              setLongPressedApp(null)
            }
          }}
        >
          <button
            className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 text-white"
            onClick={() => {
              openSavedApp(longPressedApp)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open</span>
          </button>
          <button
            className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 text-white"
            onClick={() => {
              editApp(longPressedApp)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 text-white"
            onClick={() => {
              if (longPressedApp) downloadApp(longPressedApp)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          <div className="h-px bg-white/10 mx-2" />
          <button
            className="w-full px-4 py-3 text-left hover:bg-red-500/20 flex items-center gap-3 text-red-400"
            onClick={() => {
              removeApp(contextMenu.appId)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span>Uninstall</span>
          </button>
        </div>
      )}
    </div>
  )
}