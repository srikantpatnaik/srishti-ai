import { User, Bot, FileCode, CheckCircle2, AlertCircle, TerminalIcon, Code2, Play, Check } from "lucide-react"
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
        <div className="mt-4 bg-card/50 rounded-xl overflow-hidden border border-card-foreground/10">
          <div className="flex items-center gap-2 px-4 py-3 bg-card/30 border-b border-card-foreground/10">
            <Code2 className="h-4 w-4" />
            <span className="text-xs font-mono">{message.filePath}</span>
          </div>
          <pre className="p-4 text-sm overflow-x-auto bg-card/20">
            <code>{message.content}</code>
          </pre>
        </div>
      )
    }

    if (message.type === "plan") {
      return (
        <div className="mt-4 bg-card/40 rounded-xl p-4 border border-card-foreground/10">
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
         <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
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
        <div className="mt-4 bg-destructive/10 rounded-xl p-4 border border-destructive/30">
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
       <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
           <div className="flex items-center gap-2">
             <Check className="h-6 w-6" />
             <span className="font-medium text-base">File Created/Updated</span>
           </div>
           <p className="text-base mt-2">{message.content}</p>
         </div>
      )
    }

    if (message.type === "tool-result" && (message as any).toolName === "announce") {
      const result = (message as any).result
      return (
     <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
           <h4 className="font-medium text-base mb-3 flex items-center gap-2">
             <span className="animate-pulse">●</span>
             {result.phase?.charAt(0).toUpperCase() + result.phase?.slice(1)} Phase
           </h4>
           <div className="text-base whitespace-pre-wrap">{result.message}</div>
         </div>
      )
    }

    if (message.type === "tool-call") {
      const toolName = (message as any).toolName
      const args = (message as any).args
      
      if (toolName === "announce") {
        return (
    <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
             <h4 className="font-medium text-base mb-3 flex items-center gap-2">
               <span className="animate-pulse">●</span>
               {args.phase?.charAt(0).toUpperCase() + args.phase?.slice(1)} Phase
             </h4>
             <div className="text-base whitespace-pre-wrap">{args.message || "Processing..."}</div>
           </div>
        )
      }
      
      if (toolName === "read") {
        return (
   <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
             <div className="flex items-center gap-2">
               <FileCode className="h-6 w-6" />
               <span className="font-medium text-base">Reading: {args.path}</span>
             </div>
           </div>
        )
      }
      
      if (toolName === "write") {
        return (
  <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
             <div className="flex items-center gap-2">
               <Check className="h-6 w-6" />
               <span className="font-medium text-base">Writing: {args.path}</span>
             </div>
           </div>
        )
      }
      
      if (toolName === "bash") {
        return (
     <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
             <div className="flex items-center gap-2">
               <TerminalIcon className="h-6 w-6" />
               <span className="font-medium text-base">Running command</span>
             </div>
             <pre className="text-sm mt-3 whitespace-pre-wrap">{args.command}</pre>
           </div>
        )
      }
    }

    if (message.type === "tool-result") {
      const toolName = (message as any).toolName
      const result = (message as any).result
      
      if (toolName === "announce") {
        return (
   <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
             <h4 className="font-medium text-base mb-3 flex items-center gap-2">
               <span className="animate-pulse">●</span>
               {result.phase?.charAt(0).toUpperCase() + result.phase?.slice(1)} Phase
             </h4>
             <div className="text-base whitespace-pre-wrap">{result.message}</div>
           </div>
        )
      }
      
      if (toolName === "read") {
        return (
   <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
             <div className="flex items-center gap-2">
               <FileCode className="h-6 w-6" />
               <span className="font-medium text-base">Read: {result.filePath || "file"}</span>
             </div>
             {result.content && (
               <pre className="text-sm mt-3 whitespace-pre-wrap max-h-32 overflow-y-auto">{result.content}</pre>
             )}
           </div>
        )
      }
      
      if (toolName === "write") {
        return (
 <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
             <div className="flex items-center gap-2">
               <Check className="h-6 w-6" />
               <span className="font-medium text-base">Created: {result.filePath}</span>
             </div>
             {result.message && <p className="text-base mt-3">{result.message}</p>}
           </div>
        )
      }
      
      if (toolName === "bash") {
        return (
   <div className="mt-4 bg-card/30 rounded-xl p-4 border border-card-foreground/10">
             <div className="flex items-center gap-2">
               <TerminalIcon className="h-6 w-6" />
               <span className="font-medium text-base">Command executed</span>
             </div>
             {result.output && (
               <pre className="text-sm mt-3 whitespace-pre-wrap max-h-32 overflow-y-auto">{result.output}</pre>
             )}
             {result.error && (
               <pre className="text-sm mt-3 whitespace-pre-wrap max-h-32 overflow-y-auto">{result.error}</pre>
             )}
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
                <pre className="bg-card/50 rounded-xl p-4 my-4 overflow-x-auto border border-card-foreground/10">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-card/50 rounded-lg px-2 py-1 font-mono text-base" {...props}>
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
    <div
      className={cn(
        "p-4 sm:p-5 rounded-2xl shadow-sm text-base",
        isUser 
          ? "bg-muted/70 text-foreground rounded-br-sm" 
          : "bg-muted/30 text-foreground rounded-bl-sm"
      )}
    >
      <div className="min-w-0">
        {renderContent()}
      </div>
    </div>
  )
}