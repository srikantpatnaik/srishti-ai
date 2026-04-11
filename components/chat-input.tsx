import React from "react"
import { Square, ArrowUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  isGenerating: boolean
  handleSubmit: (e?: React.FormEvent) => void
  stopGeneration: () => void
  onNewChat?: () => void
}

export function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSubmit,
  stopGeneration,
  onNewChat
}: ChatInputProps) {
  const isDisabled = !input.trim() || isGenerating

  return (
    <div className="px-4 pb-4">
      <div className="max-w-2xl mx-auto">
        <div className="relative flex items-end gap-2">
          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className="p-2.5 rounded-xl bg-[#2e2e32] hover:bg-[#3e3e42] transition-colors flex-shrink-0"
            >
              <Plus className="h-4 w-4 text-white" />
            </button>
          )}
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
            className="min-h-[56px] max-h-[200px] resize-none rounded-2xl border-0 bg-[#1f1f23] text-[#e5e5e5] placeholder:text-[#888888] focus:ring-1 focus:ring-[#3b82f6] shadow-lg flex-1"
            disabled={isGenerating}
            style={{ 
              backgroundColor: '#1f1f23',
              color: '#e5e5e5'
            }}
          />
          <div className="flex items-center flex-shrink-0">
            {isGenerating ? (
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 rounded-xl bg-[#2e2e32] hover:bg-[#3e3e42] border-0 transition-colors"
                onClick={stopGeneration}
              >
                <Square className="h-4 w-4 text-white" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] border-0 transition-colors"
                disabled={isDisabled}
              >
                <ArrowUp className="h-4 w-4 text-white" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
