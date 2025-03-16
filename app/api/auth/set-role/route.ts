import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin SDK if it hasn't been initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")

  initializeApp({
    credential: cert(serviceAccount),
  })
}

// POST /api/auth/set-role - Set custom claims for a user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid, role } = body

    if (!uid || !role) {
      return NextResponse.json({ error: "UID and role are required" }, { status: 400 })
    }

    if (!["admin", "worker", "client"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Set custom claims
    await getAuth().setCustomUserClaims(uid, { role })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting custom claims:", error)
    return NextResponse.json({ error: "Failed to set custom claims" }, { status: 500 })
  }
} 