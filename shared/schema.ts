import { pgTable, text, serial, integer, boolean, timestamp, json, uuid, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number"),
  role: text("role").$type<"Tester" | "Developer" | "Admin">().notNull().default("Tester"),
  status: text("status").$type<"Active" | "Inactive">().notNull().default("Active"),
  profilePicture: text("profile_picture"),
  theme: text("theme").default("default"),
  tempPassword: text("temp_password"),
  tempPasswordUsed: boolean("temp_password_used").default(false),
  verificationToken: text("verification_token"),
  verified: boolean("verified").default(false),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  verificationToken: true,
  verified: true,
  resetToken: true,
  resetTokenExpires: true,
  createdAt: true,
  tempPasswordUsed: true
});

export const createUserSchema = insertUserSchema.omit({
  password: true,
  tempPassword: true,
  theme: true,
  profilePicture: true
}).extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  role: z.enum(["Tester", "Developer", "Admin"]),
  status: z.enum(["Active", "Inactive"]).default("Active")
});

// Projects model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  prefix: text("prefix").notNull(), // 3-letter project prefix for IDs
  status: text("status").$type<"Active" | "Completed" | "On Hold">().notNull().default("Active"),
  customerId: integer("customer_id"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
}).extend({
  prefix: z.string().min(2, "Prefix must be at least 2 characters").max(5, "Prefix must be at most 5 characters").regex(/^[A-Z]+$/, "Prefix must contain only uppercase letters")
});

// Project members table (many-to-many)
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").$type<"Tester" | "Developer" | "Admin">().notNull(),
});

export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({
  id: true,
});

// Modules model
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  moduleId: text("module_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  status: text("status").$type<"Active" | "Completed" | "On Hold">().notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  moduleId: true,
  createdAt: true,
});

// Test cases model
export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  testCaseId: text("test_case_id").notNull(),
  moduleId: integer("module_id").notNull(),
  projectId: integer("project_id").notNull(),
  feature: text("feature").notNull(),
  testObjective: text("test_objective").notNull(),
  preConditions: text("pre_conditions"),
  testSteps: text("test_steps").notNull(),
  expectedResult: text("expected_result").notNull(),
  actualResult: text("actual_result"),
  status: text("status").$type<"Pass" | "Fail" | "Blocked" | "Not Executed">().notNull().default("Not Executed"),
  priority: text("priority").$type<"High" | "Medium" | "Low">().notNull().default("Medium"),
  comments: text("comments"),
  tags: json("tags").default([]),
  createdById: integer("created_by_id").notNull(),
  assignedToId: integer("assigned_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertTestCaseSchema = createInsertSchema(testCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Bug reports model
export const bugs = pgTable("bugs", {
  id: serial("id").primaryKey(),
  bugId: text("bug_id").notNull(),
  title: text("title").notNull(),
  reportedById: integer("reported_by_id").notNull(),
  dateReported: timestamp("date_reported").defaultNow(),
  severity: text("severity").$type<"Critical" | "Major" | "Minor" | "Trivial">().notNull(),
  priority: text("priority").$type<"High" | "Medium" | "Low">().notNull(),
  environment: text("environment"),
  status: text("status").$type<"Open" | "In Progress" | "Resolved" | "Closed">().notNull().default("Open"),
  preConditions: text("pre_conditions"),
  stepsToReproduce: text("steps_to_reproduce").notNull(),
  expectedResult: text("expected_result").notNull(),
  actualResult: text("actual_result").notNull(),
  attachments: json("attachments").default([]),
  screenshotRequired: boolean("screenshot_required").default(false),
  comments: text("comments"),
  projectId: integer("project_id").notNull(),
  moduleId: integer("module_id"),
  testCaseId: integer("test_case_id"),
  assignedToId: integer("assigned_to_id"),
  updatedAt: timestamp("updated_at"),
});

export const insertBugSchema = createInsertSchema(bugs).omit({
  id: true,
  dateReported: true,
  updatedAt: true,
});

// Activity log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

// Test Case Settings - Testing Types model
export const testingTypes = pgTable("testing_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestingTypeSchema = createInsertSchema(testingTypes).omit({
  id: true,
  createdAt: true,
});

