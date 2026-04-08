"use client"

import { useState } from "react"
import { Folder, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FolderPickerProps {
  onSelectFolder: (path: string) => void
}

export function FolderPicker({ onSelectFolder }: FolderPickerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [isPicking, setIsPicking] = useState(false)

  const openFolderPicker = async () => {
    if (!("showDirectoryPicker" in window)) {
      alert("File System Access API not supported in this browser. Please use Chrome, Edge, or Safari.")
      return
    }

    setIsPicking(true)
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
      })

      const path = handle.name
      setSelectedPath(path)
      onSelectFolder(path)
    } catch (error) {
      console.error("Error selecting folder:", error)
    } finally {
      setIsPicking(false)
    }
  }

  const clearSelection = () => {
    setSelectedPath(null)
    onSelectFolder("")
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Project Storage Location</label>
      {selectedPath ? (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <Folder className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm flex-1 truncate">{selectedPath}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearSelection}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={openFolderPicker}
          disabled={isPicking}
        >
          <Folder className="h-4 w-4 mr-2" />
          {isPicking ? "Selecting..." : "Select Folder"}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        {selectedPath
          ? "Projects will be saved in this folder"
          : "Choose where to store your generated projects"}
      </p>
    </div>
  )
}