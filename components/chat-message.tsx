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
  onSuggestionClick?: (suggestion: string) => void
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
  onSuggestionClick,
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

    const hasMarkdownTable = message.content.split('\n').some(line => line.trim().startsWith('|'))
    const hasHtmlTable = message.content.includes('<table')

    if (hasMarkdownTable || hasHtmlTable) {
      let contentToParse = message.content

      if (hasHtmlTable) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(contentToParse, 'text/html')
        const table = doc.querySelector('table')
        if (table) {
          const rows = Array.from(table.querySelectorAll('tr'))
          const markdownRows = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent?.trim() || '')
            return '|' + cells.join('|') + '|'
          })
          if (markdownRows.length > 1) {
            markdownRows.splice(1, 0, '|' + '|---|'.repeat(markdownRows[0].split('|').length - 2) + '|')
            contentToParse = markdownRows.join('\n')
          }
        }
      }

      const lines = contentToParse.split('\n').filter(line => line.trim())
      const tableLines = lines.filter(line => line.trim().startsWith('|') || line.trim().includes('|---'))

      if (tableLines.length > 1 && tableLines.some(line => line.trim().includes('|---'))) {
        const processCell = (cell: string) => {
          let text = cell.trim()
          text = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #a78bfa; font-weight: 600;">$1</strong>')
          text = text.replace(/\*(.*?)\*/g, '<em style="color: #2dd4bf;">$1</em>')
          text = text.replace(/`([^`]+)`/g, '<code style="background: rgba(45, 212, 191, 0.1); color: #2dd4bf; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(45, 212, 191, 0.2); font-family: monospace; font-size: 0.9em;">$1</code>')
          return text
        }

        const headerCells = tableLines[0].split('|').filter(cell => cell.trim()).map((cell, idx) => (
          <th
            key={idx}
            style={{
              padding: "16px 24px",
              textAlign: "left",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#a0a0a0",
              borderBottom: "2px solid rgba(46, 46, 50, 0.8)",
              borderRight: "1px solid rgba(46, 46, 50, 0.5)",
              background: "#161618",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: processCell(cell) }} />
          </th>
        ))

        const bodyRows = tableLines
          .filter(line => line.trim() && !line.trim().startsWith('|---'))
          .slice(1)
          .map((row, rowIdx) => {
            const cells = row.split('|').filter(cell => cell.trim()).map((cell, cellIdx) => (
              <td
                key={cellIdx}
                style={{
                  padding: "16px 24px",
                  fontSize: "15px",
                  color: "#d4d4d4",
                  borderBottom: "1px solid rgba(46, 46, 50, 0.5)",
                  borderRight: "1px solid rgba(46, 46, 50, 0.3)",
                  backgroundColor: rowIdx % 2 === 1 ? '#0d0d10' : '#121215',
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1a1a1f"
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(46, 46, 50, 0.3)"
                  e.currentTarget.style.transform = "scale(1.002)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = ""
                  e.currentTarget.style.boxShadow = ""
                  e.currentTarget.style.transform = ""
                  e.currentTarget.style.backgroundColor = rowIdx % 2 === 1 ? '#0d0d10' : '#121215'
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: processCell(cell) }} />
              </td>
            ))
            return (
              <tr
                key={rowIdx}
                style={{
                  borderBottom: rowIdx === tableLines.filter(l => l.trim() && !l.trim().startsWith('|---')).length - 1 ? 'none' : '1px solid rgba(167, 139, 250, 0.15)'
                }}
              >
                {cells}
              </tr>
            )
          })

        return (
          <div style={{
            margin: "24px 0",
            width: "100%",
            overflowX: "auto",
            borderRadius: "16px",
            background: "#0d0d10",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(46, 46, 50, 0.5) inset"
          }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", minWidth: "400px" }}>
              <thead>
                <tr>
                  {headerCells}
                </tr>
              </thead>
              <tbody>
                {bodyRows}
              </tbody>
            </table>
          </div>
        )
      }
    }
     
     return (
      <div className="prose prose-base dark:prose-invert max-w-none 
        prose-headings:text-[#e5e5e5] prose-headings:font-semibold prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-[#e94560] prose-h3:border-b prose-h3:border-[#1a1a1a] prose-h3:pb-2
        prose-p:my-3 prose-p:leading-7 prose-p:text-[#d4d4d4] prose-p:text-[15px]
        prose-ul:my-4 prose-ul:space-y-2 prose-ul:pl-5 prose-ul:list-disc
        prose-ol:my-4 prose-ol:space-y-2 prose-ol:pl-5 prose-ol:list-decimal
        prose-li:my-1.5 prose-li:leading-7 prose-li:text-[#b8b8b8] prose-li:text-[15px]
        prose-strong:text-[#e5e5e5] prose-strong:font-semibold
        prose-a:text-[#3b82f6] prose-a:no-underline hover:prose-a:text-[#60a5fa] prose-a:transition-colors
        prose-code:text-[#4ecdc4] prose-code:bg-[#0f0f0f] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:border prose-code:border-[#1a1a1a]
        prose-hr:border-[#1a1a1a] prose-hr:my-6">
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
                <pre style={{
                  backgroundColor: "#0f3460",
                  borderRadius: "12px",
                  padding: "20px",
                  margin: "16px 0",
                  overflowX: "auto",
                  border: "2px solid",
                  borderImage: "linear-gradient(135deg, #e94560, #4ecdc4) 1",
                  boxShadow: "0 0 20px rgba(233, 69, 96, 0.2)"
                }}>
                  <code style={{...props, color: "#4ecdc4", fontFamily: "monospace", fontSize: "14px"}}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code style={{
                  backgroundColor: "#0f3460",
                  color: "#4ecdc4",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #4ecdc4",
                  fontFamily: "monospace",
                  fontSize: "14px"
                }} {...props}>
                  {children}
                </code>
              )
            },
            h2: ({children}) => (
              <h2 style={{
                fontSize: "28px",
                fontWeight: "normal",
                marginTop: "32px",
                marginBottom: "24px",
                padding: "16px 20px",
                borderLeft: "6px solid #e94560",
                backgroundColor: "#16213e",
                color: "#e0e0e0",
                borderRadius: "0 12px 12px 0",
                boxShadow: "0 4px 12px rgba(233, 69, 96, 0.2)"
              }}>
                {children}
              </h2>
            ),
            h3: ({children}) => (
              <h3 style={{
                fontSize: "22px",
                fontWeight: "normal",
                marginTop: "24px",
                marginBottom: "16px",
                padding: "12px 16px",
                borderLeft: "4px solid #4ecdc4",
                backgroundColor: "#1a1a2e",
                color: "#e0e0e0",
                borderRadius: "0 8px 8px 0"
              }}>
                {children}
              </h3>
            ),
            ul: ({children}) => (
              <ul style={{
                listStyleType: "disc",
                listStylePosition: "inside",
                marginTop: "20px",
                marginBottom: "20px",
                paddingLeft: "24px",
                borderLeft: "4px solid #4ecdc4",
                color: "#b8b8b8"
              }}>
                {children}
              </ul>
            ),
            ol: ({children}) => (
              <ol style={{
                listStyleType: "decimal",
                listStylePosition: "inside",
                marginTop: "20px",
                marginBottom: "20px",
                paddingLeft: "24px",
                borderLeft: "4px solid #ffe66d",
                color: "#b8b8b8"
              }}>
                {children}
              </ol>
            ),
            li: ({children}) => (
              <li style={{
                fontSize: "15px",
                marginTop: "8px",
                marginBottom: "8px",
                lineHeight: "1.8",
                color: "#b8b8b8"
              }}>
                {children}
              </li>
            ),
            p: ({children}) => (
              <p style={{
                fontSize: "15px",
                marginTop: "16px",
                marginBottom: "16px",
                lineHeight: "1.8",
                color: "#e0e0e0"
              }}>
                {children}
              </p>
            ),
            blockquote: ({children}) => (
              <blockquote style={{
                borderLeft: "6px solid #4ecdc4",
                paddingLeft: "24px",
                paddingTop: "16px",
                paddingBottom: "16px",
                fontStyle: "italic",
                color: "#e0e0e0",
                backgroundColor: "#16213e",
                borderRadius: "0 12px 12px 0",
                margin: "16px 0",
                boxShadow: "0 4px 12px rgba(78, 205, 196, 0.2)"
              }}>
                {children}
              </blockquote>
            ),
            a: ({href, children}) => (
              <a href={href} style={{
                color: "#4ecdc4",
                textDecoration: "underline",
                transition: "all 0.3s",
                fontSize: "16px"
              }} 
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffe66d"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#4ecdc4"}
              target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            hr: () => (
              <hr style={{
                border: "none",
                borderTop: "2px solid #0f3460",
                marginTop: "32px",
                marginBottom: "32px"
              }} />
            ),
            div: ({children, ...props}) => {
              if (children && typeof children === 'string') {
                if (children.includes('```html')) {
                  return null
                }
                const dangerousPatterns = ['<!DOCTYPE html>', '<html ', '<head>', '<body>', '<script>', '<style>']
                const hasDangerousPattern = dangerousPatterns.some(pattern => children.includes(pattern))
                if (hasDangerousPattern) {
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
            p: ({children}) => <p className="my-0 leading-relaxed whitespace-pre-wrap">{children}</p>,
            ul: ({children}) => <ul className="list-disc list-inside my-1 space-y-1">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal list-inside my-1 space-y-1">{children}</ol>,
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
        className={`px-3 py-2 text-[15px] text-[#e5e5e5] break-words ${
          isUser 
            ? "bg-[#2a2a2e] rounded-2xl self-end break-words inline-block text-right" 
            : "w-full"
        }`}
      >
       <div className="min-w-0">
           {renderUserContent()}
         </div>
      </div>)}
      
      {/* Status / Loading indicator in chat area */}
      {!isUser && status && status !== "idle" && status !== "ready" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-xl w-fit border border-[#2e2e32]">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#de0f17] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#de0f17] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#de0f17] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs font-medium text-[#e5e5e5]">
            {status === "planning" && "Planning..."}
            {status === "coding" && "Building..."}
            {status === "testing" && "Testing..."}
            {status === "fixing" && "Fixing..."}
            {status === "generating_image" && "Generating..."}
            {status === "generating" && "Thinking..."}
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
            className="w-full h-auto max-h-[500px] object-contain bg-[#0a0a0f] cursor-pointer"
            onClick={() => onImageOpen?.()}
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
