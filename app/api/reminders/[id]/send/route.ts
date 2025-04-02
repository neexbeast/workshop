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

// POST /api/reminders/[id]/send - Send a specific reminder
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated and is an admin
    const decodedToken = await verifyAuthToken(req)
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (decodedToken.role !== "admin" && decodedToken.role !== "worker") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid reminder ID" }, { status: 400 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get the reminder
    const reminder = await db.collection("reminders").findOne({ _id: new ObjectId(id) })

    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
    }

    // Get vehicle and service details
    const [vehicle, service] = await Promise.all([
      db.collection("vehicles").findOne({ _id: new ObjectId(reminder.vehicleId) }),
      db.collection("services").findOne({ _id: new ObjectId(reminder.serviceId) })
    ])

    if (!vehicle || !service) {
      return NextResponse.json({ error: "Vehicle or service not found" }, { status: 404 })
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
    const now = new Date()
    await db.collection("reminders").updateOne(
      { _id: new ObjectId(id) },
      { $set: { sent: true, updatedAt: now } }
    )

    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully"
    })
  } catch (error) {
    console.error("Error sending reminder:", error)
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 })
  }
} 