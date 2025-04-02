import { MongoClient, type Db } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/workshop-service"
const MONGODB_DB = process.env.MONGODB_DB || "workshop-service"

interface CachedConnection {
  client: MongoClient | null
  db: Db | null
}

// Cache the MongoDB connection to avoid creating new connections for each request
let cached: CachedConnection = global.mongo as CachedConnection

if (!cached) {
  cached = global.mongo = { client: null, db: null }
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.client && cached.db) {
    console.log("Using cached database connection")
    return { client: cached.client, db: cached.db }
  }

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  if (!MONGODB_DB) {
    throw new Error("Please define the MONGODB_DB environment variable")
  }

  console.log("Connecting to MongoDB...", MONGODB_URI)
  
  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(MONGODB_DB)

    // Test the connection
    await db.command({ ping: 1 })
    console.log("Successfully connected to MongoDB.")

    cached.client = client
    cached.db = db

    return { client, db }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error)
    throw error
  }
}

