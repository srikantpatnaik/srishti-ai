import React, { useState, useEffect, useRef, useCallback } from "react"
import { User, Bot, FileCode, CheckCircle2, AlertCircle, TerminalIcon, Code2, Play, Check, ExternalLink, Loader2, Download, FolderHeart, X } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface PreviewIframeProps {
  src: string
  isActive: boolean
  onFocus: () => void
  onBlur: () => void
}

function PreviewIframe({ src, isActive, onFocus, onBlur }: PreviewIframeProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(src)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        if (entry.isIntersecting) {
          setCurrentSrc(src)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [src])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isActive) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
    }
  }, [isActive])

  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown, { capture: true })
      return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [isActive, handleKeyDown])

  return (
    <div
      ref={containerRef}
      tabIndex={isActive ? 0 : -1}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        "w-full h-full bg-[#0a0a0f] transition-all duration-200 relative",
        isActive && "ring-2 ring-[#de0f17]/50"
      )}
    >
      <iframe
        src={currentSrc}
        className="w-full h-full border-0 bg-[#0a0a0f]"
        style={{
          overflow: 'hidden',
        } as React.CSSProperties}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
        allow="pointer-lock"
      />
    </div>
  )
}

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
    imageUrl?: string
    audioUrl?: string
  }
  previewUrl?: string
  onPreviewClick?: () => void
  onSaveToGallery?: () => void
  onDownload?: () => void
  hasSavedToGallery?: boolean
  status?: string
  onImageSave?: () => void
  onImageDownload?: () => void
  onImageOpen?: () => void
  hasImageSavedToGallery?: boolean
}

let globalActivePreviewId: string | null = null

