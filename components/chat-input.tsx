import React, { useState, useRef, useEffect } from "react"
import { ArrowUp, Square, Plus, MessageSquarePlus, Grid3X3 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const languages = [
  { code: "", name: "English", native: "EN", placeholder: "Ask anything..." },
  { code: "hi", name: "Hindi", native: "हिंदी", placeholder: "कुछ भी पूछें..." },
  { code: "bn", name: "Bengali", native: "বাংলা", placeholder: "যেকোনো কিছু জিজ্ঞাসা করুন..." },
  { code: "te", name: "Telugu", native: "తెలుగు", placeholder: "ఏదైనా అడగండి..." },
  { code: "ta", name: "Tamil", native: "தமிழ்", placeholder: "எதையும் கேளுங்கள்..." },
  { code: "mr", name: "Marathi", native: "मराठी", placeholder: "काहीही विचारा..." },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", placeholder: "કંઈપૂછો..." },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", placeholder: "ಏನು ಕೇಳಿ..." },
  { code: "ml", name: "Malayalam", native: "മലയാളം", placeholder: "എന്തും ചോദിക്കുക..." },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", placeholder: "ਕੁਝ ਵੀ ਪੁੱਛੋ..." },
  { code: "ur", name: "Urdu", native: "اردو", placeholder: "کچھ بھی پوچھیں..." },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", placeholder: "କିଛି ମଧ୍ୟ ପଚାରନ୍ତୁ..." },
  { code: "as", name: "Assamese", native: "অসমীয়া", placeholder: "যিকোনো সুধক..." },
  { code: "mai", name: "Maithili", native: "मैथिली", placeholder: "कुनो भी पूछू..." },
]

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  isGenerating: boolean
  handleSubmit: (e?: React.FormEvent, language?: string) => void
  stopGeneration?: () => void
  selectedLanguage: string
  onLanguageChange: (lang: string) => void
  onNewChat: () => void
  onToggleGallery: () => void
}

export function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSubmit,
  stopGeneration,
  selectedLanguage,
  onLanguageChange,
  onNewChat,
  onToggleGallery,
}: ChatInputProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const currentLang = languages.find(l => l.code === selectedLanguage) || languages[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMenu])

  const canSubmit = input.trim() && !isGenerating

  const onSubmit = (e?: React.FormEvent) => {
    if (isGenerating) return
    handleSubmit(e)
  }

  const onStop = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (stopGeneration) stopGeneration()
  }

  return (
    <div className="relative">
      <div className="relative flex items-end gap-1.5">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex items-center justify-center h-10 w-10 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] text-[#666666] hover:text-[#e5e5e5] hover:bg-[#111111] hover:border-[#333333] transition-all ${showMenu ? 'rounded-r-none bg-[#111111] border-l-0' : ''}`}
            title="Menu"
          >
            <Plus className="h-5 w-5" />
          </button>
          {showMenu && (
            <div      className="absolute bottom-full mb-2 left-0 p-2 bg-[#050505]/98 backdrop-blur-md border border-[#0f0f0f] rounded-xl shadow-2xl w-[240px]">
              <div className="mb-1 pb-2 border-b border-[#0f0f0f]">
                <p className="text-[10px] text-[#333333] mb-1.5 px-2 uppercase tracking-wider">Language</p>
                <div className="max-h-[160px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code)
                        setShowMenu(false)
                      }}
                      className={`w-full text-left px-2 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                        selectedLanguage === lang.code 
                          ? 'bg-[#0f0f0f] text-[#e5e5e5]' 
                          : 'text-[#444444] hover:bg-[#0a0a0a]'
                      }`}
                    >
                      <span className="text-[#666666] text-xs w-8">{lang.native}</span>
                      <span className="text-[#888888] text-xs">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  onNewChat()
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-[#444444] hover:bg-[#0a0a0a] rounded-lg transition-colors"
              >
                <MessageSquarePlus className="h-4 w-4 text-[#333333]" />
                <span>New Chat</span>
              </button>
              <div className="mt-1 pt-2 border-t border-[#0f0f0f]">
                <button
                  onClick={() => {
                    onToggleGallery()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 text-sm text-[#444444] hover:bg-[#0a0a0a] rounded-lg transition-colors"
                >
                  <Grid3X3 className="h-4 w-4 text-[#666666]" />
                  <span>Menu</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === "ArrowUp" && !isGenerating) {
                 e.preventDefault()
                 const textarea = e.target as HTMLTextAreaElement
                 const selectionStart = textarea.selectionStart
                 const value = textarea.value
                 const lastNewlineIndex = value.lastIndexOf('\n', selectionStart - 1)
                 if (lastNewlineIndex !== -1) {
                   textarea.setSelectionRange(lastNewlineIndex + 1, selectionStart)
                   textarea.focus()
                 }
               } else if (e.key === "ArrowDown" && !isGenerating) {
                 e.preventDefault()
                 const textarea = e.target as HTMLTextAreaElement
                 const selectionStart = textarea.selectionStart
                 const value = textarea.value
                 const nextNewlineIndex = value.indexOf('\n', selectionStart)
                 if (nextNewlineIndex !== -1) {
                   textarea.setSelectionRange(nextNewlineIndex + 1, selectionStart + (nextNewlineIndex - selectionStart + 1))
                   textarea.focus()
                 }
               } else if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
                 e.preventDefault()
                 onSubmit()
               }
             }}
            placeholder={isGenerating ? "Queuing next query..." : currentLang.placeholder}
            rows={1}
            className="w-full min-h-[44px] max-h-[120px] resize-none bg-[#0a0a0a] text-[#e5e5e5] placeholder:text-[#333333] focus-visible:outline-none focus-visible:ring-0 pr-14 py-2.5 rounded-2xl overflow-y-auto [&::-webkit-scrollbar]:hidden text-sm"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="p-1.5 rounded-full bg-[#0f0f0f] hover:bg-[#1a1a1a] text-[#555555] hover:text-[#e5e5e5] transition-all"
                title="Stop"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={onSubmit}
                disabled={!canSubmit}
                className="p-1.5 rounded-full bg-[#0f0f0f] hover:bg-[#1a1a1a] text-[#555555] hover:text-[#e5e5e5] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#0f0f0f]"
                title="Send"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
