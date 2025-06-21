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