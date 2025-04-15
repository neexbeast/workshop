import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function sendMail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })

    console.log("Email sent:", info.messageId)
    return info
  } catch (error) {
    console.error("Error sending email:", error)
    throw new Error("Failed to send email")
  }
} 