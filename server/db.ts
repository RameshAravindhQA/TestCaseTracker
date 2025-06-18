// Mock database file for in-memory storage mode
// This file replaces the PostgreSQL connection to avoid import errors

console.log("🔄 Using in-memory storage - no database connection required");

// Mock database instance for compatibility
export const db = null;

// Mock connection test function
export async function testConnection() {
  console.log("✅ In-memory storage ready");
  return true;
}

// Mock close connection function
export async function closeConnection() {
  console.log("In-memory storage - no connection to close");
}