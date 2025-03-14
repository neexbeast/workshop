import { MongoClient, type Db } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/workshop-service"
const MONGODB_DB = process.env.MONGODB_DB || "workshop-service"

// Check if we're in a production environment
const isProd = process.env.NODE_ENV === "production"

interface CachedConnection {
  client: MongoClient | null
  db: Db | null
}

// Cache the MongoDB connection to avoid creating new connections for each request
let cached: CachedConnection = global.mongo

if (!cached) {
  cached = global.mongo = { client: null, db: null }
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db }
  }

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  if (!MONGODB_DB) {
    throw new Error("Please define the MONGODB_DB environment variable")
  }

  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }

  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)

  cached.client = client
  cached.db = db

  return { client, db }
}

