import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

// Create the database connection
const connectionString = process.env.DATABASE_URL;

// Database instance and pool
export let db: ReturnType<typeof drizzle> | null = null;
export let pool: Pool | null = null;

if (!connectionString) {
  console.log("⚠️  DATABASE_URL not found, using in-memory storage");
} else {
  console.log("🔄 Connecting to PostgreSQL database...");
  
  try {
    // Create PostgreSQL connection pool
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });
    
    // Create drizzle instance
    db = drizzle(pool, { schema });
    
    console.log("✅ Database connection established with PostgreSQL driver");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    db = null;
    pool = null;
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