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

// GET /api/reminders/[id] - Get a specific reminder
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reminderId = params.id

    // Validate the reminder ID
    if (!ObjectId.isValid(reminderId)) {
      return NextResponse.json({ error: "Invalid reminder ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get the reminder from the database
    const reminder = await db.collection("reminders").findOne({ _id: new ObjectId(reminderId) })

    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
    }

    // For client users, verify they have access to this reminder
    if (decodedToken.role === "client") {
      // Get the customer associated with this reminder
      const customer = await db.collection("customers").findOne({ _id: new ObjectId(reminder.customerId) })

      if (!customer || customer.userId !== decodedToken.uid) {
        return NextResponse.json({ error: "Unauthorized to access this reminder" }, { status: 403 })
      }
    }

    // Get the service details
    const service = await db.collection("services").findOne({ _id: new ObjectId(reminder.serviceId) })

    // Get the vehicle details
    const vehicle = await db.collection("vehicles").findOne({ _id: new ObjectId(reminder.vehicleId) })

    // Get the customer details
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(reminder.customerId) })

    return NextResponse.json({
      reminder,
      service,
      vehicle,
      customer,
    })
  } catch (error) {
    console.error("Error fetching reminder:", error)
    return NextResponse.json({ error: "Failed to fetch reminder" }, { status: 500 })
  }
}

// PUT /api/reminders/[id] - Update a reminder
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

    const reminderId = params.id

    // Validate the reminder ID
    if (!ObjectId.isValid(reminderId)) {
      return NextResponse.json({ error: "Invalid reminder ID" }, { status: 400 })
    }

    // Parse the request body
    const body = await req.json()
    const { reminderDate, reminderType, mileageThreshold, message } = body

    // Validate required fields
    if (!reminderDate || !reminderType) {
      return NextResponse.json({ error: "ReminderDate and reminderType are required" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the reminder exists
    const existingReminder = await db.collection("reminders").findOne({ _id: new ObjectId(reminderId) })

    if (!existingReminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
    }

    // Update the reminder
    const updatedReminder = {
      reminderDate: new Date(reminderDate),
      reminderType,
      mileageThreshold: mileageThreshold || null,
      message: message || existingReminder.message,
      sent: false, // Reset sent status when updating
      updatedAt: new Date(),
    }

    await db.collection("reminders").updateOne({ _id: new ObjectId(reminderId) }, { $set: updatedReminder })

    return NextResponse.json({
      reminder: {
        id: reminderId,
        serviceId: existingReminder.serviceId,
        vehicleId: existingReminder.vehicleId,
        customerId: existingReminder.customerId,
        email: existingReminder.email,
        ...updatedReminder,
      },
    })
  } catch (error) {
    console.error("Error updating reminder:", error)
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 })
  }
}

// DELETE /api/reminders/[id] - Delete a reminder
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated and is an admin or worker
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const reminderId = params.id

    // Validate the reminder ID
    if (!ObjectId.isValid(reminderId)) {
      return NextResponse.json({ error: "Invalid reminder ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Check if the reminder exists
    const existingReminder = await db.collection("reminders").findOne({ _id: new ObjectId(reminderId) })

    if (!existingReminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
    }

    // Delete the reminder
    await db.collection("reminders").deleteOne({ _id: new ObjectId(reminderId) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting reminder:", error)
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 })
  }
}

