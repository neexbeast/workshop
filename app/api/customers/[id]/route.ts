import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"
import { ObjectId } from "mongodb"
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

// GET /api/customers/[id] - Get a specific customer
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customerId = params.id

    // Validate the customer ID
    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get the customer from the database
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // For client users, only allow access to their own data
    if (decodedToken.role === "client" && customer.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized to access this customer" }, { status: 403 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated and is an admin or worker
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const customerId = params.id

    // Validate the customer ID
    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    // Parse the request body
    const body = await req.json()
    const { name, email, phone, address } = body

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the customer exists
    const existingCustomer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Update the customer
    const updatedCustomer = {
      name,
      email,
      phone,
      address: address || "",
      updatedAt: new Date(),
    }

    await db.collection("customers").updateOne({ _id: new ObjectId(customerId) }, { $set: updatedCustomer })

    return NextResponse.json({
      customer: {
        id: customerId,
        ...updatedCustomer,
      },
    })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated and is an admin
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const customerId = params.id

    // Validate the customer ID
    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the customer exists
    const existingCustomer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Delete the customer
    await db.collection("customers").deleteOne({ _id: new ObjectId(customerId) })

    // Also delete all vehicles associated with this customer
    await db.collection("vehicles").deleteMany({ customerId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}

