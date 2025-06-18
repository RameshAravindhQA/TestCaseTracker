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

export interface Bug {
  id: number;
  bugId: string;
  title: string;
  severity: "Critical" | "Major" | "Minor" | "Trivial";
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  description?: string;
  environment?: string;
  preConditions?: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  comments?: string;
  dateReported: string;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  moduleId?: number;
  assignedTo?: number;
  tags?: string[];
  attachments?: FileAttachment[];
}