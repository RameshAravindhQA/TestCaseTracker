import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  console.log("Please create a PostgreSQL database in Replit:");
  console.log("1. Click on the 'Database' tab in the sidebar");
  console.log("2. Click 'Create Database' and select 'PostgreSQL'");
  process.exit(1);
}

console.log("🔄 Connecting to PostgreSQL database...");

const client = postgres(connectionString, {
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);

// Test database connection
export async function testConnection() {
  try {
    await client`SELECT 1`;
    console.log("✅ PostgreSQL database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Close connection function
export async function closeConnection() {
  try {
    await client.end();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}

import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const testSheets = pgTable("test_sheets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  projectId: integer("project_id").notNull(),
  data: text("data").notNull(), // JSON string of SheetData
  metadata: text("metadata").notNull(), // JSON string of SheetMetadata
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flowDiagrams = pgTable("flow_diagrams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }),
  description: text("description"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: integer("created_by_id").notNull(),
  projectId: integer("project_id").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdById: integer("created_by_id").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  flowDiagramId: integer("flow_diagram_id").notNull(),
  testName: varchar("test_name", { length: 256 }).notNull(),
  result: text("result"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const testSuites = pgTable("test_suites", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  testSuiteId: integer("test_suite_id").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  preConditions: text("pre_conditions"),
  steps: text("steps"),
  expectedResult: text("expected_result"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});