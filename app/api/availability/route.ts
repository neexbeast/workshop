import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"
import { getAuth } from "firebase-admin/auth"

// Middleware to verify Firebase token
async function verifyAuthToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error("Error verifying auth token:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const decodedToken = await verifyAuthToken(request)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const availability = await db.collection("availability").findOne({ date })
    
    return NextResponse.json(availability || { 
      date,
      isBlocked: false,
      workingHours: {
        start: "09:00",
        end: "17:00",
        interval: 30,
      },
      timeSlots: []
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated and is an admin or worker
    const decodedToken = await verifyAuthToken(request)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { date, isBlocked, workingHours, timeSlots } = body

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("availability").updateOne(
      { date },
      { 
        $set: { 
          date,
          isBlocked,
          workingHours,
          timeSlots,
          updatedAt: new Date(),
          updatedBy: decodedToken.uid
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 