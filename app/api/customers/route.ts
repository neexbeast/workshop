import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { ObjectId } from "mongodb"
import type { Customer } from "@/lib/mongodb/models"

// Initialize Firebase Admin SDK if it hasn't been initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")

  initializeApp({
    credential: cert(serviceAccount),
  })
}

interface CustomerDocument extends Omit<Customer, "id"> {
  _id: ObjectId
}

interface CustomerQuery {
  $or?: Array<{
    [key: string]: { $regex: string; $options: string }
  }>
  userId?: string
}

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

// GET /api/customers - Get all customers
export async function GET(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get query parameters
    const url = new URL(req.url)
    const search = url.searchParams.get("search") || ""
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Build the query
    const query: CustomerQuery = {}

    // If search parameter is provided, search in name, email, and phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ]
    }

    // For client users, only return their own data
    if (decodedToken.role === "client") {
      query.userId = decodedToken.uid
    }

    // Get customers from the database
    const customers = await db
      .collection<CustomerDocument>("customers")
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray()

    // Transform _id to id for each customer
    const transformedCustomers = customers.map(customer => ({
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      userId: customer.userId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }))

    // Get total count for pagination
    const total = await db.collection("customers").countDocuments(query)

    return NextResponse.json({
      customers: transformedCustomers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
} 