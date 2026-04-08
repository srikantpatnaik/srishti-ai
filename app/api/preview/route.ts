import { NextRequest, NextResponse } from "next/server"
import { serverManager } from "@/lib/server-manager"

export async function POST(req: NextRequest) {
  try {
    const { projectFolder } = await req.json()

    if (!projectFolder) {
      return NextResponse.json(
        { error: "Project folder not specified" },
        { status: 400 }
      )
    }

    console.log(`Starting preview server for: ${projectFolder}`)
    const result = await serverManager.startNextjsServer(projectFolder)
    console.log(`Server result:`, result)

    if (result.success && result.port) {
      return NextResponse.json({
        success: true,
        url: `http://localhost:${result.port}`,
        port: result.port,
      })
    }

    return NextResponse.json(
      { error: result.error || "Failed to start server" },
      { status: 500 }
    )
  } catch (error: any) {
    console.error("Error starting server:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { projectFolder } = await req.json()

    if (!projectFolder) {
      return NextResponse.json(
        { error: "Project folder not specified" },
        { status: 400 }
      )
    }

    console.log(`Stopping preview server for: ${projectFolder}`)
    const result = await serverManager.stopServer(projectFolder)
    console.log(`Server stop result:`, result)

    return NextResponse.json({
      success: result,
    })
  } catch (error: any) {
    console.error("Error stopping server:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
