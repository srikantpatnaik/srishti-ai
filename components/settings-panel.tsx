import React, { useState } from "react"
import { Clock, ChevronDown, ChevronRight } from "lucide-react"

interface RecentChat {
  id: string
  title: string
  timestamp: number
}

interface SettingsPanelProps {
  showSettings: boolean
  setShowSettings: (val: boolean) => void
  recentChats: RecentChat[]
  onLoadChat: (chatId: string) => void
}

export function SettingsPanel({
  showSettings,
  setShowSettings,
  recentChats,
  onLoadChat,
}: SettingsPanelProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  if (!showSettings) return null

  return (
    <div className="h-full bg-[#121215] flex flex-col transition-all duration-300 overflow-y-auto"
         style={{ scrollbarColor: '#404040 #000000', scrollbarWidth: 'thin' }}>
      <div className="p-4">
        <h2 className="text-[#e5e5e5] text-base font-medium">Settings</h2>
      </div>

      {recentChats.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#888888]" />
            <h3 className="text-[#888888] text-sm font-semibold">Recent Chats</h3>
          </div>
          <div className="space-y-1">
            {recentChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onLoadChat(chat.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#e5e5e5] hover:bg-[#2e2e32] transition-colors truncate"
              >
                {chat.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 mt-auto sm:block hidden">
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="flex items-center gap-2 text-[#888888] text-sm font-semibold hover:text-[#e5e5e5] transition-colors"
        >
          {showShortcuts ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Keyboard Shortcuts
        </button>
        {showShortcuts && (
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#888888]">Toggle Settings</span>
              <kbd className="px-2 py-1 bg-[#2e2e32] rounded text-xs font-mono text-[#888888]">Ctrl+B</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#888888]">Toggle Preview</span>
              <kbd className="px-2 py-1 bg-[#2e2e32] rounded text-xs font-mono text-[#888888]">Ctrl+X</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#888888]">Toggle App Drawer</span>
              <kbd className="px-2 py-1 bg-[#2e2e32] rounded text-xs font-mono text-[#888888]">Ctrl+M</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#888888]">Close App Drawer</span>
              <kbd className="px-2 py-1 bg-[#2e2e32] rounded text-xs font-mono text-[#888888]">Esc</kbd>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}