"use client"

import { useCallback, useState } from "react"
import { AlertCircle, Send, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ErrorFixerProps {
  onFix: (error: string) => void
  onErrorDetected: (error: string) => void
}

export function ErrorFixer({ onFix, onErrorDetected }: ErrorFixerProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [selectedError, setSelectedError] = useState<string>("")
  const [isFixing, setIsFixing] = useState(false)

  const addError = useCallback((error: string) => {
    setErrors((prev) => [...prev, error])
    onErrorDetected(error)
  }, [onErrorDetected])

  const fixSelectedError = useCallback(async () => {
    if (!selectedError) return

    setIsFixing(true)
    
    // Simulate fixing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    onFix(selectedError)
    setErrors((prev) => prev.filter((e) => e !== selectedError))
    setSelectedError("")
    setIsFixing(false)
  }, [selectedError, onFix])

  const autoFixAll = useCallback(async () => {
    for (const error of errors) {
      setIsFixing(true)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      onFix(error)
    }
    setErrors([])
    setIsFixing(false)
  }, [errors, onFix])

  const clearErrors = useCallback(() => {
    setErrors([])
    setSelectedError("")
  }, [])

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="font-medium text-sm">Error Fixer</span>
          {errors.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {errors.length}
            </span>
          )}
        </div>
        {errors.length > 0 && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={autoFixAll} disabled={isFixing}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isFixing ? "animate-spin" : ""}`} />
              Auto Fix All
            </Button>
            <Button size="sm" variant="ghost" onClick={clearErrors}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Errors List */}
      <div className="flex-1 overflow-y-auto p-4">
        {errors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No errors detected</p>
            <p className="text-xs mt-1">Errors from preview console will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedError === error
                    ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700"
                    : "bg-muted border-border hover:border-red-300"
                }`}
                onClick={() => setSelectedError(error)}
              >
                <div className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                  {error}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fix Action */}
      {selectedError && (
        <div className="border-t p-4 bg-muted/20">
          <Button
            className="w-full"
            onClick={fixSelectedError}
            disabled={isFixing}
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Fix This Error
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI will analyze and automatically fix the error
          </p>
        </div>
      )}

      {/* Expose addError method via custom event */}
      <ErrorReceiver onAddError={addError} />
    </div>
  )
}

// Helper component to receive errors from other components
function ErrorReceiver({ onAddError }: { onAddError: (error: string) => void }) {
  useCallback(() => {
    const handler = (event: CustomEvent) => {
      onAddError(event.detail)
    }
    window.addEventListener("addErrorToFixer" as any, handler as any)
    return () => {
      window.removeEventListener("addErrorToFixer" as any, handler as any)
    }
  }, [onAddError])

  return null
}