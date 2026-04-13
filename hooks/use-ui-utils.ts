import { useState, useEffect } from "react"

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString())
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return { darkMode, setDarkMode }
}

export function useKeyboardShortcuts(
  showSettings: boolean,
  setShowSettings: (val: boolean) => void,
  showPreview: boolean,
  setShowPreview: (val: boolean) => void,
  showAppDrawer: boolean,
  setShowAppDrawer: (val: boolean) => void,
  setContextMenu: (val: any) => void,
  setLongPressedApp: (val: any) => void,
  savedApps: any[] = [],
  galleryIndex: number = 0,
  setGalleryIndex?: (val: number) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAppDrawer && setGalleryIndex) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          setGalleryIndex(galleryIndex <= 0 ? savedApps.length - 1 : galleryIndex - 1)
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          setGalleryIndex(galleryIndex >= savedApps.length - 1 ? 0 : galleryIndex + 1)
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          if (savedApps[galleryIndex]) {
            setShowAppDrawer(false)
          }
        }
      }
      if (e.ctrlKey && e.key === 'b' && !e.altKey) {
        e.preventDefault()
        setShowSettings(!showSettings)
      }
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault()
        setShowPreview(!showPreview)
      }
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault()
        setShowAppDrawer(!showAppDrawer)
      }
      if (e.key === 'Escape' && showAppDrawer) {
        e.preventDefault()
        setShowAppDrawer(false)
        setContextMenu(null)
        setLongPressedApp(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, showPreview, showAppDrawer, setShowSettings, setShowPreview, setShowAppDrawer, setContextMenu, setLongPressedApp, galleryIndex, setGalleryIndex, savedApps.length])
}

export function useResizing(setPreviewWidth: (val: number) => void, setIsResizing: (val: boolean) => void) {
  const handleMouseDown = () => {
    setIsResizing(true)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = (e: MouseEvent) => {
    const percentage = ((window.innerWidth - e.clientX) / window.innerWidth) * 100
    if (percentage >= 20 && percentage <= 80) {
      setPreviewWidth(percentage)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  return { handleMouseDown }
}
