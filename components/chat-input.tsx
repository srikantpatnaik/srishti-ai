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
      <div className="relative flex items-end gap-2">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex items-center justify-center h-[48px] w-10 rounded-2xl border border-[#2e2e32] bg-[#1f1f23] text-[#888888] hover:text-[#e5e5e5] hover:bg-[#2a2a2e] transition-all ${showMenu ? 'rounded-r-none border-r-0' : ''}`}
            title="Menu"
          >
            <Plus className="h-5 w-5" />
          </button>
          {showMenu && (
            <div className="absolute bottom-full mb-2 left-0 p-2 bg-[#1f1f23]/95 backdrop-blur-md border border-[#3e3e42] rounded-xl shadow-xl w-[240px]">
              <div className="mb-2 pb-2 border-b border-[#2e2e32]">
                <p className="text-xs text-[#666666] mb-1.5 px-1">Language</p>
                <div className="max-h-[160px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code)
                        setShowMenu(false)
                      }}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                        selectedLanguage === lang.code 
                          ? 'bg-[#3e3e42] text-[#e5e5e5]' 
                          : 'text-[#e5e5e5] hover:bg-[#2e2e32]'
                      }`}
                    >
                      <span className="text-[#888888] text-xs w-8">{lang.native}</span>
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
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-[#e5e5e5] hover:bg-[#2e2e32] rounded-lg transition-colors"
              >
                <MessageSquarePlus className="h-4 w-4 text-[#888888]" />
                <span>New Chat</span>
              </button>
              <div className="mt-1 pt-2 border-t border-[#2e2e32]">
                <button
                  onClick={() => {
                    onToggleGallery()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-[#e5e5e5] hover:bg-[#2e2e32] rounded-lg transition-colors"
                >
                  <Grid3X3 className="h-4 w-4 text-[#888888]" />
                  <span>Menu</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
              e.preventDefault()
              onSubmit()
            }
          }}
          placeholder={isGenerating ? "Queuing next query..." : currentLang.placeholder}
          rows={1}
          className="flex-1 min-h-[48px] max-h-[120px] resize-none border border-[#2e2e32] bg-[#1f1f23] text-[#e5e5e5] placeholder:text-[#888888] focus-visible:outline-none focus-visible:ring-0 pr-14 py-3 rounded-2xl overflow-y-auto [&::-webkit-scrollbar]:hidden"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 rounded-xl bg-[#2a2a2e] hover:bg-[#343541] text-[#888888] hover:text-[#e5e5e5] transition-all"
              title="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="p-2 rounded-xl bg-[#2a2a2e] hover:bg-[#343541] text-[#888888] hover:text-[#e5e5e5] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#2a2a2e]"
              title="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
