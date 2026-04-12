import React from "react"
import { ArrowUp, Square } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  isGenerating: boolean
  handleSubmit: (e?: React.FormEvent, language?: string) => void
  stopGeneration?: () => void
}

export function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSubmit,
  stopGeneration,
}: ChatInputProps) {
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
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
            e.preventDefault()
            onSubmit()
          }
        }}
        placeholder={isGenerating ? "Queuing next query..." : "Ask anything..."}
        rows={1}
        className="w-full min-h-[48px] max-h-[200px] resize-none border border-[#2e2e32] bg-[#1f1f23] text-[#e5e5e5] placeholder:text-[#888888] focus-visible:outline-none focus-visible:ring-0 pr-14 py-3 rounded-2xl"
      />

      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        {isGenerating ? (
          <button
            type="button"
            onClick={onStop}
            className="p-2 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white transition-all"
            title="Stop"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="p-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#3b82f6]"
            title="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}