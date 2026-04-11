import React, { useState, useMemo } from "react"
import { Clock, ChevronDown, ChevronRight, PanelLeftClose, Trash2, Check, X } from "lucide-react"

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
  onDeleteChat: (chatId: string) => void
}

function formatChatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const chatDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (chatDate.getTime() === today.getTime()) return "Today"
  if (chatDate.getTime() === yesterday.getTime()) return "Yesterday"
  if (chatDate.getTime() > weekAgo.getTime()) return "This Week"
  return "Older"
}

export function SettingsPanel({
  showSettings,
  setShowSettings,
  recentChats,
  onLoadChat,
  onDeleteChat,
}: SettingsPanelProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const groupedChats = useMemo(() => {
    const groups: { [key: string]: RecentChat[] } = {}
    recentChats.forEach(chat => {
      const dateKey = formatChatDate(chat.timestamp)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(chat)
    })
    return groups
  }, [recentChats])

  const groupOrder = ["Today", "Yesterday", "This Week", "Older"]

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmId(chatId)
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteChat(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  if (!showSettings) return null

  return (
    <div className="w-[70%] sm:w-[20%] h-full bg-[#0d0d10] flex flex-col transition-all duration-300 overflow-y-auto [&::-webkit-scrollbar]:hidden border-r border-[#1f1f23]">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-[#e5e5e5] text-base font-medium">Settings</h2>
        <button 
          onClick={() => setShowSettings(false)}
          className="p-2 rounded-lg transition-all text-[#888888] hover:text-[#e5e5e5] hover:bg-[#1f1f23]"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {recentChats.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#888888]" />
            <h3 className="text-[#888888] text-sm font-semibold">Recent Chats</h3>
          </div>
          <div className="space-y-4">
            {groupOrder.map(group => {
              const chats = groupedChats[group]
              if (!chats || chats.length === 0) return null
              return (
                <div key={group}>
                  <p className="text-[#666666] text-xs font-medium mb-1 px-1">{group}</p>
                  <div className="space-y-0.5">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          deleteConfirmId === chat.id 
                            ? 'bg-[#3e3e42] border border-[#e94560]' 
                            : 'hover:bg-[#2e2e32]'
                        }`}
                      >
                        {deleteConfirmId === chat.id ? (
                          <>
                            <span className="flex-1 text-sm text-[#e5e5e5] truncate pr-2">
                              Delete?
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={handleConfirmDelete}
                                className="p-1.5 rounded-lg bg-[#e94560] hover:bg-[#d13a54] text-white transition-colors"
                                title="Confirm delete"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={handleCancelDelete}
                                className="p-1.5 rounded-lg bg-[#2e2e32] hover:bg-[#3e3e42] text-[#888888] hover:text-[#e5e5e5] transition-colors"
                                title="Cancel"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onLoadChat(chat.id)}
                              className="flex-1 text-left text-[#e5e5e5] truncate pr-2"
                            >
                              {chat.title}
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(chat.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#3e3e42] text-[#888888] hover:text-[#e94560] transition-all"
                              title="Delete chat"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
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