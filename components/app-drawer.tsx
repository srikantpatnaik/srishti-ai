import React, { useState } from "react"
import { SavedApp } from "@/types"
import { Edit, Share2, ExternalLink, Trash2, X, Download, FolderHeart, Grid3X3, Sparkles, Zap, Palette, Command } from "lucide-react"
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

const categoryIcons: Record<Category, React.ReactNode> = {
  All: <Sparkles className="h-4 w-4" />,
  Apps: <Command className="h-4 w-4" />,
  Games: <Zap className="h-4 w-4" />,
  Media: <Palette className="h-4 w-4" />,
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
}: AppDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [hoveredApp, setHoveredApp] = useState<string | null>(null)

  if (!showAppDrawer) return null

  const categories: Category[] = ["All", "Apps", "Games", "Media"]
  
  const filteredApps = savedApps.filter(app => {
    if (activeCategory === "All") return true
    return getCategory(app.name) === activeCategory
  })

  const handleContextMenu = (app: SavedApp, e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({
      appId: app.id,
      x: e.clientX,
      y: e.clientY,
    })
    setLongPressedApp(app)
  }

  const handleAppClick = (app: SavedApp) => {
    handleSwitchToSavedApp(app)
    setShowAppDrawer(false)
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-[#0a0a0c]/95 backdrop-blur-2xl" />
      
      {/* Radial gradient orbs for atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#e94560]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#3b82f6]/6 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-[#8b5cf6]/5 rounded-full blur-[80px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#e94560]/60 flex items-center justify-center shadow-lg shadow-[#e94560]/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Gallery
              </h2>
              <p className="text-sm text-white/40">{savedApps.length} apps saved</p>
            </div>
          </div>
          <button
            onClick={() => setShowAppDrawer(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10 hover:border-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-3 px-8 py-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-[#e94560] to-[#e94560]/80 text-white shadow-lg shadow-[#e94560]/25"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/5 hover:border-white/15"
              }`}
            >
              {categoryIcons[cat]}
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 overscroll-contain">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 p-2">
            {filteredApps.map((app) => (
              <div key={app.id}>
                <div
                  onClick={() => handleAppClick(app)}
                  onMouseEnter={() => setHoveredApp(app.id)}
                  onMouseLeave={() => setHoveredApp(null)}
                  onContextMenu={(e) => handleContextMenu(app, e)}
                  className="group relative aspect-square rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] hover:border-[#e94560]/50 hover:shadow-[0_0_30px_-5px_rgba(233,69,96,0.3)] transition-all duration-500 cursor-pointer overflow-hidden"
                >
                  {/* Animated gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* App icon */}
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    {app.icon || "📱"}
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "radial-gradient(circle at center, rgba(233,69,96,0.15) 0%, transparent 70%)" }}
                  />
                </div>
                
                {/* App name */}
                <p className="mt-2 text-xs text-center text-white/50 truncate group-hover:text-white/80 transition-colors">
                  {app.name}
                </p>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredApps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                <Grid3X3 className="h-10 w-10 text-white/20" />
              </div>
              <p className="text-lg text-white/40 font-medium">No apps yet</p>
              <p className="text-sm text-white/20 mt-1">Create your first app to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}