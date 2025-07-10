import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, integer, timestamp, json } from "drizzle-orm/pg-core";

// Flow diagram model
export const flowDiagrams = pgTable("flow_diagrams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  data: json("data").notNull(), // Stores the diagram nodes, edges, and layout
  version: text("version").default("1.0"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertFlowDiagramSchema = createInsertSchema(flowDiagrams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types based on schemas
export type FlowDiagram = typeof flowDiagrams.$inferSelect;
export type InsertFlowDiagram = z.infer<typeof insertFlowDiagramSchema>;

// Node types for flow diagram
export enum FlowNodeType {
  START = "START",
  END = "END",
  STEP = "STEP",
  DECISION = "DECISION",
  SUBPROCESS = "SUBPROCESS",
  LINKED_REQUIREMENT = "LINKED_REQUIREMENT",
  LINKED_TESTCASE = "LINKED_TESTCASE",
  API_CALL = "API_CALL",
  EXTERNAL_SYSTEM = "EXTERNAL_SYSTEM",
}

// Flow diagram node type
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    description?: string;
    linkedItemId?: number; // ID of a test case, requirement, or bug
    linkedItemType?: string; // "testCase", "requirement", "bug"
    customFields?: Record<string, any>;
  };
  style?: Record<string, any>;
}

// Flow diagram edge type
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string; // "success", "failure", "default"
  style?: Record<string, any>;
}

// The complete flow diagram data structure
export interface FlowDiagramData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: {
    name: string;
    description?: string;
    version?: string;
    createdBy?: number;
    createdAt?: string;
    updatedAt?: string;
  };
}