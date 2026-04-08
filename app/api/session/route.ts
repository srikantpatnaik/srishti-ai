import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import * as fs from "fs/promises"
import * as path from "path"

interface Session {
  id: string
  folder: string
}

// In-memory session storage
const sessions = new Map<string, Session>()

export async function POST(req: NextRequest) {
  try {
    // Create a new session with auto-generated folder
    const sessionId = randomUUID()
    const tmpDir = path.join(process.cwd(), "tmp")
    const sessionFolder = path.join(tmpDir, sessionId)
    
    // Create tmp directory if it doesn't exist
    await fs.mkdir(tmpDir, { recursive: true })
    
    // Create session folder
    await fs.mkdir(sessionFolder, { recursive: true })
    
    // Store session
    sessions.set(sessionId, {
      id: sessionId,
      folder: sessionFolder,
    })
    
    console.log(`Created session ${sessionId} at ${sessionFolder}`)
    
    return NextResponse.json({
      success: true,
      sessionId,
      folder: sessionFolder,
    })
  } catch (error: any) {
    console.error("Error creating session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const sessionId = searchParams.get("sessionId")
  
  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID required" },
      { status: 400 }
    )
  }
  
  const session = sessions.get(sessionId)
  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    )
  }
  
  return NextResponse.json({
    folder: session.folder,
  })
}
