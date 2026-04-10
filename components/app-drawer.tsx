import React, { useState } from "react"
import { SavedApp } from "@/types"
import { Edit, Share2, ExternalLink, Trash2 } from "lucide-react"

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
  if (!showAppDrawer) return null

  const filteredApps = savedApps

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setShowAppDrawer(false)}
      />
      
      <div className="relative z-10 flex-1 flex flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">My Gallery</h2>
          <button
            className="text-muted-foreground hover:text-foreground text-2xl"
            onClick={() => setShowAppDrawer(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredApps.map((app) => (
                <div key={app.id} className="flex flex-col items-center gap-2">
                  <div
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-md hover:scale-105 transition-transform cursor-pointer bg-card/50 border border-card-foreground/10"
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
                          x: rect.left,
                          y: rect.bottom + 5
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
                  <p className="text-xs sm:text-sm text-muted-foreground text-center truncate w-full px-1">
                    {app.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No items found.
            </div>
          )}
        </div>
      </div>

      {contextMenu && longPressedApp && (
        <div
          className="absolute z-50 bg-card border border-card-foreground/20 rounded-xl shadow-xl overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3"
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
            className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3"
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
            className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3"
            onClick={() => {
              shareApp(longPressedApp)
              setContextMenu(null)
              setLongPressedApp(null)
            }}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <div className="h-px bg-border mx-2" />
          <button
            className="w-full px-4 py-3 text-left hover:bg-destructive/20 flex items-center gap-3 text-destructive"
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
