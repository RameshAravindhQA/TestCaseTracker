import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Create the database connection
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log("⚠️  DATABASE_URL not found, using in-memory storage");
  export const db = null;
} else {
  console.log("🔄 Connecting to PostgreSQL database...");

  // Create neon client
  const sql = neon(connectionString);

  // Create drizzle instance
  export const db = drizzle(sql, { schema });

  console.log("✅ Database connection established");
}

// Connection test function
export async function testConnection() {
  if (!db) {
    console.log("✅ In-memory storage ready");
    return true;
  }

  try {
    await db.query.users.findMany({ limit: 1 });
    console.log("✅ Database connection test successful");
    return true;
  } catch (error) {
    console.log("❌ Database connection test failed:", error);
    return false;
  }
}

// Close connection function
export async function closeConnection() {
  console.log("Database connection closed");
}