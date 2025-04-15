import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    // Update custom claims to remove temporaryPassword flag
    await getAuth().setCustomUserClaims(decodedToken.uid, {
      role: decodedToken.claims.role,
      temporaryPassword: false
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing temporary password flag:", error)
    return NextResponse.json({ error: "Failed to clear temporary password flag" }, { status: 500 })
  }
} 