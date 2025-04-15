import { NextRequest, NextResponse } from "next/server"
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

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await req.json()
    const { name, email, phone, address } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Connect to the database
    let db;
    try {
      const dbConnection = await connectToDatabase()
      db = dbConnection.db
    } catch (error) {
      console.error("Database connection error:", error)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Check if customer with this email already exists
    const existingCustomer = await db.collection("customers").findOne({ email })

    if (existingCustomer) {
      return NextResponse.json({ error: "Customer with this email already exists" }, { status: 409 })
    }

    // Create the new customer
    const now = new Date()
    const newCustomer = {
      name,
      email,
      phone,
      address: address || "",
      userId: decodedToken.uid, // This is the Firebase UID
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("customers").insertOne(newCustomer)

    return NextResponse.json(
      {
        customer: {
          id: result.insertedId,
          ...newCustomer,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
} 