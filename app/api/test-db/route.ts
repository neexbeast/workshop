import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    // Test the connection
    await db.command({ ping: 1 })
    
    // Get database stats
    const stats = await db.stats()
    
    return NextResponse.json({
      status: "Connected",
      database: db.databaseName,
      collections: await db.listCollections().toArray(),
      stats
    })
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json({
      status: "Error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 