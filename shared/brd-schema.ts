
import { z } from "zod";
import { sql } from "drizzle-orm";
import { text, integer, boolean, timestamp } from "drizzle-orm/sqlite-core";

// BRD Document Status enum
export const BRD_STATUS = {
  DRAFT: "Draft",
  REVIEW: "Review", 
  APPROVED: "Approved",
  REJECTED: "Rejected"
} as const;

// BRD Document schema with auto-generated ID
export const brdDocuments = {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: text("document_id").notNull().unique(), // Auto-generated: BEG-REQ-001
  title: text("title").notNull(),
  author: text("author").notNull(),
  projectId: integer("project_id").notNull(),
  version: text("version").notNull().default("1.0"),
  status: text("status").notNull().default(BRD_STATUS.DRAFT),
  overview: text("overview"),
  problemStatement: text("problem_statement"),
  objectives: text("objectives"),
  scope: text("scope"),
  userStories: text("user_stories"),
  functionalRequirements: text("functional_requirements"),
  nonFunctionalRequirements: text("non_functional_requirements"),
  designNotes: text("design_notes"),
  dependencies: text("dependencies"),
  assumptions: text("assumptions"),
  acceptanceCriteria: text("acceptance_criteria"),
  risks: text("risks"),
  supportingDocuments: text("supporting_documents"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
};

// BRD Version History schema
export const brdVersions = {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brdId: integer("brd_id").notNull(),
  version: text("version").notNull(),
  data: text("data"), // JSON data of the document at this version
  comment: text("comment"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
};

// Functional Requirements schema (replaces BRD Test Cases)
export const functionalRequirements = {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brdId: integer("brd_id").notNull(),
  requirementId: text("requirement_id").notNull().unique(), // Auto-generated: BEG-REQ-001-FR-001
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("Medium"), // High, Medium, Low
  status: text("status").notNull().default("Not Executed"), // Pass, Fail, Not Executed
  acceptanceCriteria: text("acceptance_criteria"),
  notes: text("notes"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
};

// Requirements Test Case Mapping for RTM
export const requirementTestCaseMapping = {
  id: integer("id").primaryKey({ autoIncrement: true }),
  functionalRequirementId: integer("functional_requirement_id").notNull(),
  testCaseId: integer("test_case_id").notNull(),
  projectId: integer("project_id").notNull(),
  status: text("status").notNull().default("Not Executed"), // Pass, Fail, Not Executed
  executionDate: timestamp("execution_date"),
  notes: text("notes"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
};

// TypeScript types
export type BrdDocument = typeof brdDocuments.$inferSelect;
export type InsertBrdDocument = typeof brdDocuments.$inferInsert;
export type BrdVersion = typeof brdVersions.$inferSelect;
export type InsertBrdVersion = typeof brdVersions.$inferInsert;
export type FunctionalRequirement = typeof functionalRequirements.$inferSelect;
export type InsertFunctionalRequirement = typeof functionalRequirements.$inferInsert;
export type RequirementTestCaseMapping = typeof requirementTestCaseMapping.$inferSelect;
export type InsertRequirementTestCaseMapping = typeof requirementTestCaseMapping.$inferInsert;

// Form schemas
export const brdDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  projectId: z.number(),
  overview: z.string().optional(),
  problemStatement: z.string().optional(),
  objectives: z.string().optional(),
  scope: z.string().optional(),
  userStories: z.string().optional(),
  functionalRequirements: z.string().optional(),
  nonFunctionalRequirements: z.string().optional(),
  designNotes: z.string().optional(),
  dependencies: z.string().optional(),
  assumptions: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  risks: z.string().optional(),
  supportingDocuments: z.string().optional()
});

export const functionalRequirementSchema = z.object({
  brdId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  status: z.enum(["Pass", "Fail", "Not Executed"]).default("Not Executed"),
  acceptanceCriteria: z.string().optional(),
  notes: z.string().optional()
});

export const requirementTestCaseMappingSchema = z.object({
  functionalRequirementId: z.number(),
  testCaseId: z.number(),
  projectId: z.number(),
  status: z.enum(["Pass", "Fail", "Not Executed"]).default("Not Executed"),
  notes: z.string().optional()
});
