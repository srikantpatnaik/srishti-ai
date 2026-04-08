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
    const { sessionId } = await req.json()
    const tmpDir = path.join(process.cwd(), "tmp")
    
    // Create tmp directory if it doesn't exist
    await fs.mkdir(tmpDir, { recursive: true })
    
    let sessionFolder: string
    
    if (sessionId) {
      // Return existing session folder
      sessionFolder = path.join(tmpDir, sessionId)
      const session = sessions.get(sessionId)
      if (session) {
        console.log(`Returning existing session ${sessionId} at ${sessionFolder}`)
        return NextResponse.json({
          success: true,
          sessionId,
          folder: session.folder,
          isNew: false,
        })
      }
      // Check if folder exists
      try {
        await fs.access(sessionFolder)
        sessions.set(sessionId, {
          id: sessionId,
          folder: sessionFolder,
        })
        console.log(`Restored session ${sessionId} at ${sessionFolder}`)
        return NextResponse.json({
          success: true,
          sessionId,
          folder: sessionFolder,
          isNew: false,
        })
      } catch {
        // Folder doesn't exist, create new
      }
    }
    
    // Create a new session with auto-generated folder
    const newSessionId = randomUUID()
    sessionFolder = path.join(tmpDir, newSessionId)
    
    // Create session folder
    await fs.mkdir(sessionFolder, { recursive: true })
    
    // Store session
    sessions.set(newSessionId, {
      id: newSessionId,
      folder: sessionFolder,
    })
    
    console.log(`Created session ${newSessionId} at ${sessionFolder}`)
    
    return NextResponse.json({
      success: true,
      sessionId: newSessionId,
      folder: sessionFolder,
      isNew: true,
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
