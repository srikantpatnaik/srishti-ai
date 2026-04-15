import React, { useState, useRef, useEffect } from "react"
import { Grid3X3, MessageSquarePlus } from "lucide-react"

const languages = [
  { code: "", name: "English", native: "EN" },
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "mai", name: "Maithili", native: "মৈথিলী" },
]

interface DockProps {
  onNewChat: () => void
  onToggleGallery: () => void
  selectedLanguage: string
  onLanguageChange: (lang: string) => void
}

export function Dock({
  onNewChat,
  onToggleGallery,
  selectedLanguage,
  onLanguageChange,
}: DockProps) {
  const [showLangMenu, setShowLangMenu] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const currentLang = languages.find(l => l.code === selectedLanguage) || languages[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false)
      }
    }
    if (showLangMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showLangMenu])

  return (
    <div className="flex items-center justify-end gap-1.5 py-2 -mt-14">
      <div className="flex items-center gap-1.5 p-1 bg-[#1f1f23]/10 backdrop-blur-md rounded-full border border-[#2e2e32]/20">
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center justify-center h-9 px-4 rounded-full text-[#888888] hover:text-[#e5e5e5] hover:bg-[#404040]/50 backdrop-blur-sm transition-all duration-200 text-sm font-medium"
            title="Language"
          >
            {currentLang.native}
          </button>
          {showLangMenu && (
            <div className="absolute bottom-full mb-2 right-0 p-1 bg-[#1f1f23]/90 backdrop-blur-md border border-[#3e3e42] rounded-xl shadow-xl min-w-[140px] max-h-[200px] overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code)
                    setShowLangMenu(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-3 ${
                    selectedLanguage === lang.code 
                      ? 'bg-[#3e3e42] text-[#e5e5e5]' 
                      : 'text-[#e5e5e5] hover:bg-[#2e2e32]'
                  }`}
                >
                  <span className="w-16 text-left">{lang.native}</span>
                  <span className="text-[#888888] text-xs">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-[#2e2e32]/50" />

        <button
          onClick={onNewChat}
          className="flex items-center justify-center h-9 w-9 rounded-full text-[#888888] hover:text-[#e5e5e5] hover:bg-[#404040]/50 backdrop-blur-sm transition-all duration-200"
          title="New Chat"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleGallery}
          className="flex items-center justify-center h-9 w-9 rounded-full text-[#888888] hover:text-[#e5e5e5] hover:bg-[#404040]/50 backdrop-blur-sm transition-all duration-200"
          title="Gallery"
        >
          <Grid3X3 className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
