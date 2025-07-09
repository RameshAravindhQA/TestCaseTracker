
// Define all needed types for the application

// User type
export interface User {
  id: number;
  name: string;
  email: string;
  role: "Tester" | "Developer" | "Admin";
  verified?: boolean;
  createdAt: string;
}

// Project type
export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: "Active" | "Completed" | "On Hold";
  createdById: number;
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

// Project member type
export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: 'Tester' | 'Developer' | 'Admin';
  user?: User;
}

// Module type
export interface Module {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  status: "Active" | "Completed" | "On Hold";
  createdAt: string;
}

// Tag type
export interface Tag {
  id: number | string;
  name: string;
  color: string;
  projectId?: number;
  createdAt?: string;
}

// File attachment type
export interface FileAttachment {
  id?: number;
  name: string;
  type: string;
  data?: string; // base64 encoded file content
  size: number;
  entityType?: string;
  entityId?: number;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  uploadedById?: number;
  uploadedAt?: string;
}

// TestCase type
export interface TestCase {
  id: number;
  testCaseId: string;
  moduleId: number;
  projectId: number;
  feature: string;
  testObjective: string;
  preConditions: string | null;
  testSteps: string;
  expectedResult: string;
  actualResult: string | null;
  status: "Pass" | "Fail" | "Blocked" | "Not Executed";
  priority: "High" | "Medium" | "Low";
  comments: string | null;
  tags?: Tag[];
  hasAutomation?: boolean;
  automationScript?: string | null;
  automationEngine?: "Selenium" | "Playwright" | "Cypress" | null;
  lastExecutionDate?: string | null;
  lastExecutionStatus?: "Pass" | "Fail" | "Error" | null;
  createdById: number;
  assignedToId: number | null;
  createdAt: string;
  updatedAt: string | null;
  module?: Module;
}

// Bug interface - Main definition with all required fields
export interface Bug {
  id: number;
  bugId: string;
  title: string;
  description?: string;
  stepsToReproduce: string;
  severity: "Critical" | "Major" | "Minor" | "Trivial";
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  projectId: number;
  testCaseId: number | null;
  moduleId: number | null;
  reportedById: number;
  assignedToId: number | null;
  createdAt: string;
  updatedAt: string | null;
  resolvedDate: string | null;
  environment: string | null;
  browserInfo: string | null;
  operatingSystem: string | null;
  deviceInfo: string | null;
  preConditions: string | null;
  expectedResult: string;
  actualResult: string;
  comments: string | null;
  dateReported?: string;
  attachments?: FileAttachment[];
  tags?: Tag[];
  module?: Module;
  assignedTo?: User;
}

// Activity type
export interface Activity {
  id: number;
  projectId?: number;
  entityType: string;
  entityId: number;
  action: string;
  details: any;
  userId: number;
  timestamp: string;
  user?: User;
}

// Formatted activity type
export interface FormattedActivity extends Activity {
  formattedMessage: string;
  iconColor: string;
  iconName: string;
  timeAgo: string;
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Dashboard stats
export interface DashboardStats {
  totalProjects: number;
  totalTestCases: number;
  totalModules?: number;
  totalBugs?: number;
  openBugs?: number;
  passRate: number;
  totalDocuments?: number;
  
  testCaseStatusCounts?: {
    passed: number;
    failed: number;
    blocked: number;
    notExecuted: number;
  };
  
  testsByStatus?: {
    label: string;
    value: number;
  }[];
  
  bugSeverityCounts?: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  bugsBySeverity?: {
    label: string;
    value: number;
  }[];
  
  bugStatusCounts?: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  
  recentActivity?: Activity[];
}

// CSV import/export structure
export interface CSVTestCase {
  testCaseId?: string;
  moduleId?: string;
  module?: string;
  feature: string;
  testObjective: string;
  preConditions?: string;
  testSteps: string;
  expectedResult: string;
  actualResult?: string;
  status?: string;
  priority?: string;
  comments?: string;
}

// CSV Bug import structure
export interface CSVBug {
  title: string;
  description?: string;
  stepsToReproduce: string;
  severity: "Critical" | "Major" | "Minor" | "Trivial";
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  projectId?: string;
  moduleId?: string;
  assignedToId?: string;
  environment?: string;
  browserInfo?: string;
  operatingSystem?: string;
  deviceInfo?: string;
  tags?: string;
}

// Document type
export interface Document {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  folderId: number | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  version: number;
  createdById: number;
  createdAt: string;
  updatedAt: string | null;
}

// Document folder type
export interface DocumentFolder {
  id: number;
  name: string;
  description: string | null;
  projectId: number;
  parentFolderId: number | null;
  createdById: number;
  createdAt: string;
}

// Chat and Messenger types
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title: string;
  participants: number[];
  isActive: boolean;
  createdAt: string;
  lastMessageAt?: string;
  lastMessage?: ChatMessage;
  avatar?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'audio';
  sentAt: string;
  editedAt?: string;
  replyToId?: string;
  isEdited?: boolean;
  isPinned?: boolean;
  reactions?: MessageReaction[];
  attachments?: FileAttachment[];
  sender?: User;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: number;
  emoji: string;
  createdAt: string;
}

// Test Sheet types
export interface TestSheet {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  data: TestSheetCell[][];
  createdById: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TestSheetCell {
  id?: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  format?: 'bold' | 'italic' | 'underline';
  alignment?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  textColor?: string;
  formula?: string;
  validation?: {
    type: 'required' | 'email' | 'number' | 'date';
    message?: string;
  };
  options?: string[]; // for select type
  isHeader?: boolean;
}
