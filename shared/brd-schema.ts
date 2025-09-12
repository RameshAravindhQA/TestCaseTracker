
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

// BRD Document schema
export const brdDocuments = {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
  changes: text("changes"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
};

// BRD Test Cases schema
export const brdTestCases = {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brdId: integer("brd_id").notNull(),
  testCaseId: text("test_case_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  expectedResult: text("expected_result"),
  status: text("status").notNull().default("Not Executed"), // Pass, Fail, Not Executed
  notes: text("notes"),
  testedById: integer("tested_by_id"),
  testedAt: timestamp("tested_at"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
};

// TypeScript types
export type BrdDocument = typeof brdDocuments.$inferSelect;
export type InsertBrdDocument = typeof brdDocuments.$inferInsert;
export type BrdVersion = typeof brdVersions.$inferSelect;
export type InsertBrdVersion = typeof brdVersions.$inferInsert;
export type BrdTestCase = typeof brdTestCases.$inferSelect;
export type InsertBrdTestCase = typeof brdTestCases.$inferInsert;

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

export const brdTestCaseSchema = z.object({
  brdId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  expectedResult: z.string().optional(),
  status: z.enum(["Pass", "Fail", "Not Executed"]).default("Not Executed"),
  notes: z.string().optional()
});
