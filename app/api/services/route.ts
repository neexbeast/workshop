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

// GET /api/services - Get all services
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
    const vehicleId = url.searchParams.get("vehicleId") || ""
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Build the query
    type MongoQuery = {
      [key: string]: any;
    }
    
    const query: MongoQuery = {}

    // If search parameter is provided, search in serviceType and description
    if (search) {
      query.$or = [
        { serviceType: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    // If vehicleId is provided, filter by vehicle
    if (vehicleId && ObjectId.isValid(vehicleId)) {
      query.vehicleId = vehicleId
    }

    // For client users, only return services for their vehicles
    if (decodedToken.role === "client") {
      // First, get all customers associated with this user
      const customers = await db.collection("customers").find({ userId: decodedToken.uid }).toArray()

      const customerIds = customers.map((customer) => customer._id.toString())

      if (customerIds.length === 0) {
        // If no customers found, return empty array
        return NextResponse.json({
          services: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        })
      }

      // Get all vehicles for these customers
      const vehicles = await db
        .collection("vehicles")
        .find({ customerId: { $in: customerIds } })
        .toArray()

      const vehicleIds = vehicles.map((vehicle) => vehicle._id.toString())

      if (vehicleIds.length === 0) {
        // If no vehicles found, return empty array
        return NextResponse.json({
          services: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        })
      }

      // Add vehicle filter to query
      query.vehicleId = { $in: vehicleIds }
    }

    // Get services from the database
    const services = await db
      .collection("services")
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ serviceDate: -1 })
      .toArray()

    // Get total count for pagination
    const total = await db.collection("services").countDocuments(query)

    // For each service, get the vehicle and customer details
    const servicesWithDetails = await Promise.all(
      services.map(async (service) => {
        const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(service.vehicleId) })

        let customer = null
        if (vehicle) {
          customer = await db.collection("customers").findOne({ _id: new ObjectId(vehicle.customerId) })
        }

        return {
          ...service,
          id: service._id.toString(),
          vehicle: vehicle ? { ...vehicle, id: vehicle._id.toString() } : null,
          customer: customer ? { ...customer, id: customer._id.toString() } : null,
        }
      }),
    )

    return NextResponse.json({
      services: servicesWithDetails,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

// POST /api/services - Create a new service
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
    const {
      vehicleId,
      serviceType,
      serviceDate,
      mileage,
      description,
      parts,
      cost,
      reminderDate,
      reminderType,
      mileageThreshold,
    } = body

    // Validate required fields
    if (!vehicleId || !serviceType || !serviceDate || !mileage || !description || !cost) {
      return NextResponse.json(
        { error: "VehicleId, serviceType, serviceDate, mileage, description, and cost are required" },
        { status: 400 },
      )
    }

    // Validate vehicleId
    if (!ObjectId.isValid(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if vehicle exists
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(vehicleId) })

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Create the new service
    const now = new Date()
    const newService = {
      vehicleId,
      serviceType,
      serviceDate: new Date(serviceDate),
      mileage,
      description,
      parts: parts || [],
      cost,
      technicianId: decodedToken.uid,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("services").insertOne(newService)

    // Update the vehicle's mileage
    await db.collection("vehicles").updateOne({ _id: new ObjectId(vehicleId) }, { $set: { mileage, updatedAt: now } })

    // If a reminder is requested, create it
    if (reminderDate || (reminderType === "mileage" && mileageThreshold)) {
      const customer = await db.collection("customers").findOne({ _id: new ObjectId(vehicle.customerId) })

      if (customer) {
        const reminder = {
          serviceId: result.insertedId.toString(),
          vehicleId,
          customerId: vehicle.customerId,
          reminderDate: reminderDate ? new Date(reminderDate) : null,
          reminderType: reminderType || "time",
          mileageThreshold: mileageThreshold || null,
          sent: false,
          email: customer.email,
          message: `Reminder for ${serviceType} service for your ${vehicle.make} ${vehicle.model}`,
          createdAt: now,
          updatedAt: now,
        }

        await db.collection("reminders").insertOne(reminder)
      }
    }

    return NextResponse.json(
      {
        service: {
          id: result.insertedId,
          ...newService,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}

