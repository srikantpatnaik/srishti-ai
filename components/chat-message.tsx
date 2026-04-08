import { User, Bot, FileCode, CheckCircle2, AlertCircle, TerminalIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatMessageProps {
  message: {
    id: string
    role: "system" | "user" | "assistant" | "data"
    content: string
    type?: "error" | "code" | "text" | "plan" | "file" | "phase" | "tool-call" | "tool-result"
    filePath?: string
    language?: string
    toolName?: string
    args?: any
    result?: any
    phase?: string
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
      const phaseName = message.phase ? message.phase.charAt(0).toUpperCase() + message.phase.slice(1) : "Phase"
      return (
        <div className="mt-2 bg-purple-900/20 rounded-lg p-3 border border-purple-800/30">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-purple-400">
            <span className="animate-pulse">●</span>
            {phaseName} Phase
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

    if (message.type === "tool-call") {
      const toolName = (message as any).toolName
      const args = (message as any).args
      
      if (toolName === "announce") {
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
      
      if (toolName === "read") {
        return (
          <div className="mt-2 bg-blue-900/20 rounded-lg p-3 border border-blue-800/30">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-400">
              <FileCode className="h-4 w-4" />
              Reading: {args.path}
            </h4>
          </div>
        )
      }
      
      if (toolName === "write") {
        return (
          <div className="mt-2 bg-green-900/20 rounded-lg p-3 border border-green-800/30">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Writing: {args.path}
            </h4>
          </div>
        )
      }
      
      if (toolName === "bash") {
        return (
          <div className="mt-2 bg-orange-900/20 rounded-lg p-3 border border-orange-800/30">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-orange-400">
              <TerminalIcon className="h-4 w-4" />
              Running command
            </h4>
            <pre className="text-xs text-orange-200/80 whitespace-pre-wrap">{args.command}</pre>
          </div>
        )
      }
    }

    if (message.type === "tool-result") {
      const toolName = (message as any).toolName
      const result = (message as any).result
      
      if (toolName === "announce") {
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
      
      if (toolName === "read") {
        return (
          <div className="mt-2 bg-blue-900/20 rounded-lg p-3 border border-blue-800/30">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-400">
              <FileCode className="h-4 w-4" />
              Read: {result.filePath || "file"}
            </h4>
            {result.content && (
              <pre className="text-xs text-blue-200/80 whitespace-pre-wrap max-h-32 overflow-y-auto">{result.content}</pre>
            )}
          </div>
        )
      }
      
      if (toolName === "write") {
        return (
          <div className="mt-2 bg-green-900/20 rounded-lg p-3 border border-green-800/30">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Created: {result.filePath}
            </h4>
            {result.message && <p className="text-sm text-green-200/80">{result.message}</p>}
          </div>
        )
      }
      
      if (toolName === "bash") {
        return (
          <div className="mt-2 bg-orange-900/20 rounded-lg p-3 border border-orange-800/30">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-orange-400">
              <TerminalIcon className="h-4 w-4" />
              Command executed
            </h4>
            {result.output && (
              <pre className="text-xs text-orange-200/80 whitespace-pre-wrap max-h-32 overflow-y-auto">{result.output}</pre>
            )}
            {result.error && (
              <pre className="text-xs text-red-300 whitespace-pre-wrap max-h-32 overflow-y-auto">{result.error}</pre>
            )}
          </div>
        )
      }
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
        "p-3 rounded-2xl",
        isUser 
          ? "bg-blue-600 text-white rounded-br-sm" 
          : "bg-muted text-foreground rounded-bl-sm"
      )}
    >
      <div className="min-w-0">
        {renderContent()}
      </div>
    </div>
  )
}