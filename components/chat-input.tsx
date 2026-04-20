import React, { useState, useRef, useEffect, useCallback } from "react"
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
  status?: string
}

function getPromptHistory(): string[] {
  try {
    const stored = localStorage.getItem("promptHistory")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function savePromptToHistory(prompt: string) {
  const history = getPromptHistory()
  if (!prompt.trim()) return
  const filtered = history.filter(h => h !== prompt)
  filtered.push(prompt)
  if (filtered.length > 50) filtered.shift()
  localStorage.setItem("promptHistory", JSON.stringify(filtered))
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
  status = "idle",
}: ChatInputProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const currentLang = languages.find(l => l.code === selectedLanguage) || languages[0]

  // Bash-style history state
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [savedInput, setSavedInput] = useState("")
  const promptHistory = getPromptHistory()

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
    if (input.trim()) {
      savePromptToHistory(input)
    }
    setHistoryIndex(-1)
    setSavedInput("")
    handleSubmit(e)
  }

  const onStop = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (stopGeneration) stopGeneration()
  }

  const handleArrowUp = useCallback(() => {
    if (isGenerating) return
    const textarea = textareaRef.current
    if (!textarea) return

    if (historyIndex === -1) {
      setSavedInput(input)
      setHistoryIndex(promptHistory.length)
    }

    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInput(promptHistory[newIndex])
    }
  }, [historyIndex, input, isGenerating, promptHistory, setInput])

  const handleArrowDown = useCallback(() => {
    if (isGenerating) return
    const textarea = textareaRef.current
    if (!textarea) return

    if (historyIndex === -1) return

    if (historyIndex === 0) {
      setInput(savedInput)
      setHistoryIndex(-1)
    } else {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInput(promptHistory[newIndex])
    }
  }, [historyIndex, isGenerating, promptHistory, savedInput, setInput])

  return (
    <div className="relative">
      <div className="relative flex items-end gap-1.5">
        <div className="relative w-full" ref={menuRef}>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" && !isGenerating) {
                  e.preventDefault()
                  handleArrowUp()
                } else if (e.key === "ArrowDown" && !isGenerating) {
                  e.preventDefault()
                  handleArrowDown()
                } else if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
                  e.preventDefault()
                  onSubmit()
                }
              }}
              placeholder={isGenerating ? "Queuing next query..." : currentLang.placeholder}
              rows={1}
              className="w-full min-h-[44px] max-h-[120px] resize-none bg-[#0a0a0a] text-[#e5e5e5] placeholder:text-[#2a2a2a] focus-visible:outline-none focus-visible:ring-0 pl-11 pr-14 py-2.5 rounded-2xl overflow-y-auto [&::-webkit-scrollbar]:hidden text-sm border border-[#1a1a1a] focus:border-[#2e2e32]"
            />

            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-1.5 rounded-full bg-[#141414] hover:bg-[#1f1f1f] text-[#555555] hover:text-[#e5e5e5] transition-all ${showMenu ? 'bg-[#1f1f1f] text-[#e5e5e5]' : ''}`}
                title="Menu"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {showMenu && (
              <div className="absolute bottom-full mb-2 left-0 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl shadow-2xl w-[260px]">
                <div className="mb-2 pb-2.5 border-b border-[#1a1a1a]">
                  <p className="text-[10px] text-[#444444] mb-2 px-1 uppercase tracking-widest font-medium">Language</p>
                  <div className="max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden space-y-0.5">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code)
                          setShowMenu(false)
                        }}
                        className={`w-full text-left px-2.5 py-2 text-sm rounded-lg transition-all flex items-center gap-3 ${
                          selectedLanguage === lang.code 
                            ? 'bg-[#1a1a1a] text-[#e5e5e5] border border-[#2e2e32]' 
                            : 'text-[#555555] hover:bg-[#141414] hover:text-[#888888]'
                        }`}
                      >
                        <span className="text-[#444444] text-xs w-8 font-mono">{lang.native}</span>
                        <span className="text-[#666666] text-xs">{lang.name}</span>
                        {selectedLanguage === lang.code && (
                          <span className="ml-auto text-[#de0f17] text-xs">●</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onNewChat()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2.5 text-sm text-[#555555] hover:bg-[#141414] hover:text-[#e5e5e5] rounded-lg transition-all"
                >
                  <MessageSquarePlus className="h-4 w-4 text-[#444444]" />
                  <span>New Chat</span>
                </button>
                <div className="mt-1 pt-2 border-t border-[#1a1a1a]">
                  <button
                    onClick={() => {
                      onToggleGallery()
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2.5 text-sm text-[#555555] hover:bg-[#141414] hover:text-[#e5e5e5] rounded-lg transition-all"
                  >
                    <Grid3X3 className="h-4 w-4 text-[#444444]" />
                    <span>Gallery</span>
                  </button>
                </div>
              </div>
            )}

            <div className="absolute right-2 top-1/2 -translate-y-1/2">
               {isGenerating ? (
                 <button
                   type="button"
                   onClick={onStop}
                   className="p-1.5 rounded-full bg-[#141414] hover:bg-[#1f1f1f] text-[#555555] hover:text-[#e5e5e5] transition-all"
                   title="Stop"
                 >
                   <Square className="h-3.5 w-3.5" />
                 </button>
               ) : (
                 <button
                   type="submit"
                   onClick={onSubmit}
                   disabled={!canSubmit}
                   className="p-1.5 rounded-full bg-[#141414] hover:bg-[#1f1f1f] text-[#555555] hover:text-[#e5e5e5] transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-[#141414]"
                   title="Send"
                 >
                   <ArrowUp className="h-3.5 w-3.5" />
                 </button>
               )}
             </div>
             
             {/* Status indicator - tiny, bottom right */}
             {isGenerating && (
               <div className="absolute bottom-1 right-2 flex items-center gap-1">
                 <span className="text-[9px] text-[#555555]">{status}</span>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   )
}
