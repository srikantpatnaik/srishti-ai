"use client"

import React, { useEffect, useRef, useState } from "react"
import { Play, Download, X, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import JSZip from "jszip"

interface LocalPreviewProps {
  code: string
  onClose: () => void
}

export function LocalPreview({ code, onClose }: LocalPreviewProps) {
  const [previewKey, setPreviewKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const blobUrlRef = useRef<string>("")

  useEffect(() => {
    generatePreview()
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [code])

  const generatePreview = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Local Preview</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            padding: 20px;
            background: #f5f5f5;
          }
          .app-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
            min-height: 400px;
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          ${code}
        </div>
        <script>
          window.parent.postMessage({ type: 'loaded' }, '*');
        <\/script>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    blobUrlRef.current = URL.createObjectURL(blob)
    setPreviewKey(Date.now())
  }

  const downloadApp = async () => {
    const zip = new JSZip()
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My App</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f5f5;
          }
          .app-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          ${code}
        </div>
      </body>
      </html>
    `

    zip.file("index.html", htmlContent)
    
    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url
    a.download = "my-app.zip"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-green-500" />
          <span className="font-medium text-sm">Local Preview (Offline)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={downloadApp}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-muted/20 p-4 flex items-center justify-center">
        <div className="w-full max-w-[800px] h-full bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            key={previewKey}
            ref={iframeRef}
            src={blobUrlRef.current}
            className="w-full h-full"
            title="Local Preview"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3 bg-card text-center">
        <p className="text-xs text-muted-foreground">
          Running locally in browser • No server needed • Works offline
        </p>
      </div>
    </div>
  )
}
