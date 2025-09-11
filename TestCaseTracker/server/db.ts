import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Create the database connection
const connectionString = process.env.DATABASE_URL;

// Database instance
export let db: ReturnType<typeof drizzle> | null = null;

if (!connectionString) {
  console.log("⚠️  DATABASE_URL not found, using in-memory storage");
} else {
  console.log("🔄 Connecting to PostgreSQL database...");
  
  try {
    // Create neon client
    const sql = neon(connectionString);
    
    // Create drizzle instance
    db = drizzle(sql, { schema });
    
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    db = null;
  }
}

// Connection test function
export async function testConnection() {
  if (!db) {
    console.log("✅ In-memory storage ready");
    return true;
  }
  
  try {
    // Simple query to test connection
    await db.select().from(schema.users).limit(1);
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

// Export the schema for use in other modules
export * from "../shared/schema";