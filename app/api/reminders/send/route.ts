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

// POST /api/reminders/send - Send all unsent reminders
export async function POST(req: NextRequest) {
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

    // Get all unsent reminders
    const reminders = await db
      .collection("reminders")
      .find({ sent: false })
      .toArray()

    if (reminders.length === 0) {
      return NextResponse.json({
        message: "No unsent reminders found",
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
    const now = new Date()
    const results = await Promise.all(
      reminders.map(async (reminder) => {
        try {
          // Get vehicle and service details
          const [vehicle, service] = await Promise.all([
            db.collection("vehicles").findOne({ _id: new ObjectId(reminder.vehicleId) }),
            db.collection("services").findOne({ _id: new ObjectId(reminder.serviceId) })
          ])

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
          await db.collection("reminders").updateOne(
            { _id: reminder._id },
            { $set: { sent: true, updatedAt: now } }
          )

          return true
        } catch (error) {
          console.error(`Error sending reminder ${reminder._id}:`, error)
          return false
        }
      })
    )

    const successCount = results.filter(Boolean).length

    return NextResponse.json({
      message: `Successfully sent ${successCount} of ${reminders.length} reminders`,
      count: successCount,
    })
  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
} 