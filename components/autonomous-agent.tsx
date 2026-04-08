"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Square, FileCode, CheckCircle2, AlertCircle, Terminal, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type AgentStatus = "idle" | "planning" | "coding" | "testing" | "fixing" | "ready" | "error"

interface AgentStep {
  id: string
  type: "plan" | "code" | "test" | "fix"
  status: "pending" | "running" | "completed" | "error"
  title: string
  details?: string
}

interface GeneratedFile {
  path: string
  content: string
  language: string
}

interface ConsoleMessage {
  type: "log" | "error" | "warn"
  message: string
  timestamp: string
}

export function AutonomousAgent() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<AgentStatus>("idle")
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
  const [currentError, setCurrentError] = useState<string | null>(null)

  const addStep = useCallback((step: AgentStep) => {
    setSteps((prev) => [...prev, step])
  }, [])

  const updateStepStatus = useCallback((stepId: string, status: AgentStep["status"], details?: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, status, details } : s
      )
    )
  }, [])

  const addConsoleMessage = useCallback((type: ConsoleMessage["type"], message: string) => {
    setConsoleMessages((prev) => [
      ...prev,
      {
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }, [])

  const runAgent = useCallback(async () => {
    setIsRunning(true)
    setStatus("planning")
    setSteps([])
    setFiles([])
    setConsoleMessages([])
    setCurrentError(null)

    // Step 1: Planning
    const planStep: AgentStep = {
      id: "plan-1",
      type: "plan",
      status: "running",
      title: "Analyzing requirements and creating development plan",
    }
    addStep(planStep)

    // Simulate planning
    await new Promise((resolve) => setTimeout(resolve, 1000))
    updateStepStatus(planStep.id, "completed", "Plan created with 5 components")

    // Step 2: Coding
    setStatus("coding")
    const codeStep: AgentStep = {
      id: "code-1",
      type: "code",
      status: "running",
      title: "Generating application code",
    }
    addStep(codeStep)

    // Simulate code generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const generatedFiles: GeneratedFile[] = [
      {
        path: "app/page.tsx",
        content: "export default function Home() { return <div>App</div> }",
        language: "typescript",
      },
      {
        path: "app/layout.tsx",
        content: "export default function Layout({children}) { return <html><body>{children}</body></html> }",
        language: "typescript",
      },
    ]
    setFiles(generatedFiles)
    updateStepStatus(codeStep.id, "completed", `Generated ${generatedFiles.length} files`)

    // Step 3: Testing
    setStatus("testing")
    const testStep: AgentStep = {
      id: "test-1",
      type: "test",
      status: "running",
      title: "Running tests",
    }
    addStep(testStep)

    await new Promise((resolve) => setTimeout(resolve, 1500))
    updateStepStatus(testStep.id, "completed", "All tests passed")

    // Step 4: Ready
    setStatus("ready")
    setIsRunning(false)
    addConsoleMessage("log", "Application built successfully!")
  }, [addStep, updateStepStatus, addConsoleMessage])

  const stopAgent = useCallback(() => {
    setIsRunning(false)
    setStatus("idle")
  }, [])

  const retryFromError = useCallback(async () => {
    if (currentError) {
      setStatus("fixing")
      const fixStep: AgentStep = {
        id: `fix-${Date.now()}`,
        type: "fix",
        status: "running",
        title: `Fixing: ${currentError.substring(0, 50)}...`,
      }
      addStep(fixStep)

      await new Promise((resolve) => setTimeout(resolve, 2000))
      updateStepStatus(fixStep.id, "completed", "Error fixed")
      setCurrentError(null)
      setStatus("ready")
    }
  }, [currentError, addStep, updateStepStatus])

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Autonomous Agent</span>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning && status === "idle" && (
            <Button size="sm" onClick={runAgent}>
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}
          {isRunning && (
            <Button size="sm" variant="destructive" onClick={stopAgent}>
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          )}
          {status === "ready" && (
            <Button size="sm" variant="secondary" onClick={runAgent}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Rebuild
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-2 text-sm">
          {status === "planning" && (
            <>
              <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
              <span className="text-blue-600">Planning...</span>
            </>
          )}
          {status === "coding" && (
            <>
              <FileCode className="h-3 w-3 animate-pulse text-purple-500" />
              <span className="text-purple-600">Coding...</span>
            </>
          )}
          {status === "testing" && (
            <>
              <CheckCircle2 className="h-3 w-3 animate-pulse text-green-500" />
              <span className="text-green-600">Testing...</span>
            </>
          )}
          {status === "fixing" && (
            <>
              <AlertCircle className="h-3 w-3 animate-pulse text-red-500" />
              <span className="text-red-600">Fixing errors...</span>
            </>
          )}
          {status === "ready" && (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Ready for deployment</span>
            </>
          )}
          {status === "idle" && (
            <span className="text-muted-foreground">Idle - Ready to start</span>
          )}
        </div>
      </div>

      {/* Steps */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {steps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Click Start to begin autonomous development
            </div>
          )}
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-background"
            >
              <div className="mt-0.5">
                {step.status === "running" && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {step.status === "completed" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                {step.status === "pending" && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{step.title}</div>
                {step.details && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.details}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Files Generated */}
      {files.length > 0 && (
        <div className="border-t p-4 bg-muted/20">
          <div className="text-xs font-medium mb-2">Generated Files ({files.length})</div>
          <div className="flex flex-wrap gap-1">
            {files.map((file, i) => (
              <span
                key={file.path}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs"
              >
                <FileCode className="h-3 w-3" />
                {file.path}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Console */}
      <div className="border-t bg-black p-2">
        <div className="text-xs text-gray-500 mb-1">Console</div>
        <div className="space-y-1 max-h-20 overflow-y-auto">
          {consoleMessages.map((msg, i) => (
            <div
              key={i}
              className={`text-xs ${
                msg.type === "error"
                  ? "text-red-400"
                  : msg.type === "warn"
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              <span className="text-gray-600">[{msg.timestamp}]</span>{" "}
              {msg.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}