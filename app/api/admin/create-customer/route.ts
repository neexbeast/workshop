import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { generatePassword } from "@/lib/utils/password"

// Initialize Firebase Admin SDK if it hasn't been initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")

  initializeApp({
    credential: cert(serviceAccount),
  })
}

// Middleware to verify admin role
async function verifyAdminToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    // Allow both admin and worker roles
    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return null
    }

    return decodedToken
  } catch (error) {
    console.error("Error verifying admin token:", error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting customer creation process...")
    
    // Verify the user is an admin or worker
    const adminToken = await verifyAdminToken(req)
    console.log("Token verification result:", adminToken ? "Success" : "Failed", "Role:", adminToken?.role)
    
    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized - Admin or worker access required" }, { status: 401 })
    }

    // Parse the request body
    const body = await req.json()
    const { name, email, phone, address } = body
    console.log("Received customer data:", { name, email, phone, address })

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if customer with this email already exists
    const { db } = await connectToDatabase()
    const existingCustomer = await db.collection("customers").findOne({ email })
    console.log("Existing customer check:", existingCustomer ? "Found" : "Not found")

    if (existingCustomer) {
      return NextResponse.json({ error: "Customer with this email already exists" }, { status: 409 })
    }

    let createdUserId: string | undefined

    try {
      // Generate a temporary password
      const temporaryPassword = generatePassword()
      console.log("Generated temporary password")

      // Create Firebase user
      console.log("Creating Firebase user...")
      const userRecord = await getAuth().createUser({
        email: email,
        password: temporaryPassword,
        displayName: name,
        emailVerified: false,
      })
      console.log("Firebase user created:", userRecord.uid)

      createdUserId = userRecord.uid

      // Set custom claims for client role
      console.log("Setting custom claims...")
      await getAuth().setCustomUserClaims(userRecord.uid, { 
        role: "client",
        temporaryPassword: true 
      })
      console.log("Custom claims set successfully")

      // Send welcome email with temporary password
      console.log("Sending welcome email...")
      const { sendMail } = await import("@/lib/email/send-mail")
      await sendMail({
        to: email,
        subject: "Welcome to Workshop - Your Temporary Password",
        html: `
          <h1>Welcome to Workshop!</h1>
          <p>Hello ${name},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          <p>Please log in using these credentials and change your password immediately for security purposes.</p>
          <p>You can log in at: <a href="${process.env.NEXT_PUBLIC_PASSWORD_RESET_URL?.replace('/reset-password', '/login') || 'http://localhost:3000/login'}">${process.env.NEXT_PUBLIC_PASSWORD_RESET_URL?.replace('/reset-password', '/login') || 'http://localhost:3000/login'}</a></p>
          <p>If you did not request this account, please ignore this email.</p>
          <br>
          <p>Best regards,</p>
          <p>Workshop Team</p>
        `,
      })
      console.log("Welcome email sent")

      // Create the customer record
      console.log("Creating customer record in database...")
      const now = new Date()
      const newCustomer = {
        name,
        email,
        phone: phone || "",
        address: address || "",
        userId: userRecord.uid,
        createdAt: now,
        updatedAt: now,
      }

      const result = await db.collection("customers").insertOne(newCustomer)
      console.log("Customer record created:", result.insertedId)

      return NextResponse.json(
        {
          customer: {
            id: result.insertedId,
            ...newCustomer,
          },
          message: "Customer created successfully. Password reset email sent.",
        },
        { status: 201 }
      )
    } catch (error) {
      console.error("Detailed error creating customer:", error)
      
      // If we created a Firebase user but failed later, clean it up
      if (createdUserId) {
        try {
          console.log("Attempting to clean up Firebase user:", createdUserId)
          await getAuth().deleteUser(createdUserId)
          console.log("Firebase user cleaned up successfully")
        } catch (deleteError) {
          console.error("Error cleaning up Firebase user:", deleteError)
        }
      }

      // Return appropriate error message
      const errorMessage = error instanceof Error ? error.message : "Failed to create customer"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in create-customer API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 