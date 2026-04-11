import { User, Bot, FileCode, CheckCircle2, AlertCircle, TerminalIcon, Code2, Play, Check, ExternalLink, Loader2 } from "lucide-react"
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
  previewUrl?: string
  onPreviewClick?: () => void
  status?: string
}

export function ChatMessage({ message, previewUrl, onPreviewClick, status }: ChatMessageProps) {
  const isUser = message.role === "user"

  const renderContent = () => {
    if (message.type === "code" && message.filePath) {
      return (
        <div className="mt-3 bg-[#1a1a1f] rounded-xl overflow-hidden border border-[#2e2e32]">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#161618] border-b border-[#2e2e32]">
            <Code2 className="h-4 w-4" />
            <span className="text-xs font-mono">{message.filePath}</span>
          </div>
          <pre className="p-4 text-sm overflow-x-auto bg-[#121215]">
            <code>{message.content}</code>
          </pre>
        </div>
      )
    }

    if (message.type === "plan") {
      return (
        <div className="mt-3 bg-[#1a1a1f] rounded-xl p-4 border border-[#2e2e32]">
           <h4 className="font-medium text-base mb-3 flex items-center gap-2">
             <FileCode className="h-5 w-5" />
             Development Plan
           </h4>
           <div className="text-base whitespace-pre-wrap">{message.content}</div>
         </div>
      )
    }

    if (message.type === "phase") {
      const phaseName = message.phase ? message.phase.charAt(0).toUpperCase() + message.phase.slice(1) : "Phase"
      return (
         <div className="mt-3 bg-[#1a1a1f] rounded-xl p-4 border border-[#2e2e32]">
           <h4 className="font-medium text-base mb-3 flex items-center gap-2">
             <span className="animate-pulse">●</span>
             {phaseName} Phase
           </h4>
           <div className="text-base whitespace-pre-wrap">{message.content}</div>
         </div>
      )
    }

    if (message.type === "error") {
      return (
        <div className="mt-3 bg-destructive/10 rounded-xl p-4 border border-destructive/30">
           <div className="flex items-center gap-2 mb-3">
             <AlertCircle className="h-6 w-6 text-destructive" />
             <span className="font-medium text-base text-destructive">Error Detected</span>
           </div>
           <pre className="text-base whitespace-pre-wrap">{message.content}</pre>
        </div>
      )
    }

    if (message.type === "file") {
      return (
       <div className="mt-3 bg-[#1a1a1f] rounded-xl p-4 border border-[#2e2e32]">
           <div className="flex items-center gap-2">
             <Check className="h-6 w-6" />
             <span className="font-medium text-base">File Created/Updated</span>
           </div>
           <p className="text-base mt-2">{message.content}</p>
         </div>
      )
    }

    if (message.type === "tool-call") {
      const toolName = (message as any).toolName
      const args = (message as any).args
      
      if (toolName === "announce") {
        return (
    <div className="mt-3 bg-[#1a1a1f] rounded-xl p-4 border border-[#2e2e32]">
             <h4 className="font-medium text-base mb-3 flex items-center gap-2">
               <span className="animate-pulse">●</span>
               {args.phase?.charAt(0).toUpperCase() + args.phase?.slice(1)} Phase
             </h4>
             <div className="text-base whitespace-pre-wrap">{args.message || "Processing..."}</div>
           </div>
        )
      }
    }

    if (message.type === "tool-result") {
      const toolName = (message as any).toolName
      const result = (message as any).result
      
      if (toolName === "announce") {
        return (
   <div className="mt-3 bg-[#1a1a1f] rounded-xl p-4 border border-[#2e2e32]">
             <h4 className="font-medium text-base mb-3 flex items-center gap-2">
               <span className="animate-pulse">●</span>
               {result.phase?.charAt(0).toUpperCase() + result.phase?.slice(1)} Phase
             </h4>
             <div className="text-base whitespace-pre-wrap">{result.message}</div>
           </div>
        )
      }
    }

    return (
      <div className="prose prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-h3:font-semibold prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || "")
              if (match && match[1] === 'html') {
                return null
              }
              return match ? (
                <pre className="bg-[#1a1a1f] rounded-xl p-4 my-4 overflow-x-auto border border-[#2e2e32]">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-[#1a1a1f] rounded-lg px-2 py-1 font-mono text-base" {...props}>
                  {children}
                </code>
              )
            },
            h3: ({children}) => <h3 className="text-base font-semibold mt-4 mb-3">{children}</h3>,
            ul: ({children}) => <ul className="list-disc list-inside my-3 space-y-1.5">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal list-inside my-3 space-y-1.5">{children}</ol>,
            li: ({children}) => <li className="text-base">{children}</li>,
            p: ({children}) => <p className="text-base my-3 leading-relaxed">{children}</p>,
            div: ({children, ...props}) => {
              if (children && typeof children === 'string' && children.includes('```html')) {
                return null
              }
              return <div {...props}>{children}</div>
            }
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "px-4 py-3 text-[15px] leading-relaxed",
isUser 
              ? "bg-[#2e2e32] text-[#e5e5e5] max-w-[100%] sm:max-w-[100%] rounded-2xl rounded-br-md ml-auto" 
              : "bg-[#1a1a1f] text-[#e5e5e5] max-w-[100%] sm:max-w-[100%] rounded-2xl rounded-bl-md"
        )}
      >
        <div className="min-w-0">
          {renderContent()}
        </div>
      </div>
      
      {/* Status / Loading indicator in chat area */}
      {!isUser && status && status !== "idle" && status !== "ready" && (
        <div className="flex items-center gap-2 text-sm text-[#888888] px-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            {status === "planning" && "Thinking..."}
            {status === "coding" && "Creating app..."}
            {status === "testing" && "Checking..."}
            {status === "fixing" && "Fixing issues..."}
          </span>
        </div>
      )}
      
      {/* Preview thumbnail in chat - shown when there's a preview URL */}
      {previewUrl && !isUser && (
        <div 
          onClick={onPreviewClick}
          className="mt-2 cursor-pointer group relative overflow-hidden rounded-xl border border-[#2e2e32] hover:border-[#3b82f6] transition-colors"
        >
<iframe
             src={previewUrl}
             className="w-full h-48 sm:h-64 border-0 bg-[#0a0a0f]"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
             sandbox="allow-scripts allow-same-origin"
           />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm font-medium">Open in Preview</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
