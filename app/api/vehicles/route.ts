import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import type { Vehicle } from "@/lib/mongodb/models"

// Initialize Firebase Admin SDK if it hasn't been initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")

  initializeApp({
    credential: cert(serviceAccount),
  })
}

interface VehicleDocument extends Omit<Vehicle, "id"> {
  _id: ObjectId
  customerId: string
  make: string
  model: string
  year: number
  vin: string
  color?: string
  licensePlate?: string
  mileage: number
  createdAt: Date
  updatedAt: Date
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

// GET /api/vehicles - Get all vehicles
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify Firebase token
    const token = authHeader.split(" ")[1]
    const decodedToken = await getAuth().verifyIdToken(token)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const customerId = searchParams.get("customerId") || ""
    const skip = (page - 1) * limit

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Base query
    const query: Record<string, unknown> = {}

    // If customerId is provided, filter by that specific customer
    if (customerId && ObjectId.isValid(customerId)) {
      query.customerId = customerId
    } else if (["admin", "worker", "client"].includes(decodedToken.role)) {
      // Get all customers created by this user
      const customers = await db.collection("customers").find({ userId: decodedToken.uid }).toArray();
      const customerIds = customers.map((customer) => customer._id.toString());
      if (customerIds.length === 0) {
        return NextResponse.json({
          vehicles: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        });
      }
      query.customerId = { $in: customerIds };
    }

    // Get vehicles from the database
    const vehicles = await db.collection("vehicles").find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray() as VehicleDocument[]

    console.log("Found vehicles:", vehicles)

    // Get total count for pagination
    const total = await db.collection("vehicles").countDocuments(query)

    // Return vehicles with pagination info
    return NextResponse.json({
      vehicles: vehicles.map((vehicle) => ({
        ...vehicle,
        id: vehicle._id.toString(),
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error in vehicles GET:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
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

