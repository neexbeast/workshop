import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/mongodb"
import { getAuth } from "firebase-admin/auth"
import { ObjectId } from "mongodb"
import nodemailer from "nodemailer"

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

// GET /api/reminders - Get all reminders
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
    const vehicleId = url.searchParams.get("vehicleId") || ""
    const customerId = url.searchParams.get("customerId") || ""
    const upcoming = url.searchParams.get("upcoming") === "true"
    const dateFilter = url.searchParams.get("dateFilter") || "all"
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Define the query interface
    interface ReminderQuery {
      vehicleId?: string;
      customerId?: string | { $in: string[] };
      sent?: boolean;
      reminderDate?: {
        $gte?: Date;
        $lt?: Date;
        $lte?: Date;
      };
    }

    // Build the query
    const query: ReminderQuery = {}

    // If vehicleId is provided, filter by vehicle
    if (vehicleId && ObjectId.isValid(vehicleId)) {
      query.vehicleId = vehicleId
    }

    // If customerId is provided, filter by customer
    if (customerId && ObjectId.isValid(customerId)) {
      query.customerId = customerId
    }

    // If upcoming is true, only show reminders that haven't been sent yet
    if (upcoming) {
      query.sent = false
      query.reminderDate = { $gte: new Date() }
    }

    // Add date filter
    if (dateFilter && dateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (dateFilter) {
        case "today":
          query.reminderDate = {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
          break
        case "week": {
          // Get the current date
          const currentDate = new Date()
          // Get the first day of the current week (Monday)
          const firstDay = new Date(currentDate)
          firstDay.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1))
          firstDay.setHours(0, 0, 0, 0)
          
          // Get the last day of the current week (Sunday)
          const lastDay = new Date(firstDay)
          lastDay.setDate(firstDay.getDate() + 6)
          lastDay.setHours(23, 59, 59, 999)

          console.log('Date filter - week:', {
            firstDay: firstDay.toISOString(),
            lastDay: lastDay.toISOString(),
            currentDate: currentDate.toISOString()
          })

          query.reminderDate = {
            $gte: firstDay,
            $lte: lastDay
          }
          break
        }
        case "month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          startOfMonth.setHours(0, 0, 0, 0)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          query.reminderDate = { 
            $gte: startOfMonth,
            $lte: endOfMonth
          }
          break
        }
        case "year": {
          const startOfYear = new Date(now.getFullYear(), 0, 1)
          startOfYear.setHours(0, 0, 0, 0)
          const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
          query.reminderDate = { 
            $gte: startOfYear,
            $lte: endOfYear
          }
          break
        }
      }

      console.log('Date filter query:', {
        filter: dateFilter,
        query: query.reminderDate
      })
    }

    // For client users, only return reminders for their vehicles
    if (decodedToken.role === "client") {
      // First, get all customers associated with this user
      const customers = await db.collection("customers").find({ userId: decodedToken.uid }).toArray()

      const customerIds = customers.map((customer) => customer._id.toString())

      if (customerIds.length === 0) {
        // If no customers found, return empty array
        return NextResponse.json({
          reminders: [],
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

    // Get total count for pagination
    const total = await db.collection("reminders").countDocuments(query)

    // Get reminders with pagination
    const reminders = await db
      .collection("reminders")
      .find(query)
      .sort({ reminderDate: 1 }) // Sort by reminder date ascending
      .skip(skip)
      .limit(limit)
      .toArray()

    // Add comprehensive debug logging
    console.log('=== DEBUG: REMINDERS QUERY ===')
    console.log('Date Filter:', dateFilter)
    console.log('Query:', JSON.stringify(query, null, 2))
    console.log('=== DEBUG: FOUND REMINDERS ===')
    reminders.forEach(r => {
      console.log({
        id: r._id.toString(),
        date: new Date(r.reminderDate).toISOString(),
        rawDate: r.reminderDate,
        message: r.message,
        sent: r.sent
      })
    })
    console.log('=== DEBUG: END ===')

    // Get additional details for each reminder
    const remindersWithDetails = await Promise.all(
      reminders.map(async (reminder) => {
        const service = await db.collection("services").findOne({ _id: new ObjectId(reminder.serviceId) })
        const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(reminder.vehicleId) })
        const customer = await db.collection("customers").findOne({ _id: new ObjectId(reminder.customerId) })

        return {
          ...reminder,
          id: reminder._id.toString(),
          service,
          vehicle,
          customer,
        }
      })
    )

    return NextResponse.json({
      reminders: remindersWithDetails,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching reminders:", error)
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 })
  }
}

