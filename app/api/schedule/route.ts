import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { ObjectId } from "mongodb"

// Initialize Firebase Admin SDK if it hasn't been initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")

  initializeApp({
    credential: cert(serviceAccount),
  })
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

// GET /api/schedule - Get schedules for a specific date
export async function GET(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const date = url.searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Create start and end of the selected date
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    console.log("Requested date:", date)
    console.log("Fetching services between:", startDate.toISOString(), "and", endDate.toISOString())

    // First check if we have any services directly
    const servicesCheck = await db.collection("services").find({
      serviceDate: {
        $gte: startDate,
        $lte: endDate
      },
      status: "scheduled"
    }).toArray()
    
    console.log("Raw services found:", servicesCheck)

    // Get services scheduled for the date
    const services = await db
      .collection("services")
      .aggregate([
        {
          $match: {
            serviceDate: {
              $gte: startDate,
              $lte: endDate
            },
            status: "scheduled"
          },
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicleId",
            foreignField: "_id",
            as: "vehicle",
          },
        },
        {
          $unwind: {
            path: "$vehicle",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            id: { $toString: "$_id" },
            date: { $dateToString: { format: "%Y-%m-%d", date: "$serviceDate" } },
            time: { 
              $dateToString: { 
                format: "%H:%M", 
                date: "$serviceDate",
                timezone: "+02"
              } 
            },
            customerName: "$customerName",
            customerEmail: "$customerEmail",
            vehicleInfo: {
              $concat: [
                { $ifNull: ["$vehicle.make", ""] },
                " ",
                { $ifNull: ["$vehicle.model", ""] },
                " (",
                { $toString: { $ifNull: ["$vehicle.year", ""] } },
                ") - ",
                { $ifNull: ["$vehicle.vin", "No VIN"] },
              ],
            },
            serviceType: 1,
          },
        },
        {
          $sort: { time: 1 },
        },
      ])
      .toArray()

    console.log("Final processed services:", services)

    return NextResponse.json({ schedules: services })
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/schedule - Create a new schedule
export async function POST(req: NextRequest) {
  try {
    // Verify the Firebase token
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    // Get user info from Firebase
    const userRecord = await getAuth().getUser(decodedToken.uid)

    const body = await req.json()
    const { vehicleId, serviceType, scheduledTime } = body

    if (!vehicleId || !serviceType || !scheduledTime) {
      return NextResponse.json(
        { error: "Vehicle ID, service type, and scheduled time are required" },
        { status: 400 },
      )
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the time slot is available
    const [date, time] = scheduledTime.split("T")
    const availability = await db.collection("availability").findOne({
      date,
      timeSlots: {
        $elemMatch: {
          time,
          available: true,
        },
      },
    })

    if (!availability) {
      return NextResponse.json({ error: "Selected time slot is not available" }, { status: 400 })
    }

    // Create the service record with the exact selected time
    // First create a local date object
    const [year, month, day] = date.split("-").map(Number)
    const [hours, minutes] = time.split(":").map(Number)
    
    // Create date in local time
    const serviceDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))

    const service = {
      vehicleId: new ObjectId(vehicleId),
      serviceType,
      serviceDate,
      customerName: userRecord.displayName || "No name provided",
      customerEmail: userRecord.email || "No email provided",
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Time selected by user:", time)
    console.log("Creating service with date:", serviceDate.toISOString())

    const result = await db.collection("services").insertOne(service)

    // Update the time slot availability
    await db.collection("availability").updateOne(
      { date },
      {
        $set: {
          "timeSlots.$[slot].available": false,
        },
      },
      {
        arrayFilters: [{ "slot.time": time }],
      },
    )

    return NextResponse.json({
      success: true,
      serviceId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error in schedule API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to schedule service" },
      { status: 500 },
    )
  }
} 