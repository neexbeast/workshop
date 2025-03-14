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

// GET /api/services/[id] - Get a specific service
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceId = params.id

    // Validate the service ID
    if (!ObjectId.isValid(serviceId)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get the service from the database
    const service = await db.collection("services").findOne({ _id: new ObjectId(serviceId) })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Get the vehicle details
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(service.vehicleId) })

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // For client users, verify they have access to this service
    if (decodedToken.role === "client") {
      // Get the customer associated with this vehicle
      const customer = await db.collection("customers").findOne({ _id: new ObjectId(vehicle.customerId) })

      if (!customer || customer.userId !== decodedToken.uid) {
        return NextResponse.json({ error: "Unauthorized to access this service" }, { status: 403 })
      }
    }

    // Get the customer details
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(vehicle.customerId) })

    // Get the technician details
    const technician = await db.collection("users").findOne({ uid: service.technicianId })

    // Get any reminders associated with this service
    const reminders = await db.collection("reminders").find({ serviceId }).toArray()

    return NextResponse.json({
      service,
      vehicle,
      customer,
      technician,
      reminders,
    })
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 })
  }
}

// PUT /api/services/[id] - Update a service
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

    const serviceId = params.id

    // Validate the service ID
    if (!ObjectId.isValid(serviceId)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 })
    }

    // Parse the request body
    const body = await req.json()
    const { serviceType, serviceDate, mileage, description, parts, cost } = body

    // Validate required fields
    if (!serviceType || !serviceDate || !mileage || !description || !cost) {
      return NextResponse.json(
        { error: "ServiceType, serviceDate, mileage, description, and cost are required" },
        { status: 400 },
      )
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the service exists
    const existingService = await db.collection("services").findOne({ _id: new ObjectId(serviceId) })

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Update the service
    const updatedService = {
      serviceType,
      serviceDate: new Date(serviceDate),
      mileage,
      description,
      parts: parts || [],
      cost,
      updatedAt: new Date(),
    }

    await db.collection("services").updateOne({ _id: new ObjectId(serviceId) }, { $set: updatedService })

    // Update the vehicle's mileage if this is the most recent service
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(existingService.vehicleId) })

    if (vehicle && vehicle.mileage < mileage) {
      await db
        .collection("vehicles")
        .updateOne({ _id: new ObjectId(existingService.vehicleId) }, { $set: { mileage, updatedAt: new Date() } })
    }

    return NextResponse.json({
      service: {
        id: serviceId,
        vehicleId: existingService.vehicleId,
        technicianId: existingService.technicianId,
        ...updatedService,
      },
    })
  } catch (error) {
    console.error("Error updating service:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

// DELETE /api/services/[id] - Delete a service
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

    const serviceId = params.id

    // Validate the service ID
    if (!ObjectId.isValid(serviceId)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the service exists
    const existingService = await db.collection("services").findOne({ _id: new ObjectId(serviceId) })

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Delete the service
    await db.collection("services").deleteOne({ _id: new ObjectId(serviceId) })

    // Also delete all reminders associated with this service
    await db.collection("reminders").deleteMany({ serviceId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting service:", error)
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}

