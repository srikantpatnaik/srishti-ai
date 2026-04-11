import React from "react"
import { Square, ArrowUp, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  isGenerating: boolean
  handleSubmit: (e?: React.FormEvent, language?: string) => void
  stopGeneration: () => void
  onShowAppDrawer?: () => void
}

export function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSubmit,
  stopGeneration,
  onShowAppDrawer
}: ChatInputProps) {
  const isDisabled = !input.trim() || isGenerating

  const onSubmit = (e?: React.FormEvent) => {
    handleSubmit(e)
  }

  return (
    <div className="relative">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSubmit()
          }
        }}
        placeholder=""
        rows={1}
        className="w-full min-h-[44px] max-h-[200px] resize-none border border-[#2e2e32] bg-[#1f1f23] text-[#e5e5e5] placeholder:text-[#888888] focus-visible:outline-none focus-visible:ring-0 pr-24 py-3 rounded-xl"
        disabled={isGenerating}
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {onShowAppDrawer && (
          <Button
            type="button"
            size="icon"
            className="h-7 w-7 rounded-xl bg-transparent hover:bg-[#2e2e32] border-0 transition-colors"
            onClick={onShowAppDrawer}
            title="App Library"
          >
            <Grid3X3 className="h-4 w-4 text-[#888888]" />
          </Button>
        )}

        {isGenerating ? (
          <Button
            type="button"
            size="icon"
            className="h-7 w-7 rounded-full bg-[#2e2e32] hover:bg-[#3e3e42] border-0 transition-colors"
            onClick={stopGeneration}
          >
            <Square className="h-3 w-3 text-white" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="h-7 w-7 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] border-0 transition-colors"
            disabled={isDisabled}
            onClick={onSubmit}
          >
            <ArrowUp className="h-3 w-3 text-white" />
          </Button>
        )}
      </div>
    </div>
  )
}
