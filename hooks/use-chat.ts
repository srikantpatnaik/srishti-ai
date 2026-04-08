"use client"

import { useState, useCallback, useEffect } from "react"
import { useChat as useVercelChat, Message } from "@ai-sdk/react"

interface ChatMessage extends Message {
  type?: "text" | "code" | "error" | "plan" | "file"
  filePath?: string
  language?: string
}

type Status = "idle" | "planning" | "coding" | "testing" | "fixing" | "ready" | "error"

interface File {
  path: string
  content: string
}

export function useChat() {
  const [isAutonomous, setIsAutonomous] = useState(true)
  const [status, setStatus] = useState<Status>("idle")
  const [previewUrl, setPreviewUrl] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const {
    messages,
    setMessages,
    input,
    setInput,
    append,
    isLoading: isGenerating,
  } = useVercelChat({
    api: "/api/chat",
    body: {
      isAutonomous,
    },
  })

  const toggleAutonomous = useCallback(() => {
    setIsAutonomous((prev) => !prev)
  }, [])

  const stopGeneration = useCallback(() => {
    // Stop the generation by clearing input and stopping the stream
    setInput("")
    setMessages(messages.map((m) => ({
      ...m,
      content: m.content + "\n\n[Generation stopped]",
    })))
    setStatus("idle")
  }, [input, messages, setMessages])

  // Process tool results and update state
  const processToolResults = useCallback((content: string) => {
    try {
      const data = JSON.parse(content)
      
      if (data.type === "status") {
        setStatus(data.status as Status)
      }
      
      if (data.type === "preview" && data.url) {
        setPreviewUrl(data.url)
      }
      
      if (data.type === "file") {
        setFiles((prev) => {
          const existing = prev.findIndex((f) => f.path === data.path)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = { path: data.path, content: data.content }
            return updated
          }
          return [...prev, { path: data.path, content: data.content }]
        })
      }
    } catch (e) {
      // Not a JSON message, ignore
    }
  }, [])

  // Monitor messages for tool results
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "assistant") {
        processToolResults(lastMessage.content)
      }
    }
  }, [messages, processToolResults])

  return {
    messages,
    input,
    setInput,
    isGenerating,
    isAutonomous,
    toggleAutonomous,
    stopGeneration,
    previewUrl,
    setPreviewUrl,
    status,
    files,
    append,
  }
}