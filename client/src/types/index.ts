// Re-export all types from the main types file to ensure consistency
export * from '../types';

// This ensures all imports work from both @/types and @/types/index

export interface TestCase {
  id: number;
  testCaseId: string;
  feature: string;
  scenario: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pass" | "Fail" | "Blocked" | "Not Executed";
  description?: string;
  preConditions?: string;
  testSteps?: string;
  expectedResult?: string;
  actualResult?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  moduleId?: number;
  assignedTo?: number;
  tags?: string[];
  attachments?: FileAttachment[];
}

export interface BugComment {
  id: number;
  bugId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Bug {
  id: number;
  bugId: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: "Critical" | "Major" | "Medium" | "Minor";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  environment?: string;
  preConditions?: string;
  testData?: string;
  attachments?: string[];
  comments?: string;
  projectId: number;
  moduleId?: number;
  assignedTo?: number;
  reportedBy: number;
  dateReported: string;
  updatedAt?: string;
  createdAt: string;
  githubIssueNumber?: number;
  tags?: string[];
  bugComments?: BugComment[];
}

// Test Sheet Types
export interface TestSheet {
  id: number;
  name: string;
  projectId: number;
  data: SheetData;
  metadata: SheetMetadata;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface InsertTestSheet {
  name: string;
  projectId: number;
  data: SheetData;
  metadata: SheetMetadata;
  createdById: number;
}

export interface SheetData {
  cells: Record<string, CellData>;
  rows: number;
  cols: number;
}

export interface CellData {
  value: any;
  formula?: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'formula';
  style?: CellStyle;
  validation?: CellValidation;
}

export interface CellStyle {
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  border?: BorderStyle;
}

export interface BorderStyle {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface CellValidation {
  type: 'list' | 'number' | 'date' | 'text';
  criteria: any;
  errorMessage?: string;
}

export interface SheetMetadata {
  version: number;
  lastModifiedBy: number;
  collaborators: number[];
  chartConfigs: ChartConfig[];
  namedRanges: NamedRange[];
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'column';
  title: string;
  dataRange: string;
  position: { x: number; y: number; width: number; height: number };
}

export interface NamedRange {
  name: string;
  range: string;
  description?: string;
}

// Flow Diagram Types
export interface FlowDiagram {
}

export interface Module {
  id: number;
  moduleId?: string;
  name: string;
  description?: string;
  projectId: number;
  status: "Active" | "Completed" | "On Hold";
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Project Manager' | 'Tester' | 'Developer';
  avatar?: string;
  createdAt: string;
}

export interface Notebook {
  id: number;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  userId: number;
  createdAt: string;
  updatedAt: string;
}