// POST /api/reminders - Create a new reminder
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
    const { serviceId, vehicleId, customerId, reminderDate, reminderType, mileageThreshold, message } = body

    // Validate required fields
    if (!serviceId || !vehicleId || !customerId || !reminderDate || !reminderType) {
      return NextResponse.json(
        { error: "ServiceId, vehicleId, customerId, reminderDate, and reminderType are required" },
        { status: 400 },
      )
    }

    // Validate IDs
    if (!ObjectId.isValid(serviceId) || !ObjectId.isValid(vehicleId) || !ObjectId.isValid(customerId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if service, vehicle, and customer exist
    const service = await db.collection("services").findOne({ _id: new ObjectId(serviceId) })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(vehicleId) })

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Create the new reminder
    const now = new Date()
    const newReminder = {
      serviceId,
      vehicleId,
      customerId,
      reminderDate: new Date(reminderDate),
      reminderType,
      mileageThreshold: mileageThreshold || null,
      sent: false,
      email: customer.email,
      message: message || `Reminder for ${service.serviceType} service for your ${vehicle.make} ${vehicle.model}`,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("reminders").insertOne(newReminder)

    return NextResponse.json(
      {
        reminder: {
          id: result.insertedId,
          ...newReminder,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating reminder:", error)
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 })
  }
}

// POST /api/reminders/send - Send due reminders
export async function sendReminders(req: NextRequest) {
  try {
    // Verify the user is authenticated and is an admin
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get all unsent reminders that are due
    const now = new Date()
    const dueReminders = await db
      .collection("reminders")
      .find({
        sent: false,
        reminderDate: { $lte: now },
      })
      .toArray()

    if (dueReminders.length === 0) {
      return NextResponse.json({
        message: "No reminders due for sending",
        count: 0,
      })
    }

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number.parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Send emails for each reminder
    const sentCount = await Promise.all(
      dueReminders.map(async (reminder) => {
        try {
          // Get vehicle and service details
          const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(reminder.vehicleId) })

          const service = await db.collection("services").findOne({ _id: new ObjectId(reminder.serviceId) })

          if (!vehicle || !service) {
            console.error(`Missing vehicle or service for reminder ${reminder._id}`)
            return false
          }

          // Send the email
          await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: reminder.email,
            subject: `Service Reminder for your ${vehicle.make} ${vehicle.model}`,
            text: reminder.message,
            html: `
              <h1>Service Reminder</h1>
              <p>${reminder.message}</p>
              <p>Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})</p>
              <p>VIN: ${vehicle.vin}</p>
              <p>Last Service: ${service.serviceType} on ${new Date(service.serviceDate).toLocaleDateString()}</p>
              <p>Please contact us to schedule your next service appointment.</p>
            `,
          })

          // Mark the reminder as sent
          await db.collection("reminders").updateOne({ _id: reminder._id }, { $set: { sent: true, updatedAt: now } })

          return true
        } catch (error) {
          console.error(`Error sending reminder ${reminder._id}:`, error)
          return false
        }
      }),
    )

    const successCount = sentCount.filter(Boolean).length

    return NextResponse.json({
      message: `Successfully sent ${successCount} of ${dueReminders.length} reminders`,
      count: successCount,
    })
  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
}