export const ChatMessage = React.memo(function ChatMessage({ 
  message, 
  previewUrl, 
  onPreviewClick, 
  onSaveToGallery, 
  onDownload,
  hasSavedToGallery = false,
  status,
  onImageSave,
  onImageDownload,
  onImageOpen,
  hasImageSavedToGallery = false,
}: ChatMessageProps) {
  const isUser = message.role === "user"
  const [isActive, setIsActive] = useState(false)

  const handleFocus = useCallback(() => {
    if (globalActivePreviewId !== message.id) {
      globalActivePreviewId = message.id
      setIsActive(true)
    }
  }, [message.id])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (globalActivePreviewId === message.id) {
        globalActivePreviewId = null
        setIsActive(false)
      }
    }, 100)
  }, [message.id])

  const renderContent = () => {
    if (message.type === "code" && message.filePath) {
      return (
        <div className="mt-4 bg-[#0d0d10] rounded-xl overflow-hidden border border-[#2e2e32] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 bg-[#161618] border-b border-[#2e2e32]">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#e94560]" />
              <span className="text-sm font-mono text-[#a0a0a0]">{message.filePath}</span>
            </div>
            <span className="text-xs text-[#666666]">CODE</span>
          </div>
          <pre className="p-4 text-sm overflow-x-auto bg-[#121215] text-[#d4d4d4]">
            <code>{message.content}</code>
          </pre>
        </div>
      )
    }

    if (message.type === "plan") {
      return (
        <div className="mt-4 bg-gradient-to-br from-[#1a1a1f] to-[#1f1f25] rounded-xl p-5 border border-[#3b82f6]/30 shadow-lg shadow-[#3b82f6]/5">
           <h4 className="font-semibold text-base mb-4 flex items-center gap-3 text-[#3b82f6]">
             <span className="p-1.5 bg-[#3b82f6]/20 rounded-lg">📋</span>
             Development Plan
           </h4>
           <div className="text-base whitespace-pre-wrap text-[#e5e5e5] leading-relaxed">{message.content}</div>
        </div>
      )
    }

    if (message.type === "phase") {
      const phaseName = message.phase ? message.phase.charAt(0).toUpperCase() + message.phase.slice(1) : "Phase"
      const phaseColors: Record<string, string> = {
        planning: "#f59e0b",
        coding: "#3b82f6",
        testing: "#10b981",
        fixing: "#ef4444"
      }
      const color = phaseColors[message.phase || ""] || "#888888"
      return (
         <div className="mt-4 bg-[#1a1a1f] rounded-xl p-5 border border-[#2e2e32]">
           <h4 className="font-semibold text-base mb-3 flex items-center gap-3">
             <span className="animate-pulse text-lg" style={{ color }}>●</span>
             <span style={{ color }}>{phaseName}</span>
             <span className="text-xs text-[#666666] font-normal ml-auto">PHASE</span>
           </h4>
           <div className="text-base whitespace-pre-wrap text-[#b0b0b0]">{message.content}</div>
         </div>
      )
    }

    if (message.type === "error") {
      return (
        <div className="mt-4 bg-gradient-to-br from-red-950/30 to-red-900/20 rounded-xl p-5 border border-red-500/30 shadow-lg shadow-red-500/10">
           <div className="flex items-center gap-3 mb-4">
             <AlertCircle className="h-5 w-5 text-red-500" />
             <span className="font-semibold text-base text-red-400">Error Detected</span>
             <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded ml-auto">FIXING</span>
           </div>
           <pre className="text-sm whitespace-pre-wrap text-red-300 leading-relaxed">{message.content}</pre>
        </div>
      )
    }

    if (message.type === "file") {
      return (
       <div className="mt-4 bg-gradient-to-br from-emerald-950/30 to-emerald-900/20 rounded-xl p-5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
           <div className="flex items-center gap-3 mb-2">
             <Check className="h-5 w-5 text-emerald-500" />
             <span className="font-semibold text-base text-emerald-400">File Created</span>
             <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded ml-auto">SUCCESS</span>
           </div>
           <p className="text-base mt-3 text-[#b0b0b0]">{message.content}</p>
         </div>
      )
    }

    if (message.type === "tool-call") {
      return null
    }

    if (message.type === "tool-result") {
      return null
    }

    const hasMarkdownTable = message.content.split('\n').some(line => line.trim().startsWith('|') && line.trim().endsWith('|'))
    const hasHtmlTable = message.content.includes('<table')
    
    if (hasMarkdownTable) {
      const lines = message.content.split('\n').filter(line => line.trim())
      const tableLines = lines.filter(line => line.trim().startsWith('|') || line.trim().endsWith('|') || line.trim().includes('|---'))
      
      if (tableLines.length > 1) {
        return (
          <div className="my-4 overflow-x-auto rounded-xl border border-[#2e2e32]">
            <table className="min-w-full divide-y divide-[#2e2e32]">
              <thead>
                <tr className="bg-[#1a1a1f]">
                  {tableLines[0].split('|').filter(cell => cell.trim()).map((cell, cellIdx) => (
                    <th 
                      key={cellIdx} 
                      className="px-4 py-3 text-left text-sm font-semibold text-[#e5e5e5]"
                    >
                      {cell.trim().replace(/\*\*/g, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e32] bg-[#121215]">
                {tableLines
                  .filter(line => line.trim() && !line.trim().startsWith('|---'))
                  .slice(1)
                  .map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-[#1a1a1f]/50">
                      {row.split('|').filter(cell => cell.trim()).map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-3 text-sm text-[#c5c5c5]">
                          {cell.trim().replace(/\*\*/g, '')}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )
      }
    }
    
    if (hasHtmlTable) {
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-[#2e2e32]">
          <div className="prose prose-base dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: message.content }} />
        </div>
      )
    }
    
    return (
      <div className="prose prose-base dark:prose-invert max-w-none 
        prose-headings:font-semibold prose-h3:font-semibold 
        prose-p:my-4 prose-p:leading-7 prose-p:text-[#d5d5d5]
        prose-ul:my-4 prose-ul:space-y-2 prose-ul:pl-2
        prose-ol:my-4 prose-ol:space-y-2 prose-ol:pl-2
        prose-li:my-1 prose-li:leading-7 prose-li:text-[#c5c5c5]
        prose-blockquote:border-l-4 prose-blockquote:border-[#e94560] prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:italic prose-blockquote:text-[#a0a0a0]
        prose-strong:text-[#e5e5e5] prose-strong:font-semibold
        prose-a:text-[#3b82f6] prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || "")
              if (match && match[1] === 'html') {
                return null
              }
              if (match && match[1] === 'text') {
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
              if (children && typeof children === 'string') {
                if (children.includes('```html')) {
                  return null
                }
                const htmlPatterns = ['<!DOCTYPE', '<html', '<head>', '<body>', '<div', '<script>', '<style>', 'className=', 'backgroundColor', 'paddingLeft', 'marginTop']
                const hasHtmlPattern = htmlPatterns.some(pattern => children.includes(pattern))
                if (hasHtmlPattern && children.length > 100) {
                  return null
                }
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

  const hasOnlyImage = message.imageUrl && !message.content && message.role !== "user"

  const renderUserContent = () => {
    if (isUser) {
      return (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || "")
              return match ? (
                <pre className="bg-[#1a1a1f] rounded-lg px-2 py-1 my-1 overflow-x-auto border border-[#2e2e32]">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-[#1a1a1f] rounded-lg px-1.5 py-0.5 font-mono" {...props}>
                  {children}
                </code>
              )
            },
            p: ({children}) => <p className="my-2 leading-relaxed">{children}</p>,
            ul: ({children}) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
            li: ({children}) => <li className="text-base">{children}</li>,
            strong: ({children}) => <strong className="font-semibold">{children}</strong>,
            a: ({href, children}) => <a href={href} className="text-[#3b82f6] hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
          }}
        >
          {message.content}
        </ReactMarkdown>
      )
    }
    return renderContent()
  }

  return (
    <div className="space-y-4 py-2 w-full">
      {!hasOnlyImage && (
      <div
        className={`px-4 py-2.5 text-[15px] leading-relaxed text-[#e5e5e5] ${
          isUser 
            ? "bg-[#2a2a2e] rounded-2xl max-w-[85%] self-end" 
            : "w-full max-w-full"
        }`}
      >
        <div className="min-w-0">
          {renderUserContent()}
        </div>
      </div>)}
      
      {/* Status / Loading indicator in chat area */}
      {!isUser && status && status !== "idle" && status !== "ready" && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-xl w-fit border border-[#2e2e32]">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#de0f17] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#de0f17] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#de0f17] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm font-medium text-[#e5e5e5]">
            {status === "planning" && "Planning your app..."}
            {status === "coding" && "Building your app..."}
            {status === "testing" && "Testing your app..."}
            {status === "fixing" && "Fixing issues..."}
          </span>
        </div>
      )}
      
      {/* Preview in chat - shown when there's a preview URL */}
      {previewUrl && !isUser && (
        <div className="mt-4 group relative overflow-hidden w-full bg-[#000000]" style={{ height: 'min(600px, 70vh)' }}>
          <PreviewIframe
            src={previewUrl}
            isActive={isActive}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          
          {/* Action buttons - visible on hover */}
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onSaveToGallery && (
              <button
                onClick={(e) => { e.stopPropagation(); onSaveToGallery(); }}
                className={`p-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                  hasSavedToGallery 
                    ? "bg-[#e94560] text-white" 
                    : "bg-[#1f1f23]/90 backdrop-blur-sm text-[#e5e5e5] hover:bg-[#e94560]"
                }`}
                title="Save to Gallery"
              >
                <FolderHeart className="h-4 w-4" />
              </button>
            )}
            {onDownload && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="p-2 bg-[#1f1f23]/90 backdrop-blur-sm rounded-lg text-[#e5e5e5] hover:bg-[#3b82f6] transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {onPreviewClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreviewClick(); }}
                className="p-2 bg-[#1f1f23]/90 backdrop-blur-sm rounded-lg text-[#e5e5e5] hover:bg-[#3b82f6] transition-colors"
                title="Expand"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image preview in chat - shown when there's an image URL */}
      {message.imageUrl && !isUser && (
        <div className="mt-4 group relative overflow-hidden w-full bg-[#000000]">
          <img
            src={message.imageUrl}
            alt="Generated image"
            className="w-full h-auto max-h-[500px] object-contain bg-[#0a0a0f]"
          />
          
          {/* Action buttons - visible on hover */}
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onImageSave && (
              <button
                onClick={(e) => { e.stopPropagation(); onImageSave(); }}
                className={`p-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                  hasImageSavedToGallery 
                    ? "bg-[#e94560] text-white" 
                    : "bg-[#1f1f23]/90 backdrop-blur-sm text-[#e5e5e5] hover:bg-[#e94560]"
                }`}
                title="Save to Gallery"
              >
                <FolderHeart className="h-4 w-4" />
              </button>
            )}
            {onImageDownload && (
              <button
                onClick={(e) => { e.stopPropagation(); onImageDownload(); }}
                className="p-2 bg-[#1f1f23]/90 backdrop-blur-sm rounded-lg text-[#e5e5e5] hover:bg-[#3b82f6] transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {onImageOpen && (
              <button
                onClick={(e) => { e.stopPropagation(); onImageOpen(); }}
                className="p-2 bg-[#1f1f23]/90 backdrop-blur-sm rounded-lg text-[#e5e5e5] hover:bg-[#3b82f6] transition-colors"
                title="Open in Preview"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Audio preview in chat - shown when there's an audio URL */}
      {message.audioUrl && !isUser && (
        <div className="mt-4 group relative overflow-hidden w-full bg-[#000000]">
          <audio
            controls
            className="w-full h-12 rounded-lg"
            src={message.audioUrl}
          />
        </div>
      )}
    </div>
  )
})