// Field Definitions model for testing types
export const testingTypeFields = pgTable("testing_type_fields", {
  id: serial("id").primaryKey(),
  testingTypeId: integer("testing_type_id").notNull(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  type: text("type").$type<"text" | "textarea" | "select" | "multiselect" | "checkbox" | "radio" | "date" | "number" | "auto">().notNull(),
  options: json("options").default([]),
  defaultValue: text("default_value"),
  placeholder: text("placeholder"),
  required: boolean("required").default(false),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestingTypeFieldSchema = createInsertSchema(testingTypeFields).omit({
  id: true,
  createdAt: true,
});

// Types based on schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

export type Bug = typeof bugs.$inferSelect;
export type InsertBug = z.infer<typeof insertBugSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Document Folders model
export const documentFolders = pgTable("document_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  projectId: integer("project_id").notNull(),
  parentFolderId: integer("parent_folder_id"),
  createdById: integer("created_by_id").notNull(),
  viewType: text("view_type").$type<"List" | "Grid" | "Windows">().default("List"),
  icon: text("icon"),
  path: text("path"),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertDocumentFolderSchema = createInsertSchema(documentFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  path: true
});

// Documents model
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  icon: text("icon"),
  folderId: integer("folder_id"),
  projectId: integer("project_id").notNull(),
  path: text("path"),
  isDeleted: boolean("is_deleted").default(false),
  uploadedById: integer("uploaded_by_id").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
  isDeleted: true,
  path: true
});

// Types based on schemas for document management
export type DocumentFolder = typeof documentFolders.$inferSelect;
export type InsertDocumentFolder = z.infer<typeof insertDocumentFolderSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// Customers model
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  status: text("status").$type<"Active" | "Inactive">().notNull().default("Active"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

// Tags model
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  projectId: integer("project_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

// Timesheet Folders model
export const timeSheetFolders = pgTable("timesheet_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id"),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertTimeSheetFolderSchema = createInsertSchema(timeSheetFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TimeSheetFolder = typeof timeSheetFolders.$inferSelect;
export type InsertTimeSheetFolder = z.infer<typeof insertTimeSheetFolderSchema>;

// Traceability Matrix model
export const traceabilityMatrix = pgTable("traceability_matrix", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertTraceabilityMatrixSchema = createInsertSchema(traceabilityMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Traceability Matrix Modules model
export const traceabilityModules = pgTable("traceability_modules", {
  id: serial("id").primaryKey(),
  matrixId: integer("matrix_id").notNull(),
  moduleId: integer("module_id").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTraceabilityModuleSchema = createInsertSchema(traceabilityModules).omit({
  id: true,
  createdAt: true,
});

// Traceability Matrix Markers model
export const traceabilityMarkers = pgTable("traceability_markers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#007bff"),
  icon: text("icon"),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Matrix Cell Values model (for Yes/No values)
export const matrixCells = pgTable("matrix_cells", {
  id: serial("id").primaryKey(),
  rowModuleId: integer("row_module_id").notNull(),
  colModuleId: integer("col_module_id").notNull(),
  projectId: integer("project_id").notNull(),
  value: text("value").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Custom Markers for the matrix
export const customMarkers = pgTable("custom_markers", {
  id: serial("id").primaryKey(),
  markerId: text("marker_id").notNull(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  type: text("type").notNull(),
  projectId: integer("project_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertTraceabilityMarkerSchema = createInsertSchema(traceabilityMarkers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Traceability Matrix Cells model
export const traceabilityMatrixCells = pgTable("traceability_matrix_cells", {
  id: serial("id").primaryKey(),
  matrixId: integer("matrix_id").notNull(),
  sourceModuleId: integer("source_module_id").notNull(),
  targetModuleId: integer("target_module_id").notNull(),
  markerId: integer("marker_id").notNull(),
  notes: text("notes"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertTraceabilityMatrixCellSchema = createInsertSchema(traceabilityMatrixCells).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types based on schemas for traceability matrix
export type TraceabilityMatrix = typeof traceabilityMatrix.$inferSelect;
export type InsertTraceabilityMatrix = z.infer<typeof insertTraceabilityMatrixSchema>;

export type TraceabilityModule = typeof traceabilityModules.$inferSelect;
export type InsertTraceabilityModule = z.infer<typeof insertTraceabilityModuleSchema>;

export type TraceabilityMarker = typeof traceabilityMarkers.$inferSelect;
export type InsertTraceabilityMarker = z.infer<typeof insertTraceabilityMarkerSchema>;

export type TraceabilityMatrixCell = typeof traceabilityMatrixCells.$inferSelect;
export type InsertTraceabilityMatrixCell = z.infer<typeof insertTraceabilityMatrixCellSchema>;

// Create schemas for matrix cells and custom markers
export const insertMatrixCellSchema = createInsertSchema(matrixCells).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomMarkerSchema = createInsertSchema(customMarkers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MatrixCell = typeof matrixCells.$inferSelect;
export type InsertMatrixCell = z.infer<typeof insertMatrixCellSchema>;

export type CustomMarker = typeof customMarkers.$inferSelect;
export type InsertCustomMarker = z.infer<typeof insertCustomMarkerSchema>;

// Type for cell values in the UI
export type CellValue = {
  type: 'checkmark' | 'x-mark' | 'custom' | 'empty';
  color?: string;
  label?: string;
};

// Timesheets model
export const timeSheets = pgTable("time_sheets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  customerId: integer("customer_id"),
  // Allow both project ID or project name (by using a text field in the database)
  projectId: text("project_id").notNull(),
  folderId: integer("folder_id"),
  moduleId: integer("module_id"),
  testCaseId: integer("test_case_id"),
  bugId: integer("bug_id"),
  description: text("description").notNull(),
  workDate: timestamp("work_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  tags: json("tags").default([]),
  hours: integer("hours").notNull(),
  status: text("status").$type<"Pending" | "Approved" | "Rejected">().notNull().default("Pending"),
  approvedById: integer("approved_by_id"),
  approvalDate: timestamp("approval_date"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Create the base schema (private, not exported)
const baseTimeSheetSchema = createInsertSchema(timeSheets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvalDate: true,
});

// Create an enhanced schema with better validation and type conversion
export const insertTimeSheetSchema = baseTimeSheetSchema
  .extend({
    // More robust description validation
    description: z.string().min(3, "Description must be at least 3 characters"),

    // Very flexible projectId handling - accepts string or number
    // We'll store it as a string in the database to avoid integer overflow issues
    projectId: z.preprocess(
      (val) => {
        // For null or undefined, return an empty string
        if (val === null || val === undefined) return "";

        // If it's already a string, just return it
        if (typeof val === 'string') return val;

        // If it's a number, convert to string
        if (typeof val === 'number') return String(val);

        // For any other type, convert to string
        return String(val);
      },
      z.string()
    ),

    // Ensure userId is a safe integer
    userId: z.coerce.number().int().positive("User ID must be positive").max(2147483647, "User ID is too large"),

    // Make customerId optional and validate as integer if present
    customerId: z.union([
      z.string().transform(val => {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
      }),
      z.number().int().positive("Customer ID must be positive"),
      z.undefined()
    ]).optional(),

    // Make folderId optional and validate as integer if present
    folderId: z.union([
      z.string().transform(val => {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error("Invalid folder ID format");
        }
        return parsed;
      }),
      z.number().int().positive("Folder ID must be positive")
    ]).transform(val => {
      // Final type enforcement
      const asNumber = Number(val);
      if (isNaN(asNumber) || asNumber <= 0 || asNumber > 2147483647) {
        throw new Error("Folder ID must be a valid positive integer");
      }
      return asNumber;
    }),

    // Accept string inputs for all date fields and convert during processing
    workDate: z.union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
      z.date()
    ]),

    // Accept time as a string in HH:MM format or null for default values
    startTime: z.preprocess(
      // Preprocess ensures we get a consistent format
      (val) => {
        // Handle null or undefined
        if (val === null || val === undefined) return "09:00";
        // Handle Date objects
        if (val instanceof Date) {
          if (isNaN(val.getTime())) return "09:00";
          return `${val.getHours().toString().padStart(2, '0')}:${val.getMinutes().toString().padStart(2, '0')}`;
        }
        // Return string as-is
        return val;
      },
      // Then validate the result
      z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format")
        .default("09:00")
    ),

    // Accept end time as a string in HH:MM format or null for default values
    endTime: z.preprocess(
      // Preprocess ensures we get a consistent format
      (val) => {
        // Handle null or undefined
        if (val === null || val === undefined) return "17:00";
        // Handle Date objects
        if (val instanceof Date) {
          if (isNaN(val.getTime())) return "17:00";
          return `${val.getHours().toString().padStart(2, '0')}:${val.getMinutes().toString().padStart(2, '0')}`;
        }
        // Return string as-is
        return val;
      },
      // Then validate the result
      z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format")
        .default("17:00")
    ),

    // Ensure hours is a safe integer with a reasonable maximum
    hours: z.coerce.number().min(0).max(24)
  })
  .transform((data) => {
    // Process time fields that might be null or in HH:MM format
    // Handle null or invalid startTime
    if (!data.startTime) {
      data.startTime = "09:00";
    }

    // Handle null or invalid endTime
    if (!data.endTime) {
      data.endTime = "17:00";
    }

    if (data.workDate) {
      if (data.workDate instanceof Date && isNaN(data.workDate.getTime())) {
        // Handle the case where Date constructor failed
        data.workDate = new Date();
      }

      // Note: We no longer need to convert startTime and endTime to Date objects
      // as they are directly handled in their preprocessors
    }

    // Ensure hours is within safe integer range
    if (data.hours !== undefined) {
      data.hours = Math.min(Math.max(0, data.hours), 24);
    }

    return data;
  });

export type TimeSheet = typeof timeSheets.$inferSelect;
// Use our enhanced schema type for InsertTimeSheet
export type InsertTimeSheet = z.infer<typeof insertTimeSheetSchema>;

// Add a schema and types for activities that work with customers and projects
export const customerProjects = pgTable("customer_projects", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  projectId: integer("project_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerProjectSchema = createInsertSchema(customerProjects).omit({
  id: true,
  createdAt: true,
});

export type CustomerProject = typeof customerProjects.$inferSelect;
export type InsertCustomerProject = z.infer<typeof insertCustomerProjectSchema>;

// Kanban Board Schema
// Define tables first
export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").$type<"Planning" | "Active" | "Completed">().notNull().default("Planning"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const kanbanColumns = pgTable("kanban_columns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  projectId: integer("project_id").notNull(),
  sprintId: integer("sprint_id"),
  order: integer("order").notNull(),
  color: text("color").default("#4F46E5"), // Default indigo color
  isDefault: boolean("is_default").default(false),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const kanbanCards = pgTable("kanban_cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  columnId: integer("column_id").notNull(),
  sprintId: integer("sprint_id"),
  projectId: integer("project_id").notNull(),
  priority: text("priority").$type<"Low" | "Medium" | "High" | "Critical">().notNull().default("Medium"),
  order: integer("order").notNull(),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  assigneeId: integer("assignee_id"),
  assigneeName: text("assignee_name"),
  parentId: integer("parent_id"),
  testCaseId: integer("test_case_id"),
  bugId: integer("bug_id"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  dueDate: date("due_date"),
  labels: json("labels").default([]),
  attachments: json("attachments").default([]),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Create insert schemas
export const insertSprintSchema = createInsertSchema(sprints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKanbanColumnSchema = createInsertSchema(kanbanColumns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKanbanCardSchema = createInsertSchema(kanbanCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define relations after all tables are created
export const sprintsRelations = relations(sprints, ({ many, one }) => ({
  project: one(projects, {
    fields: [sprints.projectId],
    references: [projects.id]
  }),
  columns: many(kanbanColumns),
  cards: many(kanbanCards),
}));

export const kanbanColumnsRelations = relations(kanbanColumns, ({ many, one }) => ({
  project: one(projects, {
    fields: [kanbanColumns.projectId],
    references: [projects.id]
  }),
  sprint: one(sprints, {
    fields: [kanbanColumns.sprintId],
    references: [sprints.id]
  }),
  cards: many(kanbanCards),
}));

export const kanbanCardsRelations = relations(kanbanCards, ({ one }) => ({
  column: one(kanbanColumns, {
    fields: [kanbanCards.columnId],
    references: [kanbanColumns.id]
  }),
  sprint: one(sprints, {
    fields: [kanbanCards.sprintId],
    references: [sprints.id]
  }),
  project: one(projects, {
    fields: [kanbanCards.projectId],
    references: [projects.id]
  }),
  assignee: one(users, {
    fields: [kanbanCards.assigneeId],
    references: [users.id]
  }),
  testCase: one(testCases, {
    fields: [kanbanCards.testCaseId],
    references: [testCases.id]
  }),
  bug: one(bugs, {
    fields: [kanbanCards.bugId],
    references: [bugs.id]
  }),
}));

// Types based on schemas for Kanban board
export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = z.infer<typeof insertSprintSchema>;

export type KanbanColumn = typeof kanbanColumns.$inferSelect;
export type InsertKanbanColumn = z.infer<typeof insertKanbanColumnSchema>;

export type KanbanCard = typeof kanbanCards.$inferSelect;
export type InsertKanbanCard = z.infer<typeof insertKanbanCardSchema>;

// Traceability Matrix - Custom Markers (already defined above, commented out to avoid duplication)
// We already have this definition earlier in the file

// Traceability Matrix - Cell Data (already defined above)
/* This matrixCells table is already defined earlier in the file
export const matrixCells = pgTable("matrix_cells", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  rowModuleId: integer("row_module_id").notNull(),
  colModuleId: integer("col_module_id").notNull(),
  value: json("value").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
*/
// insertMatrixCellSchema is also already defined earlier

// These types are already defined earlier in the file
// export type CustomMarker = typeof customMarkers.$inferSelect;
// export type InsertCustomMarker = z.infer<typeof insertCustomMarkerSchema>;
// 
// export type MatrixCell = typeof matrixCells.$inferSelect;
// export type InsertMatrixCell = z.infer<typeof insertMatrixCellSchema>;

// Cell value schema for validation
export const cellValueSchema = z.object({
  type: z.enum(["checkmark", "x-mark", "custom", "empty"]),
  color: z.string().optional(),
  label: z.string().optional(),
});

// This CellValue type is already defined earlier in the file
// export type CellValue = z.infer<typeof cellValueSchema>;

// Test Sheets schema
export const insertTestSheetSchema = z.object({
  name: z.string().min(1, "Sheet name is required"),
  projectId: z.number(),
  data: z.object({
    cells: z.record(z.string(), z.object({
      value: z.any(),
      formula: z.string().optional(),
      type: z.enum(['text', 'number', 'date', 'boolean', 'formula']),
      style: z.object({
        fontWeight: z.enum(['normal', 'bold']).optional(),
        fontStyle: z.enum(['normal', 'italic']).optional(),
        textAlign: z.enum(['left', 'center', 'right']).optional(),
        backgroundColor: z.string().optional(),
        color: z.string().optional(),
        fontSize: z.number().optional(),
        border: z.object({
          top: z.string().optional(),
          right: z.string().optional(),
          bottom: z.string().optional(),
          left: z.string().optional(),
        }).optional(),
      }).optional(),
      validation: z.object({
        type: z.enum(['list', 'number', 'date', 'text']),
        criteria: z.any(),
        errorMessage: z.string().optional(),
      }).optional(),
    })),
    rows: z.number(),
    cols: z.number(),
  }),
  metadata: z.object({
    version: z.number(),
    lastModifiedBy: z.number(),
    collaborators: z.array(z.number()),
    chartConfigs: z.array(z.object({
      id: z.string(),
      type: z.enum(['line', 'bar', 'pie', 'column']),
      title: z.string(),
      dataRange: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    })),
    namedRanges: z.array(z.object({
      name: z.string(),
      range: z.string(),
      description: z.string().optional(),
    })),
  }),
  createdById: z.number(),
});

export type TestSheet = z.infer<typeof insertTestSheetSchema> & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export type InsertTestSheet = z.infer<typeof insertTestSheetSchema>;

