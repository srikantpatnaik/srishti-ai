"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, ExternalLink, Download } from "lucide-react"
import JSZip from "jszip"

interface PreviewPanelProps {
  previewUrl: string
  onConsoleMessage: (msg: string) => void
  stopAutoReload?: boolean
}

export function PreviewPanel({ previewUrl, onConsoleMessage, stopAutoReload = false }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "console") {
        const msg = `[${event.data.level}] ${event.data.message}`
        if (event.data.level === "error") {
          onConsoleMessage(msg)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onConsoleMessage])

  useEffect(() => {
    const handleInteract = () => {
      setHasUserInteracted(true)
    }

    window.addEventListener('mousedown', handleInteract)
    window.addEventListener('touchstart', handleInteract)
    window.addEventListener('keydown', handleInteract)

    return () => {
      window.removeEventListener('mousedown', handleInteract)
      window.removeEventListener('touchstart', handleInteract)
      window.removeEventListener('keydown', handleInteract)
    }
  }, [])

  useEffect(() => {
    if (stopAutoReload || !isLoaded) {
      return
    }

    const interval = setInterval(() => {
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isLoaded, stopAutoReload])

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  if (!previewUrl) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 h-full bg-card relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => window.open(previewUrl, '_blank')}
            className="p-1.5 bg-card/30 backdrop-blur-xl rounded-md border border-card-foreground/5 hover:bg-card/40 transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={async () => {
              try {
                const zip = new JSZip()
                const response = await fetch(previewUrl)
                const html = await response.text()
                const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
                const appName = titleMatch ? titleMatch[1].trim() : 'offline-app'
                const safeAppName = appName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
                zip.file("index.html", html)
                const cssMatches = html.match(/<link[^>]*href=["']([^"']*)\.css["'][^>]*>/g) || []
                const jsMatches = html.match(/<script[^>]*src=["']([^"']*)\.js["'][^>]*>/g) || []
                const baseUrl = new URL(previewUrl)
                for (const match of cssMatches) {
                  const hrefMatch = match.match(/href=["']([^"']*)["']/)
                  if (hrefMatch) {
                    const href = hrefMatch[1]
                    if (!href.startsWith('http')) {
                      const cssUrl = new URL(href, previewUrl).href
                      try {
                        const cssRes = await fetch(cssUrl)
                        const cssText = await cssRes.text()
                        zip.file(`css/${href}`, cssText)
                      } catch (e) { console.error('Failed to fetch CSS:', href, e) }
                    }
                  }
                }
                for (const match of jsMatches) {
                  const srcMatch = match.match(/src=["']([^"']*)["']/)
                  if (srcMatch) {
                    const src = srcMatch[1]
                    if (!src.startsWith('http')) {
                      const jsUrl = new URL(src, previewUrl).href
                      try {
                        const jsRes = await fetch(jsUrl)
                        const jsText = await jsRes.text()
                        zip.file(`js/${src}`, jsText)
                      } catch (e) { console.error('Failed to fetch JS:', src, e) }
                    }
                  }
                }
                const imageMatches = html.match(/<img[^>]*src=["']([^"']*)["'][^>]*>/g) || []
                const imgUrls = new Set<string>()
                for (const match of imageMatches) {
                  const srcMatch = match.match(/src=["']([^"']*)["']/)
                  if (srcMatch) {
                    const src = srcMatch[1]
                    if (!src.startsWith('http') && !src.startsWith('data:')) {
                      imgUrls.add(new URL(src, previewUrl).href)
                    }
                  }
                }
                const faviconMatches = html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']*)["'][^>]*>/g) || []
                for (const match of faviconMatches) {
                  const hrefMatch = match.match(/href=["']([^"']*)["']/)
                  if (hrefMatch) {
                    const href = hrefMatch[1]
                    if (!href.startsWith('http') && !href.startsWith('data:')) {
                      imgUrls.add(new URL(href, previewUrl).href)
                    }
                  }
                }
                for (const imgUrl of imgUrls) {
                  try {
                    const imgRes = await fetch(imgUrl)
                    const blob = await imgRes.blob()
                    const imgName = imgUrl.split('/').pop() || 'image.png'
                    zip.file(`images/${imgName}`, blob)
                  } catch (e) { console.error('Failed to fetch image:', imgUrl, e) }
                }
                const zipBlob = await zip.generateAsync({ type: "blob" })
                const url = URL.createObjectURL(zipBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = `${safeAppName}.zip`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              } catch (error) {
                console.error('Failed to download:', error)
                alert('Download failed. Try opening in a new tab and saving the page manually.')
              }
            }}
            className="p-1.5 bg-card/30 backdrop-blur-xl rounded-md border border-card-foreground/5 hover:bg-card/40 transition-all"
            title="Download as offline app"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Waiting for preview</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          onLoad={() => {
            setIsLoaded(true)
            setIsLoading(false)
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allow="fullscreen"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  )
}
