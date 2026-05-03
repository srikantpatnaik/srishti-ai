import React, { useState, useMemo } from "react"
import { MessageSquare, Trash2, ChevronLeft, Keyboard, ChevronDown } from "lucide-react"

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
  onClearAll: () => void
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
  if (chatDate.getTime() > weekAgo.getTime()) return "Previous 7 Days"
  return "Older"
}

export function SettingsPanel({
  showSettings,
  setShowSettings,
  recentChats,
  onLoadChat,
  onDeleteChat,
  onClearAll,
}: SettingsPanelProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [clearAllConfirm, setClearAllConfirm] = useState(false)
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const groupedChats = useMemo(() => {
    const groups: { [key: string]: RecentChat[] } = {}
    recentChats.forEach(chat => {
      const dateKey = formatChatDate(chat.timestamp)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(chat)
    })
    return groups
  }, [recentChats])

  const groupOrder = ["Today", "Yesterday", "Previous 7 Days", "Older"]

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDeleteConfirmId(chatId)
  }

  const handleConfirmDelete = (chatId: string) => {
    onDeleteChat(chatId)
    setDeleteConfirmId(null)
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const handleClearAll = () => {
    onClearAll()
    setClearAllConfirm(false)
  }

  const handleCancelClearAll = () => {
    setClearAllConfirm(false)
  }

  const handleChatClick = (chatId: string) => {
    if (deleteConfirmId) return
    onLoadChat(chatId)
    setShowSettings(false)
  }

  if (!showSettings) return null

  const handleBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowSettings(false)
    }
  }

  return (
    <div className="fixed top-0 left-0 z-50 w-[70%] sm:w-[280px] h-full bg-[#202123] flex flex-col border-r border-[#343541]" onClick={handleBgClick}>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#2a2a2e] transition-colors cursor-pointer" onClick={() => setShowSettings(false)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#de0f17]">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="text-[15px] font-medium text-[#ececf1]">Srishti AI</span>
        </div>
        <button 
          onClick={() => setShowSettings(false)}
          className="p-2 rounded-lg hover:bg-[#2a2a2e] text-[#8b8b8d] hover:text-[#ececf1] transition-colors"
          title="Close sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="space-y-1">
          {groupOrder.map(group => {
            const chats = groupedChats[group]
            if (!chats || chats.length === 0) return null
            return (
              <div key={group} className="mb-4">
                <p className="text-[11px] text-[#8b8b8d] font-medium px-3 py-1 uppercase tracking-wide">{group}</p>
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onMouseEnter={() => setHoveredChatId(chat.id)}
                    onMouseLeave={() => setHoveredChatId(null)}
                    className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      deleteConfirmId === chat.id 
                        ? 'bg-[#343541]' 
                        : hoveredChatId === chat.id 
                          ? 'bg-[#2a2a2e]' 
                          : 'hover:bg-[#2a2a2e]'
                    }`}
                  >
                    {deleteConfirmId === chat.id ? (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-[14px] text-[#ececf1]">Delete chat?</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleConfirmDelete(chat.id); }}
                            className="px-2 py-1 text-xs bg-[#ef4444] hover:bg-[#dc2626] text-white rounded transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCancelDelete(); }}
                            className="px-2 py-1 text-xs bg-[#404040] hover:bg-[#4a4a4a] text-[#d1d1d1] rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 text-[#8b8b8d] flex-shrink-0" />
                        <button
                          onClick={() => handleChatClick(chat.id)}
                          className="flex-1 text-left text-[14px] text-[#d1d1d1] truncate"
                        >
                          {chat.title}
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(chat.id, e)}
                          className={`p-1.5 rounded hover:bg-[#404040] text-[#8b8b8d] hover:text-[#ef4444] transition-all ${
                            hoveredChatId === chat.id ? 'opacity-100' : 'opacity-0'
                          }`}
                          title="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {recentChats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#8b8b8d]">
            <MessageSquare className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        )}

        {recentChats.length > 0 && (
          <div className="mt-4">
            {clearAllConfirm ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-[14px] text-[#ececf1]">Delete all chats?</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleClearAll(); }}
                    className="px-2 py-1 text-xs bg-[#ef4444] hover:bg-[#dc2626] text-white rounded transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCancelClearAll(); }}
                    className="px-2 py-1 text-xs bg-[#404040] hover:bg-[#4a4a4a] text-[#d1d1d1] rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setClearAllConfirm(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2a2a2e] text-[#8b8b8d] text-left text-[14px] hover:text-[#ef4444] transition-colors"
              >
                <Trash2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Clear all</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:block p-3 border-t border-[#343541]">
        <button 
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#2a2a2e] text-[#8b8b8d] text-sm hover:bg-[#343541] transition-colors"
        >
          <Keyboard className="h-4 w-4" />
          <span className="flex-1 text-left">Keyboard Shortcuts</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showShortcuts ? 'rotate-180' : ''}`} />
        </button>
        {showShortcuts && (
          <div className="flex gap-1.5 text-xs mt-2 px-3">
            <span className="px-1.5 py-0.5 bg-[#404040] rounded text-[#a0a0a0]">Ctrl+B</span>
            <span className="px-1.5 py-0.5 bg-[#404040] rounded text-[#a0a0a0]">Ctrl+X</span>
            <span className="px-1.5 py-0.5 bg-[#404040] rounded text-[#a0a0a0]">Ctrl+M</span>
          </div>
        )}
      </div>
    </div>
  )
}
