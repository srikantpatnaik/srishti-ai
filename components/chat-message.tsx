import { User, Bot, FileCode, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    type?: "text" | "code" | "error" | "plan" | "file"
    filePath?: string
    language?: string
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  const renderContent = () => {
    if (message.type === "code" && message.filePath) {
      return (
        <div className="mt-2 bg-muted rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
            <FileCode className="h-3 w-3" />
            <span className="text-xs font-mono">{message.filePath}</span>
          </div>
          <pre className="p-3 text-xs overflow-x-auto">
            <code>{message.content}</code>
          </pre>
        </div>
      )
    }

    if (message.type === "plan") {
      return (
        <div className="mt-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Development Plan
          </h4>
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>
      )
    }

    if (message.type === "error") {
      return (
        <div className="mt-2 bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Error Detected</span>
          </div>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{message.content}</pre>
        </div>
      )
    }

    if (message.type === "file") {
      return (
        <div className="mt-2 bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium text-sm">File Created/Updated</span>
          </div>
          <p className="text-sm">{message.content}</p>
        </div>
      )
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}
    >
      <div className="shrink-0">
        {isUser ? (
          <User className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>
    </div>
  )
}