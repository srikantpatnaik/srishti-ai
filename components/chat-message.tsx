import { User, Bot, FileCode, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatMessageProps {
  message: any
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
        <div className="mt-2 bg-blue-900/20 rounded-lg p-3 border border-blue-800/30">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-400">
            <FileCode className="h-4 w-4" />
            Development Plan
          </h4>
          <div className="text-sm whitespace-pre-wrap text-blue-100/80">{message.content}</div>
        </div>
      )
    }

    if (message.type === "phase") {
      return (
        <div className="mt-2 bg-purple-900/20 rounded-lg p-3 border border-purple-800/30">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-purple-400">
            <span className="animate-pulse">●</span>
            {message.phase?.charAt(0).toUpperCase() + message.phase?.slice(1)} Phase
          </h4>
          <div className="text-sm whitespace-pre-wrap text-purple-100/80">{message.content}</div>
        </div>
      )
    }

    if (message.type === "error") {
      return (
        <div className="mt-2 bg-red-900/20 rounded-lg p-3 border border-red-800/30">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Error Detected</span>
          </div>
          <pre className="text-sm text-red-300 whitespace-pre-wrap">{message.content}</pre>
        </div>
      )
    }

    if (message.type === "file") {
      return (
        <div className="mt-2 bg-green-900/20 rounded-lg p-3 border border-green-800/30">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium text-sm">File Created/Updated</span>
          </div>
          <p className="text-sm text-green-200/80">{message.content}</p>
        </div>
      )
    }

    if (message.type === "tool-result" && (message as any).toolName === "announce") {
      const result = (message as any).result
      return (
        <div className="mt-2 bg-purple-900/20 rounded-lg p-3 border border-purple-800/30">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-purple-400">
            <span className="animate-pulse">●</span>
            {result.phase?.charAt(0).toUpperCase() + result.phase?.slice(1)} Phase
          </h4>
          <div className="text-sm whitespace-pre-wrap text-purple-100/80">{result.message}</div>
        </div>
      )
    }

    if (message.type === "tool-call" && (message as any).toolName === "announce") {
      const args = (message as any).args
      return (
        <div className="mt-2 bg-purple-900/20 rounded-lg p-3 border border-purple-800/30">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-purple-400">
            <span className="animate-pulse">●</span>
            {args.phase?.charAt(0).toUpperCase() + args.phase?.slice(1)} Phase
          </h4>
          <div className="text-sm whitespace-pre-wrap text-purple-100/80">{args.message || "Processing..."}</div>
        </div>
      )
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg",
        isUser 
          ? "bg-gray-800 dark:bg-gray-900 text-gray-100 border border-gray-700" 
          : "bg-muted"
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