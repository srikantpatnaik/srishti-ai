"use client"

import { useState, useCallback } from "react"
import { AlertCircle, CheckCircle2, GitCommit, Upload, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeploymentStatus {
  status: "pending" | "building" | "testing" | "ready" | "deployed" | "error"
  message: string
  progress: number
}

interface DeploymentChecklist {
  testsPassed: boolean
  buildSuccessful: boolean
  noErrors: boolean
  documentationReady: boolean
  performanceOk: boolean
}

export function DeploymentPanel() {
  const [status, setStatus] = useState<DeploymentStatus>({
    status: "pending",
    message: "Ready to deploy",
    progress: 0,
  })

  const [checklist, setChecklist] = useState<DeploymentChecklist>({
    testsPassed: false,
    buildSuccessful: false,
    noErrors: false,
    documentationReady: false,
    performanceOk: false,
  })

  const checkDeploymentReady = useCallback(() => {
    const allReady = Object.values(checklist).every(Boolean)
    return allReady
  }, [checklist])

  const runPreDeploymentChecks = useCallback(async () => {
    setStatus({ status: "building", message: "Running pre-deployment checks...", progress: 10 })

    // Simulate checks
    await new Promise((resolve) => setTimeout(resolve, 500))
    setChecklist((prev) => ({ ...prev, noErrors: true }))
    setStatus((prev) => ({ ...prev, progress: 30 }))

    await new Promise((resolve) => setTimeout(resolve, 500))
    setChecklist((prev) => ({ ...prev, testsPassed: true }))
    setStatus((prev) => ({ ...prev, progress: 50 }))

    await new Promise((resolve) => setTimeout(resolve, 500))
    setChecklist((prev) => ({ ...prev, buildSuccessful: true }))
    setStatus((prev) => ({ ...prev, progress: 70 }))

    await new Promise((resolve) => setTimeout(resolve, 500))
    setChecklist((prev) => ({ ...prev, documentationReady: true }))
    setStatus((prev) => ({ ...prev, progress: 85 }))

    await new Promise((resolve) => setTimeout(resolve, 500))
    setChecklist((prev) => ({ ...prev, performanceOk: true }))
    setStatus({ status: "ready", message: "All checks passed! Ready to deploy", progress: 100 })
  }, [])

  const deploy = useCallback(async () => {
    setStatus({ status: "building", message: "Deploying to production...", progress: 50 })
    
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setStatus({ status: "deployed", message: "Successfully deployed!", progress: 100 })
  }, [])

  const reset = useCallback(() => {
    setStatus({ status: "pending", message: "Ready to deploy", progress: 0 })
    setChecklist({
      testsPassed: false,
      buildSuccessful: false,
      noErrors: false,
      documentationReady: false,
      performanceOk: false,
    })
  }, [])

  const isReady = checkDeploymentReady()

  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Deployment</span>
        </div>
        {status.status === "deployed" && (
          <Button size="sm" variant="ghost" onClick={reset}>
            <GitCommit className="h-3 w-3 mr-1" />
            New Deploy
          </Button>
        )}
      </div>

      {/* Status */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          {status.status === "building" && (
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
          {status.status === "ready" && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          {status.status === "deployed" && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
          {status.status === "error" && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          {status.status === "pending" && (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
          <span className={`font-medium ${
            status.status === "deployed" ? "text-green-600" :
            status.status === "error" ? "text-red-600" :
            status.status === "ready" ? "text-green-600" :
            "text-foreground"
          }`}>
            {status.message}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          <ChecklistItem
            icon={CheckCircle2}
            label="All tests passed"
            checked={checklist.testsPassed}
            description="Unit and integration tests"
          />
          <ChecklistItem
            icon={Package}
            label="Build successful"
            checked={checklist.buildSuccessful}
            description="Production build completed"
          />
          <ChecklistItem
            icon={AlertCircle}
            label="No errors"
            checked={checklist.noErrors}
            description="Console and code errors"
          />
          <ChecklistItem
            icon={GitCommit}
            label="Documentation ready"
            checked={checklist.documentationReady}
            description="README and API docs"
          />
          <ChecklistItem
            icon={Upload}
            label="Performance OK"
            checked={checklist.performanceOk}
            description="Lighthouse score > 90"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-4 space-y-2">
        {status.status === "pending" && (
          <Button className="w-full" onClick={runPreDeploymentChecks}>
            <Package className="h-4 w-4 mr-2" />
            Run Pre-deployment Checks
          </Button>
        )}

        {status.status === "ready" && (
          <Button className="w-full" onClick={deploy}>
            <Upload className="h-4 w-4 mr-2" />
            Deploy to Production
          </Button>
        )}

        {status.status === "building" && (
          <Button className="w-full" disabled>
            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
            Processing...
          </Button>
        )}

        {status.status === "deployed" && (
          <div className="text-center text-sm text-green-600">
            ✓ Application is live
          </div>
        )}
      </div>
    </div>
  )
}

function ChecklistItem({
  icon: Icon,
  label,
  checked,
  description,
}: {
  icon: any
  label: string
  checked: boolean
  description: string
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        checked
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
          : "bg-muted border-border"
      }`}
    >
      <div className={`mt-0.5 ${checked ? "text-green-500" : "text-muted-foreground"}`}>
        {checked ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium ${checked ? "text-green-700 dark:text-green-400" : ""}`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}