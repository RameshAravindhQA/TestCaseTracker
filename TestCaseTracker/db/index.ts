import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Create the database connection
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Create neon client
const sql = neon(connectionString);

// Create drizzle instance
export const db = drizzle(sql, { schema });

// Export all schema tables and types
export * from "../shared/schema";