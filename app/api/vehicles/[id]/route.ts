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

// GET /api/vehicles/[id] - Get a specific vehicle
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vehicleId = params.id

    // Validate the vehicle ID
    if (!ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get the vehicle from the database
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(vehicleId) })

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // For client users, verify they have access to this vehicle
    if (decodedToken.role === "client") {
      // Get the customer associated with this vehicle
      const customer = await db.collection("customers").findOne({ _id: new ObjectId(vehicle.customerId) })

      if (!customer || customer.userId !== decodedToken.uid) {
        return NextResponse.json({ error: "Unauthorized to access this vehicle" }, { status: 403 })
      }
    }

    // Transform vehicle to include id instead of _id
    const transformedVehicle = {
      id: vehicle._id.toString(),
      ...vehicle,
      _id: undefined
    }

    // Get the customer details
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(vehicle.customerId) })

    // Get the service history for this vehicle
    const services = await db.collection("services").find({ vehicleId: vehicleId }).sort({ serviceDate: -1 }).toArray()

    return NextResponse.json({
      vehicle: transformedVehicle,
      customer,
      services,
    })
  } catch (error) {
    console.error("Error fetching vehicle:", error)
    return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 })
  }
}

// PUT /api/vehicles/[id] - Update a vehicle
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

    const vehicleId = params.id

    // Validate the vehicle ID
    if (!ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    // Parse the request body
    const body = await req.json()
    const { make, model, year, color, licensePlate, customerId, mileage } = body

    // Validate required fields
    if (!make || !model || !year || !customerId || !mileage) {
      return NextResponse.json({ error: "Make, model, year, customerId, and mileage are required" }, { status: 400 })
    }

    // Validate customerId
    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the vehicle exists
    const existingVehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(vehicleId) })

    if (!existingVehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Check if customer exists
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Update the vehicle
    const updatedVehicle = {
      make,
      model,
      year,
      color: color || "",
      licensePlate: licensePlate || "",
      customerId,
      mileage,
      updatedAt: new Date(),
    }

    await db.collection("vehicles").updateOne({ _id: new ObjectId(vehicleId) }, { $set: updatedVehicle })

    return NextResponse.json({
      vehicle: {
        id: vehicleId,
        vin: existingVehicle.vin, // VIN cannot be changed
        ...updatedVehicle,
      },
    })
  } catch (error) {
    console.error("Error updating vehicle:", error)
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 })
  }
}

// DELETE /api/vehicles/[id] - Delete a vehicle
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated and is an admin
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const vehicleId = params.id

    // Validate the vehicle ID
    if (!ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the vehicle exists
    const existingVehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(vehicleId) })

    if (!existingVehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Delete the vehicle
    await db.collection("vehicles").deleteOne({ _id: new ObjectId(vehicleId) })

    // Also delete all services associated with this vehicle
    await db.collection("services").deleteMany({ vehicleId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting vehicle:", error)
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 })
  }
}

