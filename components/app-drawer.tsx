import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SavedApp } from "@/types"

interface AppDrawerProps {
  showAppDrawer: boolean
  setShowAppDrawer: (val: boolean) => void
  savedApps: SavedApp[]
  openSavedApp: (app: SavedApp) => void
  removeApp: (appId: string) => void
  handleLongPressStart: (app: SavedApp, e: any) => void
  handleLongPressEnd: () => void
  contextMenu: { appId: string; x: number; y: number } | null
  setContextMenu: (val: any) => void
  longPressedApp: SavedApp | null
}

export function AppDrawer({
  showAppDrawer,
  setShowAppDrawer,
  savedApps,
  openSavedApp,
  removeApp,
  handleLongPressStart,
  handleLongPressEnd,
  contextMenu,
  setContextMenu,
  longPressedApp
}: AppDrawerProps) {
  const [activeTab, setActiveTab] = useState("apps")

  if (!showAppDrawer) return null

  const filteredApps = savedApps.filter(app => {
    const lowered = app.name.toLowerCase()
    if (activeTab === "apps") return true
    if (activeTab === "music") return lowered.includes('music') || lowered.includes('song') || lowered.includes('audio') || lowered.includes('player')
    if (activeTab === "media") return lowered.includes('photo') || lowered.includes('image') || lowered.includes('video') || lowered.includes('movie') || lowered.includes('film')
    return true
  })

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setShowAppDrawer(false)}
      />
      
      <div className="relative z-10 flex-1 flex flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">My Gallery</h2>
          <button
            className="text-muted-foreground hover:text-foreground text-2xl"
            onClick={() => setShowAppDrawer(false)}
          >
            ✕
          </button>
        </div>

        <Tabs defaultValue="apps" onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="apps">Apps</TabsTrigger>
            <TabsTrigger value="music">Music</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 pb-6">
                {filteredApps.map((app) => (
                  <div key={app.id} className="flex flex-col items-center gap-2">
                    <div
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-md hover:scale-105 transition-transform cursor-pointer bg-card/50 border border-card-foreground/10"
                      onClick={() => openSavedApp(app)}
                      onContextMenu={(e: React.MouseEvent) => {
                        e.preventDefault()
                        handleLongPressStart(app, e)
                      }}
                      onTouchStart={(e) => {
                        const timer = setTimeout(() => {
                          const target = e.target as HTMLElement
                          const rect = target.getBoundingClientRect()
                          setContextMenu({
                            appId: app.id,
                            x: rect.left,
                            y: rect.bottom + 5
                          })
                        }, 500)
                      }}
                      onTouchEnd={handleLongPressEnd}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                    >
                      {app.icon}
                      <div className="absolute -bottom-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center truncate w-full px-1">
                      {app.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No items found in this category.
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {contextMenu && longPressedApp && (
        <div
          className="absolute z-50 bg-card border border-card-foreground/20 rounded-xl shadow-xl overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-3 text-left hover:bg-destructive/20 flex items-center gap-3 text-destructive"
            onClick={() => removeApp(contextMenu.appId)}
          >
            <span className="text-xl">🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}
