import React from "react"
import { Square, ArrowUp, Paperclip, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  isGenerating: boolean
  handleSubmit: (e?: React.FormEvent) => void
  stopGeneration: () => void
  onNewChat?: () => void
  onShowAppDrawer?: () => void
}

export function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSubmit,
  stopGeneration,
  onNewChat,
  onShowAppDrawer
}: ChatInputProps) {
  const isDisabled = !input.trim() || isGenerating

  return (
    <div className="px-4 pb-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Ask anything..."
            className="min-h-[56px] max-h-[200px] resize-none rounded-2xl rounded-b-none border-0 bg-[#1f1f23] text-[#e5e5e5] placeholder:text-[#888888] shadow-lg py-3 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
            disabled={isGenerating}
            style={{ 
              backgroundColor: '#1f1f23',
              color: '#e5e5e5'
            }}
          />
          <div className="flex justify-between items-center px-2 py-1 bg-[#1f1f23] rounded-2xl rounded-t-none border-t border-[#2e2e32]">
            <div className="flex items-center gap-2">
              {onShowAppDrawer && (
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 rounded-xl bg-transparent hover:bg-[#2e2e32] border-0 transition-colors"
                  onClick={onShowAppDrawer}
                  title="App Library"
                >
                  <Grid3X3 className="h-4 w-4 text-[#888888]" />
                </Button>
              )}
              {onNewChat && (
                <button type="button" onClick={onNewChat} className="px-3 py-1.5 rounded-lg text-xs text-[#888888] border border-[#5e5e62] hover:text-[#e5e5e5] hover:bg-[#2e2e42] hover:border-[#6e6e72] transition-colors">
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                className="h-8 w-8 rounded-xl bg-transparent hover:bg-[#2e2e32] border-0 transition-colors"
              >
                <Paperclip className="h-4 w-4 text-[#888888]" />
              </Button>
              {isGenerating ? (
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-[#2e2e32] hover:bg-[#3e3e42] border-0 transition-colors"
                  onClick={stopGeneration}
                >
                  <Square className="h-3 w-3 text-white" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] border-0 transition-colors"
                  disabled={isDisabled}
                  onClick={handleSubmit}
                >
                  <ArrowUp className="h-3 w-3 text-white" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}