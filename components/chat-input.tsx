import React from "react"
import { Send, Square, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "@ai-sdk/react"

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  isGenerating: boolean
  handleSubmit: (e?: React.FormEvent) => void
  stopGeneration: () => void
  onEditSave?: () => void
  isEditing?: boolean
}

export function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSubmit,
  stopGeneration,
  onEditSave,
  isEditing
}: ChatInputProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="border-t p-4 bg-card"
    >
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Describe the app you want to build..."
            className="min-h-[50px] max-h-[150px] resize-none rounded-xl border-input shadow-sm pr-24 text-left"
            disabled={isGenerating}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isEditing && onEditSave ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={onEditSave}
              >
                <Save className="h-3 w-3" />
              </Button>
            ) : isGenerating && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={stopGeneration}
              >
                <Square className="h-3 w-3" />
              </Button>
            )}
            <Button
              type="submit"
              variant="secondary"
              size="icon"
              className="h-7 w-7 rounded-lg"
              disabled={!input.trim() || isGenerating}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
