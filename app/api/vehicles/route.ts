import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"
import { getAuth } from "firebase-admin/auth"
import { ObjectId } from "mongodb"

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

// GET /api/vehicles - Get all vehicles
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
    const customerId = url.searchParams.get("customerId") || ""
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Build the query
    const query: any = {}

    // If search parameter is provided, search in make, model, and VIN
    if (search) {
      query.$or = [
        { make: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { vin: { $regex: search, $options: "i" } },
      ]
    }

    // If customerId is provided, filter by customer
    if (customerId && ObjectId.isValid(customerId)) {
      query.customerId = customerId
    }

    // For client users, only return vehicles associated with their customer records
    if (decodedToken.role === "client") {
      // First, get all customers associated with this user
      const customers = await db.collection("customers").find({ userId: decodedToken.uid }).toArray()

      const customerIds = customers.map((customer) => customer._id.toString())

      if (customerIds.length === 0) {
        // If no customers found, return empty array
        return NextResponse.json({
          vehicles: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        })
      }

      // Add customer filter to query
      query.customerId = { $in: customerIds }
    }

    // Get vehicles from the database
    const vehicles = await db
      .collection("vehicles")
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray()

    // Get total count for pagination
    const total = await db.collection("vehicles").countDocuments(query)

    return NextResponse.json({
      vehicles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 })
  }
}

// POST /api/vehicles - Create a new vehicle
export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated and is an admin or worker
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Parse the request body
    const body = await req.json()
    const { vin, make, model, year, color, licensePlate, customerId, mileage } = body

    // Validate required fields
    if (!vin || !make || !model || !year || !customerId || !mileage) {
      return NextResponse.json(
        { error: "VIN, make, model, year, customerId, and mileage are required" },
        { status: 400 },
      )
    }

    // Validate customerId
    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if customer exists
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Check if vehicle with this VIN already exists
    const existingVehicle = await db.collection("vehicles").findOne({ vin })

    if (existingVehicle) {
      return NextResponse.json({ error: "Vehicle with this VIN already exists" }, { status: 409 })
    }

    // Create the new vehicle
    const now = new Date()
    const newVehicle = {
      vin,
      make,
      model,
      year,
      color: color || "",
      licensePlate: licensePlate || "",
      customerId,
      mileage,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("vehicles").insertOne(newVehicle)

    return NextResponse.json(
      {
        vehicle: {
          id: result.insertedId,
          ...newVehicle,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating vehicle:", error)
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 })
  }
}

