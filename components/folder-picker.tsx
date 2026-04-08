"use client"

import { useEffect } from "react"
import { Folder } from "lucide-react"

interface FolderPickerProps {
  folderPath: string
}

export function FolderPicker({ folderPath }: FolderPickerProps) {
  useEffect(() => {
    if (folderPath) {
      console.log("Using session folder:", folderPath)
    }
  }, [folderPath])

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Project Storage Location</label>
      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
        <Folder className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-sm flex-1 truncate">{folderPath || "Creating session..."}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {folderPath
          ? "Projects will be saved in this folder"
          : "Creating auto-generated session folder..."}
      </p>
    </div>
  )
}