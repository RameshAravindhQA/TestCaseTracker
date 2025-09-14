
import { db } from './db';
import { users, projects, modules } from '../shared/schema';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  if (!db) {
    console.log("Database not available, skipping initialization");
    return;
  }

  try {
    // Check if admin user exists
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log("🔧 Creating default admin user...");
      
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.insert(users).values({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@testcasetracker.com',
        password: hashedPassword,
        role: 'Admin',
        status: 'Active',
        verified: true
      });
      
      console.log("✅ Default admin user created");
      console.log("📧 Email: admin@testcasetracker.com");
      console.log("🔑 Password: admin123");
    }
    
    console.log("✅ Database initialization completed");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}
