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
    
    // Get existing custom claims
    const user = await getAuth().getUser(decodedToken.uid)
    const existingClaims = user.customClaims || {}
    
    // Update custom claims to remove temporaryPassword flag while preserving other claims
    await getAuth().setCustomUserClaims(decodedToken.uid, {
      ...existingClaims,
      temporaryPassword: false
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing temporary password flag:", error)
    return NextResponse.json({ error: "Failed to clear temporary password flag" }, { status: 500 })
  }
} 