import React, { useState, useMemo } from "react"
import { SavedApp } from "@/types"
import { Edit, Share2, ExternalLink, Trash2, Search, X } from "lucide-react"

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
  longPressedApp
}: AppDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [searchQuery, setSearchQuery] = useState("")

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
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => setShowAppDrawer(false)}
      />
      
      <div className="relative z-10 flex-1 flex flex-col px-4 pt-4 pb-6 sm:px-6 sm:pt-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-white">App library</h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            onClick={() => setShowAppDrawer(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Search apps"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full bg-white/10 text-white placeholder:text-white/50 text-sm outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        <div className="flex gap-1 mb-4 -mx-2 px-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5">
              {filteredApps.map((app) => (
                <div key={app.id} className="flex flex-col items-center gap-1 py-2">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleSwitchToSavedApp(app)}
                    onContextMenu={(e: React.MouseEvent) => {
                      e.preventDefault()
                      handleLongPressStart(app, e)
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      const timer = setTimeout(() => {
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
                      handleLongPressEnd()
                    }}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                  >
                    {app.icon}
                  </div>
                  <p className="text-[11px] text-white text-center truncate w-16 px-1 leading-tight">
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
          className="absolute z-50 bg-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden border border-white/10"
          style={{ left: contextMenu.x, top: contextMenu.y }}
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
              shareApp(longPressedApp)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
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