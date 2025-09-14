import {
  User,
  Project,
  ProjectMember,
  Module,
  TestCase,
  Bug,
  Activity,
  TimeSheet,
  TimeSheetFolder,
  Customer,
  CustomerProject,
  Sprint,
  KanbanColumn,
  KanbanCard,
  CustomMarker,
  MatrixCell,
  TraceabilityMatrix,
  TraceabilityMatrixCell,
  TraceabilityMarker,
  TraceabilityModule,
  TestSheet,
  InsertUser,
  InsertProject,
  InsertProjectMember,
  InsertModule,
  InsertTestCase,
  InsertBug,
  InsertActivity,
  InsertTimeSheet,
  InsertTimeSheetFolder,
  InsertCustomer,
  InsertCustomerProject,
  InsertSprint,
  InsertKanbanColumn,
  InsertKanbanCard,
  InsertCustomMarker,
  InsertMatrixCell,
  InsertTraceabilityMatrix,
  InsertTraceabilityMatrixCell,
  InsertTraceabilityMarker,
  InsertTraceabilityModule,
  InsertTestSheet,
  DocumentFolder,
  InsertDocumentFolder,
  Document,
  InsertDocument,
  Tag,
  InsertTag,
  TestingType,
  InsertTestingTypeField,
  TestingTypeField,
  Notebook,
  NotebookCategory,
  NotebookComment,
  TodoList,
  Todo,
  BugComment,
  AutomationScript,
  AutomationRun,
  AutomationSchedule,
  AutomationEnvironment,
  Role,
  Permission,
  UserProject,
  Marker,
  RequestFormType,
  RequestForm,
  RequestComment,
  ChatMessage,
  GitHubConfig,
  ProjectUser,
  EmployeeProject,
  EmployeeProjectHistory,
  TechnologyOption,
  DepartmentOption,
  NavadhitiProject,
  StatusReview,
  ResourceRequest,
  ResourceRequestExtension,
  Notification,
  TestCaseStatus,
  BugStatus,
  TestCaseStatusCounts,
  BugStatusCounts,
  InsertMessageReadStatus,
  MessageReadStatus,
  TrackerProject,
  TrackerFeature,
  TrackerSubFeature,
  TrackerWorkLog,
  TrackerTimelineExtension,
  TrackerDependency,
  TrackerAuditLog,
  TrackerCustomDropdown,
  InsertTrackerProject,
  InsertTrackerFeature,
  InsertTrackerSubFeature,
  InsertTrackerWorkLog,
  InsertTrackerTimelineExtension,
  InsertTrackerDependency,
  InsertTrackerAuditLog,
  InsertTrackerCustomDropdown,
  BugHistory,
  InsertBugHistory
} from "@shared/schema";

import { desc, eq } from "drizzle-orm"; // Assuming drizzle-orm is used for schema operations

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Module operations
  getModules(): Promise<Module[]>;
  getModulesByProject(projectId: number): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, moduleData: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;

  // Test case operations
  getTestCases(): Promise<TestCase[]>;
  getTestCasesByProject(projectId: number): Promise<TestCase[]>;
  getTestCasesByFilters(projectId?: number, moduleId?: number): Promise<TestCase[]>;
  getTestCase(id: number): Promise<TestCase | undefined>;
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  updateTestCase(id: number, testCaseData: Partial<TestCase>): Promise<TestCase | null>;
  deleteTestCase(id: number, userId: number, hardDelete?: boolean): Promise<boolean>;

  // Deleted test case operations
  getDeletedTestCases(projectId?: number): Promise<TestCase[]>;
  getDeletedTestCasesByProject(projectId: number): Promise<TestCase[]>;
  restoreTestCase(id: number): Promise<TestCase | undefined>;
  permanentlyDeleteTestCase(id: number): Promise<boolean>;

  // Bug operations
  getBugs(): Promise<Bug[]>;
  getBugsByProject(projectId: number): Promise<Bug[]>;
  getBugsWithFilters(filters?: { projectId?: number; status?: string; severity?: string }): Promise<Bug[]>;
  getBug(id: number): Promise<Bug | undefined>;
  getBugById(id: number): Promise<Bug | null>;
  createBug(bug: InsertBug): Promise<Bug>;
  updateBug(id: number, bugData: Partial<Bug>): Promise<Bug | null>;
  deleteBug(id: number): Promise<boolean>;

  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocumentsByProject(projectId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentById(id: number): Promise<Document | null>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Document folder operations
  getDocumentFolders(projectId: number): Promise<DocumentFolder[]>;
  getDocumentFoldersByProject(projectId: number): Promise<DocumentFolder[]>;
  getDocumentFolder(id: number): Promise<DocumentFolder | undefined>;
  getDocumentFolderById(id: number): Promise<DocumentFolder | null>;
  createDocumentFolder(folder: InsertDocumentFolder): Promise<DocumentFolder>;
  updateDocumentFolder(id: number, folderData: Partial<DocumentFolder>): Promise<DocumentFolder | undefined>;
  deleteDocumentFolder(id: number): Promise<boolean>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerById(id: number): Promise<Customer | null>;
  getCustomersByStatus(status: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Tag operations
  getTags(): Promise<Tag[]>;
  getTagsByProject(projectId: number): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  getTagById(id: number): Promise<Tag | null>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tagData: Partial<Tag>): Promise<Tag | null>;
  deleteTag(id: number): Promise<boolean>;

  // Kanban operations
  getKanbanColumns(): Promise<KanbanColumn[]>;
  getKanbanColumnsByProject(projectId: number): Promise<KanbanColumn[]>;
  getKanbanColumn(id: number): Promise<KanbanColumn | undefined>;
  createKanbanColumn(column: InsertKanbanColumn): Promise<KanbanColumn>;
  updateKanbanColumn(id: number, columnData: Partial<KanbanColumn>): Promise<KanbanColumn | undefined>;
  deleteKanbanColumn(id: number): Promise<boolean>;

  getKanbanCards(): Promise<KanbanCard[]>;
  getKanbanCardsByColumn(columnId: number): Promise<KanbanCard[]>;
  getKanbanCard(id: number): Promise<KanbanCard | undefined>;
  createKanbanCard(card: InsertKanbanCard): Promise<KanbanCard>;
  updateKanbanCard(id: number, cardData: Partial<KanbanCard>): Promise<KanbanCard | undefined>;
  deleteKanbanCard(id: number): Promise<boolean>;

  // Matrix operations
  getCustomMarkers(): Promise<CustomMarker[]>;
  getCustomMarkersByProject(projectId: number): Promise<CustomMarker[]>;
  getCustomMarker(id: number): Promise<CustomMarker | undefined>;
  createCustomMarker(marker: InsertCustomMarker): Promise<CustomMarker>;
  updateCustomMarker(id: number, markerData: Partial<CustomMarker>): Promise<CustomMarker | null>;
  deleteCustomMarker(id: number): Promise<boolean>;

  getMatrixCells(): Promise<MatrixCell[]>;
  getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]>;
  getMatrixCell(id: number): Promise<MatrixCell | undefined>;
  getMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<MatrixCell | undefined>;
  createMatrixCell(cell: InsertMatrixCell): Promise<MatrixCell>;
  upsertMatrixCell(cell: any): Promise<any>;
  updateMatrixCell(id: number, cellData: Partial<MatrixCell>): Promise<MatrixCell | null>;
  deleteMatrixCell(id: number): Promise<boolean>;
  deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<boolean>;

  // Test Sheet operations
  getTestSheets(projectId?: number): Promise<any[]>;
  getTestSheet(id: number): Promise<any | null>;
  createTestSheet(sheet: InsertTestSheet): Promise<any>;
  updateTestSheet(id: number, sheetData: any): Promise<any>;
  deleteTestSheet(id: number): Promise<boolean>;
  duplicateTestSheet(id: number, name: string, userId: number): Promise<any>;

  // Flow Diagram methods
  getFlowDiagramsByProject(projectId: string): Promise<any[]>;
  getFlowDiagram(id: string): Promise<any | null>;
  createFlowDiagram(data: any): Promise<any>;
  updateFlowDiagram(id: string, data: any): Promise<any>;
  deleteFlowDiagram(id: string): Promise<boolean>;

  // GitHub Integration methods
  getGitHubConfig(projectId: number): Promise<any | undefined>;
  createGitHubConfig(data: any): Promise<any>;
  updateGitHubConfig(id: number, data: any): Promise<any | null>;
  createGitHubIssue(data: any): Promise<any>;
  getGitHubIssue(id: number): Promise<any | undefined>;
  getGitHubIssueByBugId(bugId: number): Promise<any | undefined>;
  getGitHubIssueByGitHubId(githubId: number): Promise<any | undefined>;
  updateGitHubIssue(id: number, data: any): Promise<any | null>;

  // Notebook operations
  getNotebooks(userId: number): Promise<Notebook[]>;
  getNotebook(id: number, userId: number): Promise<Notebook | null>;
  createNotebook(notebookData: any): Promise<Notebook>;
  updateNotebook(id: number, userId: number, updates: Partial<Notebook>): Promise<Notebook | null>;
  deleteNotebook(id: number, userId: number): Promise<boolean>;
  searchNotebooks(userId: number, query: string): Promise<Notebook[]>;
  getSharedNotebooks(userId: number): Promise<Notebook[]>;
  shareNotebook(notebookId: number, userId: number, targetUserIds: number[]): Promise<boolean>;

  // Notebook Categories
  getNotebookCategories(userId: number): Promise<NotebookCategory[]>;
  createNotebookCategory(categoryData: any): Promise<NotebookCategory>;
  updateNotebookCategory(id: number, userId: number, updates: any): Promise<NotebookCategory | null>;
  deleteNotebookCategory(id: number, userId: number): Promise<boolean>;

  // Notebook Comments
  getNotebookComments(notebookId: number): Promise<NotebookComment[]>;
  createNotebookComment(commentData: any): Promise<NotebookComment>;
  updateNotebookComment(id: number, authorId: number, updates: any): Promise<NotebookComment | null>;
  deleteNotebookComment(id: number, authorId: number): Promise<boolean>;

  // Chat operations
  createChatMessage(messageData: any): Promise<any>;
  createMessage(messageData: any): Promise<any>;
  getChatMessages(projectId: number, limit?: number): Promise<any[]>;
  updateChatMessage(messageId: number, userId: number, updates: any): Promise<any | null>;
  getMessagesByChat(chatId: number): Promise<any[]>;
  createDirectConversation(userId1: number, userId2: number): Promise<any>;
  getDirectConversation(userId1: number, userId2: number): Promise<any | null>;
  getUserConversations(userId: number): Promise<any[]>;

  // Comment operations
  getBugComment(commentId: number): Promise<any>;
  updateComment(commentId: number, updates: any): Promise<any>;

  // Traceability Matrix operations
  getTraceabilityMatrix(projectId: number): Promise<any>;
  saveTraceabilityMatrix(projectId: number, matrixData: any[]): Promise<any>;
  getTraceabilityMatrixById(id: number): Promise<any | undefined>;
  createTraceabilityMatrix(matrix: any): Promise<any>;
  updateTraceabilityMatrix(id: number, matrix: any): Promise<any>;
  deleteTraceabilityMatrix(id: number): Promise<boolean>;
  getTraceabilityMarkers(projectId: number): Promise<any[]>;
  getTraceabilityMarker(id: number): Promise<any | undefined>;
  createTraceabilityMarker(marker: any): Promise<any>;
  updateTraceabilityMarker(id: number, marker: any): Promise<any>;
  deleteTraceabilityMarker(id: number): Promise<boolean>;
  getTraceabilityMatrixCells(matrixId: number): Promise<any[]>;
  createTraceabilityMatrixCell(cell: any): Promise<any>;
  updateTraceabilityMatrixCell(id: number, cell: any): Promise<any>;

  // Enhanced Chat and Messaging methods
  getChatsByUser(userId: number): Promise<any[]>;
  addParticipantToConversation(conversationId: number, userId: number): Promise<boolean>;
  removeParticipantFromConversation(conversationId: number, userId: number): Promise<boolean>;
  updateConversation(id: number, updates: any): Promise<any | null>;
  deleteConversation(id: number): Promise<boolean>;
  addConversationMember(conversationId: number, userId: number): Promise<boolean>;
  removeConversationMember(conversationId: number, userId: number): Promise<boolean>;
  getConversationMembers(conversationId: number): Promise<any[]>;
  getChatMessage(id: number): Promise<any | null>;
  updateChatMessage(id: number, userId: number, updates: any): Promise<any | null>;
  deleteChatMessage(id: number, userId: number): Promise<boolean>;
  addMessageReaction(messageId: number, userId: number, emoji: string): Promise<any | null>;
  getMessageThread(parentMessageId: number): Promise<any[]>;
  markMessageAsRead(messageId: number, userId: number): Promise<void>;
  markConversationAsRead(conversationId: number, userId: number): Promise<void>;
  getUnreadCountForUser(conversationId: number, userId: number): Promise<number>;
  searchMessages(query: string, conversationId?: number, userId?: number): Promise<any[]>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<any[]>;
  createDirectMessage(messageData: any): Promise<any>;
  updateDirectMessage(messageId: number, userId: number, updates: any): Promise<any | null>;
  deleteDirectMessage(messageId: number, userId: number): Promise<boolean>;

  // Employee Management Methods
  getEmployees(): Promise<any[]>;
  getEmployee(id: number): Promise<any | undefined>;
  createEmployee(data: any): Promise<any>;
  updateEmployee(id: number, data: any): Promise<any | null>;
  deleteEmployee(id: number): Promise<boolean>;
  getEmployeeByEmail(email: string): Promise<any | undefined>;
  importEmployees(employees: any[]): Promise<{ successCount: number; errorCount: number; errors: string[] }>;

  // Employee Project Mapping
  getEmployeeProjects(employeeId?: number): Promise<any[]>;
  createEmployeeProject(data: any): Promise<any>;
  deleteEmployeeProject(id: number): Promise<boolean>;
  updateEmployeeProject(id: number, data: Partial<any>): Promise<any>; // Assuming InsertEmployeeProject type for data
  getEmployeeProjectHistory(employeeId: number): Promise<any[]>;
  getAllEmployeeProjectHistory(): Promise<any[]>;
  getEmployeeProjectAllocation(allocationId: number): Promise<any | null>;
  createEmployeeProjectHistory(historyData: any): Promise<any>;
  extendEmployeeProject(allocationId: number, newEndDate: string, extensionDays?: number): Promise<any>;

  // Technology Options
  getTechnologyOptions(): Promise<any[]>;
  createTechnologyOption(data: any): Promise<any>;

  // Department Options
  getDepartmentOptions(): Promise<any[]>;
  createDepartmentOption(data: any): Promise<any>;

  // Navadhiti Projects Methods
  getNavadhitiProjects(): Promise<any[]>;
  getNavadhitiProject(id: number): Promise<any | undefined>;
  createNavadhitiProject(data: any): Promise<any>;
  updateNavadhitiProject(id: number, data: any): Promise<any | null>;
  deleteNavadhitiProject(id: number): Promise<boolean>;

  // Status Review Methods
  getStatusReviews(date?: string): Promise<any[]>;
  createStatusReview(data: any): Promise<any>;

  // Todo Management Methods
  getTodos(userId: number): Promise<any[]>;
  getTodosByUserId(userId: number): Promise<any[]>;
  getTodo(id: number): Promise<any | undefined>;
  createTodo(data: any): Promise<any>;
  updateTodo(id: number, data: any): Promise<any | null>;
  deleteTodo(id: number): Promise<boolean>;
  getTodoLists(userId: number): Promise<any[]>;
  getTodoList(id: number): Promise<any | undefined>;
  createTodoList(data: any): Promise<any>;
  updateTodoList(id: number, data: any): Promise<any | null>;
  deleteTodoList(id: number): Promise<boolean>;
  getTodosByListId(listId: number): Promise<any[]>;

  // Request Forms Module Methods
  getRequestFormTypes(): Promise<any[]>;
  getRequestFormType(id: number): Promise<any | undefined>;
  createRequestFormType(data: any): Promise<any>;
  updateRequestFormType(id: number, data: any): Promise<any | null>;
  deleteRequestFormType(id: number): Promise<boolean>;

  getOptionsByFormType(formTypeId: number): Promise<any[]>;
  getOption(id: number): Promise<any | undefined>;
  createOption(data: any): Promise<any>;
  updateOption(id: number, data: any): Promise<any | null>;
  deleteOption(id: number): Promise<boolean>;

  getResourceRequests(): Promise<any[]>;
  getResourceRequest(id: number): Promise<any | undefined>;
  createResourceRequest(data: any): Promise<any>;
  updateResourceRequest(id: number, data: any): Promise<any | null>;
  deleteResourceRequest(id: number): Promise<boolean>;

  getResourceRequestExtensions(): Promise<any[]>;
  getResourceRequestExtension(id: number): Promise<any | undefined>;
  createResourceRequestExtension(data: any): Promise<any>;
  updateResourceRequestExtension(id: number, data: any): Promise<any | null>;
  deleteResourceRequestExtension(id: number): Promise<boolean>;

  getRequestComments(requestId: number): Promise<any[]>;
  getRequestComment(id: number): Promise<any | undefined>;
  createRequestComment(data: any): Promise<any>;
  updateRequestComment(id: number, data: any): Promise<any | null>;
  deleteRequestComment(id: number): Promise<boolean>;

  // Request Form Attachments
  getRequestAttachments(requestId: number): Promise<any[]>;
  getRequestAttachment(attachmentId: number): Promise<any | null>;
  createRequestAttachment(data: any): Promise<any>;
  deleteRequestAttachment(attachmentId: number): Promise<boolean>;

  // Notification methods
  getNotifications(userId: number): Promise<any[]>;
  createNotification(data: any): Promise<any>;
  markNotificationAsRead(id: number): Promise<any>;

  // Role and Permission Methods (for Role-Based Access Control)
  getRoles(): Promise<Role[]>;
  createRole(role: Omit<Role, 'id'>): Promise<Role>;
  updateRole(id: number, data: Partial<Role>): Promise<Role | null>;
  deleteRole(id: number): Promise<boolean>;
  getPermissions(): Promise<Permission[]>;
  createPermission(permission: Omit<Permission, 'id'>): Promise<Permission>;
  updatePermission(id: number, data: Partial<Permission>): Promise<Permission | null>;
  deletePermission(id: number): Promise<boolean>;
  assignRoleToUser(userId: number, roleId: number): Promise<boolean>;
  removeRoleFromUser(userId: number, roleId: number): Promise<boolean>;
  getUserRoles(userId: number): Promise<Role[]>;
  getRolePermissions(roleId: number): Promise<Permission[]>;
  assignPermissionToRole(roleId: number, permissionId: number): Promise<boolean>;
  removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;
  getModulesWithPermissions(): Promise<any[]>;
  // Employee permissions methods
  updateEmployeePermissions(employeeId: number, permissions: any[]): Promise<void>;
  getEmployeePermissions(employeeId: number): Promise<any[]>;

  // BRD Document operations (added methods)
  getBrdDocuments(projectId?: number): Promise<any[]>;
  getBrdDocument(id: number): Promise<any | null>;
  createBrdDocument(data: any): Promise<any>;
  updateBrdDocument(id: number, updateData: any): Promise<any | null>;
  deleteBrdDocument(id: number): Promise<boolean>;

  // BRD Version operations (added methods)
  getBrdVersions(brdId: number): Promise<any[]>;
  getBrdDocumentVersions(brdId: number): Promise<any[]>;
  createBrdVersion(versionData: any): Promise<any>;
  revertBrdDocumentToVersion(brdId: number, versionId: number): Promise<any | null>;

  // BRD Test Case operations (added methods)
  getBrdTestCases(brdId: number): Promise<any[]>;
  getBrdTestCase(id: number): Promise<any | null>;
  createBrdTestCase(data: any): Promise<any>;
  updateBrdTestCase(id: number, data: any): Promise<any | null>;
  deleteBrdTestCase(id: number): Promise<boolean>;

  // Project Tracker Storage Methods
  getTrackerProjects(): Promise<TrackerProject[]>;
  getTrackerProject(id: number): Promise<TrackerProject | null>;
  createTrackerProject(data: InsertTrackerProject): Promise<TrackerProject>;
  updateTrackerProject(id: number, data: Partial<TrackerProject>): Promise<TrackerProject | null>;
  deleteTrackerProject(id: number): Promise<boolean>;

  getTrackerFeatures(projectId?: number): Promise<TrackerFeature[]>;
  getTrackerFeature(id: number): Promise<TrackerFeature | null>;
  createTrackerFeature(data: InsertTrackerFeature): Promise<TrackerFeature>;
  updateTrackerFeature(id: number, data: Partial<TrackerFeature>): Promise<TrackerFeature | null>;
  deleteTrackerFeature(id: number): Promise<boolean>;

  getTrackerSubFeatures(featureId?: number, projectId?: number): Promise<TrackerSubFeature[]>;
  getTrackerSubFeature(id: number): Promise<TrackerSubFeature | null>;
  createTrackerSubFeature(data: InsertTrackerSubFeature): Promise<TrackerSubFeature>;
  updateTrackerSubFeature(id: number, data: Partial<TrackerSubFeature>): Promise<TrackerSubFeature | null>;
  deleteTrackerSubFeature(id: number): Promise<boolean>;

  getTrackerWorkLogs(filters?: {
    projectId?: number;
    featureId?: number;
    subFeatureId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TrackerWorkLog[]>;
  createTrackerWorkLog(data: InsertTrackerWorkLog): Promise<TrackerWorkLog>;

  createTrackerTimelineExtension(data: InsertTrackerTimelineExtension): Promise<TrackerTimelineExtension>;
  getTrackerTimelineExtensions(entityType: string, entityId: number): Promise<TrackerTimelineExtension[]>;

  createTrackerDependency(data: InsertTrackerDependency): Promise<TrackerDependency>;
  getTrackerDependencies(entityType?: string, entityId?: number): Promise<TrackerDependency[]>;

  getTrackerCustomDropdowns(type?: string): Promise<TrackerCustomDropdown[]>;
  createTrackerCustomDropdown(data: InsertTrackerCustomDropdown): Promise<TrackerCustomDropdown>;

  createTrackerAuditLog(data: InsertTrackerAuditLog): Promise<TrackerAuditLog>;
  getTrackerAuditLogs(entityType?: string, entityId?: number): Promise<TrackerAuditLog[]>;

  // Activity logging
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(limit?: number): Promise<Activity[]>;
  getProjectActivities(projectId: number, limit?: number): Promise<Activity[]>;

  // Dashboard stats
  getDashboardStats(userId?: number): Promise<{
    totalProjects: number;
    totalTestCases: number;
    openBugs: number;
    passRate: number;
    testCaseStatusCounts?: TestCaseStatusCounts;
    bugStatusCounts?: BugStatusCounts;
    totalUsers?: number;
  }>;

  // Test Case Status operations
  updateTestCaseStatus(id: number, status: TestCaseStatus): Promise<TestCase | null>;

  // Bug Status operations
  updateBugStatus(id: number, status: BugStatus): Promise<Bug | null>;

  // Test Sheet operations (re-declared for consistency)
  getTestSheets(projectId?: number): Promise<TestSheet[]>;
  getTestSheet(id: number): Promise<TestSheet | undefined>;
  createTestSheet(sheet: InsertTestSheet): Promise<TestSheet>;
  updateTestSheet(id: number, sheetData: Partial<TestSheet>): Promise<TestSheet | undefined>;
  deleteTestSheet(id: number): Promise<boolean>;
  duplicateTestSheet(id: number, name: string, userId: number): Promise<TestSheet>;

  // Project operations (re-declared for consistency)
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Document operations (re-declared for consistency)
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Document Folder operations (re-declared for consistency)
  getDocumentFolders(projectId?: number): Promise<DocumentFolder[]>;
  getDocumentFolder(id: number): Promise<DocumentFolder | undefined>;
  createDocumentFolder(folder: InsertDocumentFolder): Promise<DocumentFolder>;
  updateDocumentFolder(id: number, folderData: Partial<DocumentFolder>): Promise<DocumentFolder | undefined>;
  deleteDocumentFolder(id: number): Promise<boolean>;

  // Customer operations (re-declared for consistency)
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomersByStatus(status: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Customer Project operations
  getCustomerProjects(): Promise<CustomerProject[]>;
  getProjectsByCustomerId(customerId: number): Promise<Project[]>;
  getCustomersByProjectId(projectId: number): Promise<Customer[]>;
  createCustomerProject(customerProject: InsertCustomerProject): Promise<CustomerProject>;
  deleteCustomerProject(id: number): Promise<boolean>;

  // TimeSheet operations
  getTimeSheets(projectId?: number, userId?: number): Promise<TimeSheet[]>;
  getUserTimeSheets(userId: number): Promise<TimeSheet[]>;
  getProjectTimeSheets(projectId: number): Promise<TimeSheet[]>;
  getTimeSheet(id: number): Promise<TimeSheet | undefined>;
  createTimeSheet(timeSheet: InsertTimeSheet): Promise<TimeSheet>;
  updateTimeSheet(id: number, timeSheetData: Partial<TimeSheet>): Promise<TimeSheet | undefined>;
  deleteTimeSheet(id: number): Promise<boolean>;

  // TimeSheet Folder operations
  getTimeSheetFolders(userId: number): Promise<TimeSheetFolder[]>;
  getTimeSheetFolder(id: number): Promise<TimeSheetFolder | undefined>;
  createTimeSheetFolder(timeSheetFolder: InsertTimeSheetFolder): Promise<TimeSheetFolder>;
  updateTimeSheetFolder(id: number, timeSheetFolderData: Partial<TimeSheetFolder>): Promise<TimeSheetFolder | undefined>;
  deleteTimeSheetFolder(id: number): Promise<boolean>;
  getTimesheetsByFolder(folderId: number): Promise<TimeSheet[]>;

  // Sprint operations
  getSprints(projectId?: number): Promise<Sprint[]>;
  getSprint(id: number): Promise<Sprint | undefined>;
  createSprint(sprint: InsertSprint): Promise<Sprint>;
  updateSprint(id: number, sprintData: Partial<Sprint>): Promise<Sprint | undefined>;
  deleteSprint(id: number): Promise<boolean>;

  // Kanban operations (re-declared for consistency)
  getKanbanColumns(projectId?: number, sprintId?: number): Promise<KanbanColumn[]>;
  getKanbanColumn(id: number): Promise<KanbanColumn | undefined>;
  createKanbanColumn(column: InsertKanbanColumn): Promise<KanbanColumn>;
  updateKanbanColumn(id: number, columnData: Partial<KanbanColumn>): Promise<KanbanColumn | undefined>;
  deleteKanbanColumn(id: number): Promise<boolean>;

  getKanbanCards(columnId?: number, sprintId?: number, projectId?: number): Promise<KanbanCard[]>;
  getKanbanSubCards(parentId: number): Promise<KanbanCard[]>;
  getKanbanCard(id: number): Promise<KanbanCard | undefined>;
  createKanbanCard(card: InsertKanbanCard): Promise<KanbanCard>;
  updateKanbanCard(id: number, cardData: Partial<KanbanCard>): Promise<KanbanCard | undefined>;
  deleteKanbanCard(id: number): Promise<boolean>;

  // Custom Marker operations (re-declared for consistency)
  createCustomMarker(data: InsertCustomMarker): Promise<CustomMarker>;
  getCustomMarkers(): Promise<CustomMarker[]>;
  getCustomMarkersByProject(projectId: number): Promise<CustomMarker[]>;
  updateCustomMarker(id: number, data: Partial<CustomMarker>): Promise<CustomMarker | null>;
  deleteCustomMarker(id: number): Promise<boolean>;

  // Matrix Cell operations (re-declared for consistency)
  createMatrixCell(data: InsertMatrixCell): Promise<MatrixCell>;
  getMatrixCells(): Promise<MatrixCell[]>;
  getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]>;
  updateMatrixCell(id: number, data: Partial<MatrixCell>): Promise<MatrixCell | null>;

  // Traceability operations (re-declared for consistency)
  getTraceabilityMatrix(projectId: number): Promise<any>;
  saveTraceabilityMatrix(projectId: number, matrixData: any[]): Promise<any>;
  getTraceabilityMatrixById(id: number): Promise<any | undefined>;
  createTraceabilityMatrix(matrix: any): Promise<any>;
  updateTraceabilityMatrix(id: number, matrix: any): Promise<any>;
  deleteTraceabilityMatrix(id: number): Promise<boolean>;
  getTraceabilityMarkers(projectId: number): Promise<any[]>;
  getTraceabilityMarker(id: number): Promise<any | undefined>;
  createTraceabilityMarker(marker: any): Promise<any>;
  updateTraceabilityMarker(id: number, marker: any): Promise<any>;
  deleteTraceabilityMarker(id: number): Promise<boolean>;
  getTraceabilityMatrixCells(matrixId: number): Promise<any[]>;
  createTraceabilityMatrixCell(cell: any): Promise<any>;
  updateTraceabilityMatrixCell(id: number, cell: any): Promise<any>;

  // Helper methods for ID generation and activity logging
  createActivity(activity: InsertActivity): Promise<Activity>;
  recordActivity(entityType: string, action: string, entityId: number, userId: number): void;

  // Method to fix existing test case IDs
  fixExistingTestCaseIds(): Promise<void>;

  // Message Read Status tracking
  createMessageReadStatus(data: InsertMessageReadStatus): Promise<MessageReadStatus>;
  getMessageReadStatuses(messageId: number): Promise<MessageReadStatus[]>;
  markMessageAsRead(messageId: number, userId: number): Promise<void>;

  // Bug History operations
  getBugHistory(bugId: number): Promise<BugHistory[]>;
  createBugHistory(history: InsertBugHistory): Promise<BugHistory>;
  syncBugHistoryWithGitHub(bugId: number, githubEvents: any[]): Promise<void>;
}

/**
 * In-memory storage implementation for development and testing
 */
class MemStorage implements IStorage {
  // In-memory storage for different entity types using Arrays
  private projects: Project[] = [];
  private users: User[] = [];
  private modules: Module[] = [];
  private testCases: TestCase[] = [];
  private bugs: Bug[] = [];
  private activities: Activity[] = [];
  private tags: Tag[] = [];
  private documents: Document[] = [];
  private documentFolders: DocumentFolder[] = [];
  private testSheets: TestSheet[] = [];
  private customers: Customer[] = [];
  private customerProjects: CustomerProject[] = [];
  private timeSheets: TimeSheet[] = [];
  private timeSheetFolders: TimeSheetFolder[] = [];
  private customMarkers: CustomMarker[] = [];
  private matrixCells: MatrixCell[] = [];
  private traceabilityMarkers: any[] = [];
  private githubConfigs: GitHubConfig[] = [];
  private githubIssues: any[] = [];
  private projectMembers: ProjectMember[] = [];
  private sprints: Sprint[] = [];
  private kanbanColumns: KanbanColumn[] = [];
  private kanbanCards: KanbanCard[] = [];
  private traceabilityMatrixes: TraceabilityMatrix[] = [];

  // Auto-increment counters
  private nextUserId = 1;
  private nextProjectId = 1;
  private nextModuleId = 1;
  private nextTestCaseId = 1;
  private nextBugId = 1;

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextUserId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;

    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date(),
    };
    return this.users[index];
  }

  async deleteUser(id: number): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return [...this.projects];
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return this.projects.filter(project => project.createdById === userId);
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.find(project => project.id === id);
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const newProject: Project = {
      id: this.nextProjectId++,
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const index = this.projects.findIndex(project => project.id === id);
    if (index === -1) return undefined;

    this.projects[index] = {
      ...this.projects[index],
      ...projectData,
      updatedAt: new Date(),
    };
    return this.projects[index];
  }

  async deleteProject(id: number): Promise<boolean> {
    const index = this.projects.findIndex(project => project.id === id);
    if (index === -1) return false;
    this.projects.splice(index, 1);
    return true;
  }

  // Module operations
  async getModules(): Promise<Module[]> {
    return [...this.modules];
  }

  async getModulesByProject(projectId: number): Promise<Module[]> {
    return this.modules.filter(module => module.projectId === projectId);
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.find(module => module.id === id);
  }

  async createModule(moduleData: InsertModule): Promise<Module> {
    const newModule: Module = {
      id: this.nextModuleId++,
      ...moduleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.modules.push(newModule);
    return newModule;
  }

  async updateModule(id: number, moduleData: Partial<Module>): Promise<Module | undefined> {
    const index = this.modules.findIndex(module => module.id === id);
    if (index === -1) return undefined;

    this.modules[index] = {
      ...this.modules[index],
      ...moduleData,
      updatedAt: new Date(),
    };
    return this.modules[index];
  }

  async deleteModule(id: number): Promise<boolean> {
    const index = this.modules.findIndex(module => module.id === id);
    if (index === -1) return false;
    this.modules.splice(index, 1);
    return true;
  }

  // Test case operations
  async getTestCases(): Promise<TestCase[]> {
    return this.testCases.filter(tc => !tc.isDeleted);
  }

  async getTestCasesByProject(projectId: number): Promise<TestCase[]> {
    return this.testCases.filter(tc => tc.projectId === projectId && !tc.isDeleted);
  }

  async getTestCasesByFilters(projectId?: number, moduleId?: number): Promise<TestCase[]> {
    let filtered = this.testCases.filter(tc => !tc.isDeleted);
    if (projectId) filtered = filtered.filter(tc => tc.projectId === projectId);
    if (moduleId) filtered = filtered.filter(tc => tc.moduleId === moduleId);
    return filtered;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.testCases.find(tc => tc.id === id);
  }

  async createTestCase(testCaseData: InsertTestCase): Promise<TestCase> {
    const newTestCase: TestCase = {
      id: this.nextTestCaseId++,
      ...testCaseData,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.testCases.push(newTestCase);
    return newTestCase;
  }

  async updateTestCase(id: number, testCaseData: Partial<TestCase>): Promise<TestCase | null> {
    const index = this.testCases.findIndex(tc => tc.id === id);
    if (index === -1) return null;

    this.testCases[index] = {
      ...this.testCases[index],
      ...testCaseData,
      updatedAt: new Date(),
    };
    return this.testCases[index];
  }

  async deleteTestCase(id: number, userId: number, hardDelete?: boolean): Promise<boolean> {
    const index = this.testCases.findIndex(tc => tc.id === id);
    if (index === -1) return false;

    if (hardDelete) {
      this.testCases.splice(index, 1);
    } else {
      this.testCases[index] = {
        ...this.testCases[index],
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return true;
  }

  // Deleted test case operations
  async getDeletedTestCases(projectId?: number): Promise<TestCase[]> {
    let deleted = this.testCases.filter(tc => tc.isDeleted);
    if (projectId) deleted = deleted.filter(tc => tc.projectId === projectId);
    return deleted;
  }

  async getDeletedTestCasesByProject(projectId: number): Promise<TestCase[]> {
    return this.testCases.filter(tc => tc.projectId === projectId && tc.isDeleted);
  }

  async restoreTestCase(id: number): Promise<TestCase | undefined> {
    const index = this.testCases.findIndex(tc => tc.id === id);
    if (index === -1) return undefined;

    this.testCases[index] = {
      ...this.testCases[index],
      isDeleted: false,
      deletedAt: null,
      updatedAt: new Date(),
    };
    return this.testCases[index];
  }

  async permanentlyDeleteTestCase(id: number): Promise<boolean> {
    const index = this.testCases.findIndex(tc => tc.id === id);
    if (index === -1) return false;
    this.testCases.splice(index, 1);
    return true;
  }

  // Bug operations
  async getBugs(): Promise<Bug[]> {
    return [...this.bugs];
  }

  async getBugsByProject(projectId: number): Promise<Bug[]> {
    return this.bugs.filter(bug => bug.projectId === projectId);
  }

  async getBugsWithFilters(filters?: { projectId?: number; status?: string; severity?: string }): Promise<Bug[]> {
    let filtered = [...this.bugs];
    if (filters?.projectId) filtered = filtered.filter(bug => bug.projectId === filters.projectId);
    if (filters?.status) filtered = filtered.filter(bug => bug.status === filters.status);
    if (filters?.severity) filtered = filtered.filter(bug => bug.severity === filters.severity);
    return filtered;
  }

  async getBug(id: number): Promise<Bug | undefined> {
    return this.bugs.find(bug => bug.id === id);
  }

  async getBugById(id: number): Promise<Bug | null> {
    return this.bugs.find(bug => bug.id === id) || null;
  }

  async createBug(bugData: InsertBug): Promise<Bug> {
    const newBug: Bug = {
      id: this.nextBugId++,
      ...bugData,
      dateReported: new Date(),
      updatedAt: new Date(),
    };
    this.bugs.push(newBug);
    return newBug;
  }

  async updateBug(id: number, bugData: Partial<Bug>): Promise<Bug | null> {
    const index = this.bugs.findIndex(bug => bug.id === id);
    if (index === -1) return null;

    this.bugs[index] = {
      ...this.bugs[index],
      ...bugData,
      updatedAt: new Date(),
    };
    return this.bugs[index];
  }

  async deleteBug(id: number): Promise<boolean> {
    const index = this.bugs.findIndex(bug => bug.id === id);
    if (index === -1) return false;
    this.bugs.splice(index, 1);
    return true;
  }

  // Placeholder implementations for other required methods
  async getDashboardStats(userId?: number): Promise<{
    totalProjects: number;
    totalTestCases: number;
    openBugs: number;
    passRate: number;
    testCaseStatusCounts?: any;
    bugStatusCounts?: any;
    totalUsers?: number;
  }> {
    const totalProjects = this.projects.length;
    const totalTestCases = this.testCases.filter(tc => !tc.isDeleted).length;
    const passedTests = this.testCases.filter(tc => !tc.isDeleted && tc.status === 'Pass').length;
    const openBugs = this.bugs.filter(bug => bug.status === 'Open' || bug.status === 'In Progress').length;
    const passRate = totalTestCases > 0 ? Math.round((passedTests / totalTestCases) * 100) : 0;

    return {
      totalProjects,
      totalTestCases,
      openBugs,
      passRate,
      totalUsers: this.users.length,
    };
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      id: this.activities.length + 1,
      ...activity,
      timestamp: new Date(),
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    const sorted = [...this.activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async getProjectActivities(projectId: number, limit?: number): Promise<Activity[]> {
    const filtered = this.activities.filter(a => a.entityId === projectId);
    const sorted = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // Helper method for recording activities
  recordActivity(entityType: string, action: string, entityId: number, userId: number): void {
    this.createActivity({
      entityType,
      action,
      entityId,
      userId,
      description: `${action} ${entityType} with ID ${entityId}`,
    });
  }</old_str>

  // Notebook storage
  private notebooks: Notebook[] = [];
  private notebookCategories: NotebookCategory[] = [];
  private notebookComments: NotebookComment[] = [];
  private nextNotebookId = 1;
  private nextNotebookCategoryId = 1;
  private nextNotebookCommentId = 1;

  // Additional storage arrays for missing functionality
  private documentFoldersArray: DocumentFolder[] = [];
  private documentsArray: Document[] = [];
  private tagsArray: Tag[] = [];
  private customersArray: Customer[] = [];
  private customerProjectsArray: CustomerProject[] = [];
  private timeSheetsArray: TimeSheet[] = [];
  private timeSheetFoldersArray: TimeSheetFolder[] = [];
  private sprintsArray: Sprint[] = [];
  private kanbanColumnsArray: KanbanColumn[] = [];
  private kanbanCardsArray: KanbanCard[] = [];
  private matrixCellsArray: MatrixCell[] = [];
  private customMarkersArray: CustomMarker[] = [];
  private chatMessages: any[] = [];
  private conversations: any[] = [];
  private requestFormTypes: any[] = [];
  private requestFormOptions: any[] = [];
  private resourceRequests: any[] = [];
  private requestComments: any[] = [];
  private requestAttachments: any[] = [];
  private notifications: any[] = [];
  private bugComments: any[] = [];
  private messageReadStatuses: any[] = [];
  private employees: any[] = [];
  private employeeProjects: any[] = [];
  private employeeProjectHistory: any[] = [];
  private technologyOptions: any[] = [];
  private departmentOptions: any[] = [];
  private navadhitiProjects: any[] = [];
  private statusReviews: any[] = [];
  private todos: any[] = [];
  private todoLists: any[] = [];
  
  // Document operations
  async getDocuments(): Promise<Document[]> {
    return [...this.documentsArray];
  }

  async getDocumentsByProject(projectId: number): Promise<Document[]> {
    return this.documentsArray.filter(doc => doc.projectId === projectId);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documentsArray.find(doc => doc.id === id);
  }

  async getDocumentById(id: number): Promise<Document | null> {
    return this.documentsArray.find(doc => doc.id === id) || null;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const newDoc: Document = {
      id: this.documentsArray.length + 1,
      ...document,
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };
    this.documentsArray.push(newDoc);
    return newDoc;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const index = this.documentsArray.findIndex(doc => doc.id === id);
    if (index === -1) return undefined;
    this.documentsArray[index] = { ...this.documentsArray[index], ...documentData, updatedAt: new Date() };
    return this.documentsArray[index];
  }

  async deleteDocument(id: number): Promise<boolean> {
    const index = this.documentsArray.findIndex(doc => doc.id === id);
    if (index === -1) return false;
    this.documentsArray.splice(index, 1);
    return true;
  }

  // Document folder operations
  async getDocumentFolders(projectId: number): Promise<DocumentFolder[]> {
    return this.documentFoldersArray.filter(folder => folder.projectId === projectId);
  }

  async getDocumentFoldersByProject(projectId: number): Promise<DocumentFolder[]> {
    return this.documentFoldersArray.filter(folder => folder.projectId === projectId);
  }

  async getDocumentFolder(id: number): Promise<DocumentFolder | undefined> {
    return this.documentFoldersArray.find(folder => folder.id === id);
  }

  async getDocumentFolderById(id: number): Promise<DocumentFolder | null> {
    return this.documentFoldersArray.find(folder => folder.id === id) || null;
  }

  async createDocumentFolder(folder: InsertDocumentFolder): Promise<DocumentFolder> {
    const newFolder: DocumentFolder = {
      id: this.documentFoldersArray.length + 1,
      ...folder,
      createdAt: new Date(),
    };
    this.documentFoldersArray.push(newFolder);
    return newFolder;
  }

  async updateDocumentFolder(id: number, folderData: Partial<DocumentFolder>): Promise<DocumentFolder | undefined> {
    const index = this.documentFoldersArray.findIndex(folder => folder.id === id);
    if (index === -1) return undefined;
    this.documentFoldersArray[index] = { ...this.documentFoldersArray[index], ...folderData };
    return this.documentFoldersArray[index];
  }

  async deleteDocumentFolder(id: number): Promise<boolean> {
    const index = this.documentFoldersArray.findIndex(folder => folder.id === id);
    if (index === -1) return false;
    this.documentFoldersArray.splice(index, 1);
    return true;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return [...this.customersArray];
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customersArray.find(customer => customer.id === id);
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return this.customersArray.find(customer => customer.id === id) || null;
  }

  async getCustomersByStatus(status: string): Promise<Customer[]> {
    return this.customersArray.filter(customer => customer.status === status);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const newCustomer: Customer = {
      id: this.customersArray.length + 1,
      ...customer,
      createdAt: new Date(),
    };
    this.customersArray.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const index = this.customersArray.findIndex(customer => customer.id === id);
    if (index === -1) return undefined;
    this.customersArray[index] = { ...this.customersArray[index], ...customerData };
    return this.customersArray[index];
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const index = this.customersArray.findIndex(customer => customer.id === id);
    if (index === -1) return false;
    this.customersArray.splice(index, 1);
    return true;
  }

  // Placeholder implementations for all other required interface methods
  async getTags(): Promise<Tag[]> { return []; }
  async getTagsByProject(projectId: number): Promise<Tag[]> { return []; }
  async getTag(id: number): Promise<Tag | undefined> { return undefined; }
  async getTagById(id: number): Promise<Tag | null> { return null; }
  async createTag(tag: InsertTag): Promise<Tag> { 
    const newTag: Tag = { id: 1, ...tag, createdAt: new Date() };
    return newTag;
  }
  async updateTag(id: number, tagData: Partial<Tag>): Promise<Tag | null> { return null; }
  async deleteTag(id: number): Promise<boolean> { return false; }

  // TimeSheet operations
  async getTimeSheets(projectId?: number, userId?: number): Promise<TimeSheet[]> { return []; }
  async getUserTimeSheets(userId: number): Promise<TimeSheet[]> { return []; }
  async getProjectTimeSheets(projectId: number): Promise<TimeSheet[]> { return []; }
  async getTimeSheet(id: number): Promise<TimeSheet | undefined> { return undefined; }
  async createTimeSheet(timeSheet: InsertTimeSheet): Promise<TimeSheet> {
    const newTimeSheet: TimeSheet = { id: 1, ...timeSheet, createdAt: new Date(), updatedAt: new Date() };
    return newTimeSheet;
  }
  async updateTimeSheet(id: number, timeSheetData: Partial<TimeSheet>): Promise<TimeSheet | undefined> { return undefined; }
  async deleteTimeSheet(id: number): Promise<boolean> { return false; }

  // TimeSheet Folder operations
  async getTimeSheetFolders(userId: number): Promise<TimeSheetFolder[]> { return []; }
  async getTimeSheetFolder(id: number): Promise<TimeSheetFolder | undefined> { return undefined; }
  async createTimeSheetFolder(timeSheetFolder: InsertTimeSheetFolder): Promise<TimeSheetFolder> {
    const newFolder: TimeSheetFolder = { id: 1, ...timeSheetFolder, createdAt: new Date(), updatedAt: new Date() };
    return newFolder;
  }
  async updateTimeSheetFolder(id: number, timeSheetFolderData: Partial<TimeSheetFolder>): Promise<TimeSheetFolder | undefined> { return undefined; }
  async deleteTimeSheetFolder(id: number): Promise<boolean> { return false; }
  async getTimesheetsByFolder(folderId: number): Promise<TimeSheet[]> { return []; }

  // Customer Project operations
  async getCustomerProjects(): Promise<CustomerProject[]> { return []; }
  async getProjectsByCustomerId(customerId: number): Promise<Project[]> { return []; }
  async getCustomersByProjectId(projectId: number): Promise<Customer[]> { return []; }
  async createCustomerProject(customerProject: InsertCustomerProject): Promise<CustomerProject> {
    const newCP: CustomerProject = { id: 1, ...customerProject, createdAt: new Date() };
    return newCP;
  }
  async deleteCustomerProject(id: number): Promise<boolean> { return false; }

  // Sprint operations
  async getSprints(projectId?: number): Promise<Sprint[]> { return []; }
  async getSprint(id: number): Promise<Sprint | undefined> { return undefined; }
  async createSprint(sprint: InsertSprint): Promise<Sprint> {
    const newSprint: Sprint = { id: 1, ...sprint, createdAt: new Date(), updatedAt: new Date() };
    return newSprint;
  }
  async updateSprint(id: number, sprintData: Partial<Sprint>): Promise<Sprint | undefined> { return undefined; }
  async deleteSprint(id: number): Promise<boolean> { return false; }

  // Kanban operations
  async getKanbanColumns(projectId?: number, sprintId?: number): Promise<KanbanColumn[]> { return []; }
  async getKanbanColumnsByProject(projectId: number): Promise<KanbanColumn[]> { return []; }
  async getKanbanColumn(id: number): Promise<KanbanColumn | undefined> { return undefined; }
  async createKanbanColumn(column: InsertKanbanColumn): Promise<KanbanColumn> {
    const newColumn: KanbanColumn = { id: 1, ...column, createdAt: new Date(), updatedAt: new Date() };
    return newColumn;
  }
  async updateKanbanColumn(id: number, columnData: Partial<KanbanColumn>): Promise<KanbanColumn | undefined> { return undefined; }
  async deleteKanbanColumn(id: number): Promise<boolean> { return false; }

  async getKanbanCards(columnId?: number, sprintId?: number, projectId?: number): Promise<KanbanCard[]> { return []; }
  async getKanbanCardsByColumn(columnId: number): Promise<KanbanCard[]> { return []; }
  async getKanbanSubCards(parentId: number): Promise<KanbanCard[]> { return []; }
  async getKanbanCard(id: number): Promise<KanbanCard | undefined> { return undefined; }
  async createKanbanCard(card: InsertKanbanCard): Promise<KanbanCard> {
    const newCard: KanbanCard = { id: 1, ...card, createdAt: new Date(), updatedAt: new Date() };
    return newCard;
  }
  async updateKanbanCard(id: number, cardData: Partial<KanbanCard>): Promise<KanbanCard | undefined> { return undefined; }
  async deleteKanbanCard(id: number): Promise<boolean> { return false; }

  // Matrix operations  
  async getCustomMarkers(): Promise<CustomMarker[]> { return []; }
  async getCustomMarkersByProject(projectId: number): Promise<CustomMarker[]> { return []; }
  async getCustomMarker(id: number): Promise<CustomMarker | undefined> { return undefined; }
  async createCustomMarker(marker: InsertCustomMarker): Promise<CustomMarker> {
    const newMarker: CustomMarker = { id: 1, ...marker, createdAt: new Date() };
    return newMarker;
  }
  async updateCustomMarker(id: number, markerData: Partial<CustomMarker>): Promise<CustomMarker | null> { return null; }
  async deleteCustomMarker(id: number): Promise<boolean> { return false; }

  async getMatrixCells(): Promise<MatrixCell[]> { return []; }
  async getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]> { return []; }
  async getMatrixCell(id: number): Promise<MatrixCell | undefined>;
  async getMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<MatrixCell | undefined>;
  async getMatrixCell(idOrRowModuleId: number, colModuleId?: number, projectId?: number): Promise<MatrixCell | undefined> {
    return undefined;
  }
  async createMatrixCell(cell: InsertMatrixCell): Promise<MatrixCell> {
    const newCell: MatrixCell = { id: 1, ...cell, createdAt: new Date() };
    return newCell;
  }
  async upsertMatrixCell(cell: any): Promise<any> { return null; }
  async updateMatrixCell(id: number, cellData: Partial<MatrixCell>): Promise<MatrixCell | null> { return null; }
  async deleteMatrixCell(id: number): Promise<boolean>;
  async deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<boolean>;
  async deleteMatrixCell(idOrRowModuleId: number, colModuleId?: number, projectId?: number): Promise<boolean> {
    return false;
  }

  // Test Sheet operations
  async getTestSheets(projectId?: number): Promise<any[]> { return []; }
  async getTestSheet(id: number): Promise<any | null> { return null; }
  async createTestSheet(sheet: any): Promise<any> { return null; }
  async updateTestSheet(id: number, sheetData: any): Promise<any> { return null; }
  async deleteTestSheet(id: number): Promise<boolean> { return false; }
  async duplicateTestSheet(id: number, name: string, userId: number): Promise<any> { return null; }

  // All other placeholder methods for interface compliance
  async getFlowDiagramsByProject(projectId: string): Promise<any[]> { return []; }
  async getFlowDiagram(id: string): Promise<any | null> { return null; }
  async createFlowDiagram(data: any): Promise<any> { return null; }
  async updateFlowDiagram(id: string, data: any): Promise<any> { return null; }
  async deleteFlowDiagram(id: string): Promise<boolean> { return false; }

  async getGitHubConfig(projectId: number): Promise<any | undefined> { return undefined; }
  async createGitHubConfig(data: any): Promise<any> { return null; }
  async updateGitHubConfig(id: number, data: any): Promise<any | null> { return null; }
  async createGitHubIssue(data: any): Promise<any> { return null; }
  async getGitHubIssue(id: number): Promise<any | undefined> { return undefined; }
  async getGitHubIssueByBugId(bugId: number): Promise<any | undefined> { return undefined; }
  async getGitHubIssueByGitHubId(githubId: number): Promise<any | undefined> { return undefined; }
  async updateGitHubIssue(id: number, data: any): Promise<any | null> { return null; }

  // All remaining methods with basic implementations or returns
  async getNotebooks(userId: number): Promise<Notebook[]> { return []; }
  async getNotebook(id: number, userId: number): Promise<Notebook | null> { return null; }
  async createNotebook(notebookData: any): Promise<Notebook> { return {} as Notebook; }
  async updateNotebook(id: number, userId: number, updates: Partial<Notebook>): Promise<Notebook | null> { return null; }
  async deleteNotebook(id: number, userId: number): Promise<boolean> { return false; }
  async searchNotebooks(userId: number, query: string): Promise<Notebook[]> { return []; }
  async getSharedNotebooks(userId: number): Promise<Notebook[]> { return []; }
  async shareNotebook(notebookId: number, userId: number, targetUserIds: number[]): Promise<boolean> { return false; }

  async getNotebookCategories(userId: number): Promise<NotebookCategory[]> { return []; }
  async createNotebookCategory(categoryData: any): Promise<NotebookCategory> { return {} as NotebookCategory; }
  async updateNotebookCategory(id: number, userId: number, updates: any): Promise<NotebookCategory | null> { return null; }
  async deleteNotebookCategory(id: number, userId: number): Promise<boolean> { return false; }

  async getNotebookComments(notebookId: number): Promise<NotebookComment[]> { return []; }
  async createNotebookComment(commentData: any): Promise<NotebookComment> { return {} as NotebookComment; }
  async updateNotebookComment(id: number, authorId: number, updates: any): Promise<NotebookComment | null> { return null; }
  async deleteNotebookComment(id: number, authorId: number): Promise<boolean> { return false; }

  // Chat operations
  async createChatMessage(messageData: any): Promise<any> { return null; }
  async createMessage(messageData: any): Promise<any> { return null; }
  async getChatMessages(projectId: number, limit?: number): Promise<any[]> { return []; }
  async updateChatMessage(messageId: number, userId: number, updates: any): Promise<any | null> { return null; }
  async getMessagesByChat(chatId: number): Promise<any[]> { return []; }
  async createDirectConversation(userId1: number, userId2: number): Promise<any> { return null; }
  async getDirectConversation(userId1: number, userId2: number): Promise<any | null> { return null; }
  async getUserConversations(userId: number): Promise<any[]> { return []; }

  // Comment operations
  async getBugComment(commentId: number): Promise<any> { return null; }
  async updateComment(commentId: number, updates: any): Promise<any> { return null; }

  // Add all other missing methods with placeholder implementations
  async getTraceabilityMatrix(projectId: number): Promise<any> { return null; }
  async saveTraceabilityMatrix(projectId: number, matrixData: any[]): Promise<any> { return null; }
  async getTraceabilityMatrixById(id: number): Promise<any | undefined> { return undefined; }
  async createTraceabilityMatrix(matrix: any): Promise<any> { return null; }
  async updateTraceabilityMatrix(id: number, matrix: any): Promise<any> { return null; }
  async deleteTraceabilityMatrix(id: number): Promise<boolean> { return false; }
  async getTraceabilityMarkers(projectId: number): Promise<any[]> { return []; }
  async getTraceabilityMarker(id: number): Promise<any | undefined> { return undefined; }
  async createTraceabilityMarker(marker: any): Promise<any> { return null; }
  async updateTraceabilityMarker(id: number, marker: any): Promise<any> { return null; }
  async deleteTraceabilityMarker(id: number): Promise<boolean> { return false; }
  async getTraceabilityMatrixCells(matrixId: number): Promise<any[]> { return []; }
  async createTraceabilityMatrixCell(cell: any): Promise<any> { return null; }
  async updateTraceabilityMatrixCell(id: number, cell: any): Promise<any> { return null; }

  // Enhanced Chat and Messaging methods
  async getChatsByUser(userId: number): Promise<any[]> { return []; }
  async addParticipantToConversation(conversationId: number, userId: number): Promise<boolean> { return false; }
  async removeParticipantFromConversation(conversationId: number, userId: number): Promise<boolean> { return false; }
  async updateConversation(id: number, updates: any): Promise<any | null> { return null; }
  async deleteConversation(id: number): Promise<boolean> { return false; }
  async addConversationMember(conversationId: number, userId: number): Promise<boolean> { return false; }
  async removeConversationMember(conversationId: number, userId: number): Promise<boolean> { return false; }
  async getConversationMembers(conversationId: number): Promise<any[]> { return []; }
  async getChatMessage(id: number): Promise<any | null> { return null; }
  async deleteChatMessage(id: number, userId: number): Promise<boolean> { return false; }
  async addMessageReaction(messageId: number, userId: number, emoji: string): Promise<any | null> { return null; }
  async getMessageThread(parentMessageId: number): Promise<any[]> { return []; }
  async markMessageAsRead(messageId: number, userId: number): Promise<void> { }
  async markConversationAsRead(conversationId: number, userId: number): Promise<void> { }
  async getUnreadCountForUser(conversationId: number, userId: number): Promise<number> { return 0; }
  async searchMessages(query: string, conversationId?: number, userId?: number): Promise<any[]> { return []; }
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<any[]> { return []; }
  async createDirectMessage(messageData: any): Promise<any> { return null; }
  async updateDirectMessage(messageId: number, userId: number, updates: any): Promise<any | null> { return null; }
  async deleteDirectMessage(messageId: number, userId: number): Promise<boolean> { return false; }

  // All other interface methods with placeholder implementations
  async getEmployees(): Promise<any[]> { return []; }
  async getEmployee(id: number): Promise<any | undefined> { return undefined; }
  async createEmployee(data: any): Promise<any> { return null; }
  async updateEmployee(id: number, data: any): Promise<any | null> { return null; }
  async deleteEmployee(id: number): Promise<boolean> { return false; }
  async getEmployeeByEmail(email: string): Promise<any | undefined> { return undefined; }
  async importEmployees(employees: any[]): Promise<{ successCount: number; errorCount: number; errors: string[] }> { 
    return { successCount: 0, errorCount: 0, errors: [] }; 
  }

  async getEmployeeProjects(employeeId?: number): Promise<any[]> { return []; }
  async createEmployeeProject(data: any): Promise<any> { return null; }
  async deleteEmployeeProject(id: number): Promise<boolean> { return false; }
  async updateEmployeeProject(id: number, data: Partial<any>): Promise<any> { return null; }
  async getEmployeeProjectHistory(employeeId: number): Promise<any[]> { return []; }
  async getAllEmployeeProjectHistory(): Promise<any[]> { return []; }
  async getEmployeeProjectAllocation(allocationId: number): Promise<any | null> { return null; }
  async createEmployeeProjectHistory(historyData: any): Promise<any> { return null; }
  async extendEmployeeProject(allocationId: number, newEndDate: string, extensionDays?: number): Promise<any> { return null; }

  async getTechnologyOptions(): Promise<any[]> { return []; }
  async createTechnologyOption(data: any): Promise<any> { return null; }

  async getDepartmentOptions(): Promise<any[]> { return []; }
  async createDepartmentOption(data: any): Promise<any> { return null; }

  async getNavadhitiProjects(): Promise<any[]> { return []; }
  async getNavadhitiProject(id: number): Promise<any | undefined> { return undefined; }
  async createNavadhitiProject(data: any): Promise<any> { return null; }
  async updateNavadhitiProject(id: number, data: any): Promise<any | null> { return null; }
  async deleteNavadhitiProject(id: number): Promise<boolean> { return false; }

  async getStatusReviews(date?: string): Promise<any[]> { return []; }
  async createStatusReview(data: any): Promise<any> { return null; }

  async getTodos(userId: number): Promise<any[]> { return []; }
  async getTodosByUserId(userId: number): Promise<any[]> { return []; }
  async getTodo(id: number): Promise<any | undefined> { return undefined; }
  async createTodo(data: any): Promise<any> { return null; }
  async updateTodo(id: number, data: any): Promise<any | null> { return null; }
  async deleteTodo(id: number): Promise<boolean> { return false; }
  async getTodoLists(userId: number): Promise<any[]> { return []; }
  async getTodoList(id: number): Promise<any | undefined> { return undefined; }
  async createTodoList(data: any): Promise<any> { return null; }
  async updateTodoList(id: number, data: any): Promise<any | null> { return null; }
  async deleteTodoList(id: number): Promise<boolean> { return false; }
  async getTodosByListId(listId: number): Promise<any[]> { return []; }

  async getRequestFormTypes(): Promise<any[]> { return []; }
  async getRequestFormType(id: number): Promise<any | undefined> { return undefined; }
  async createRequestFormType(data: any): Promise<any> { return null; }
  async updateRequestFormType(id: number, data: any): Promise<any | null> { return null; }
  async deleteRequestFormType(id: number): Promise<boolean> { return false; }

  async getOptionsByFormType(formTypeId: number): Promise<any[]> { return []; }
  async getOption(id: number): Promise<any | undefined> { return undefined; }
  async createOption(data: any): Promise<any> { return null; }
  async updateOption(id: number, data: any): Promise<any | null> { return null; }
  async deleteOption(id: number): Promise<boolean> { return false; }

  async getResourceRequests(): Promise<any[]> { return []; }
  async getResourceRequest(id: number): Promise<any | undefined> { return undefined; }
  async createResourceRequest(data: any): Promise<any> { return null; }
  async updateResourceRequest(id: number, data: any): Promise<any | null> { return null; }
  async deleteResourceRequest(id: number): Promise<boolean> { return false; }

  async getResourceRequestExtensions(): Promise<any[]> { return []; }
  async getResourceRequestExtension(id: number): Promise<any | undefined> { return undefined; }
  async createResourceRequestExtension(data: any): Promise<any> { return null; }
  async updateResourceRequestExtension(id: number, data: any): Promise<any | null> { return null; }
  async deleteResourceRequestExtension(id: number): Promise<boolean> { return false; }

  async getRequestComments(requestId: number): Promise<any[]> { return []; }
  async getRequestComment(id: number): Promise<any | undefined> { return undefined; }
  async createRequestComment(data: any): Promise<any> { return null; }
  async updateRequestComment(id: number, data: any): Promise<any | null> { return null; }
  async deleteRequestComment(id: number): Promise<boolean> { return false; }

  async getRequestAttachments(requestId: number): Promise<any[]> { return []; }
  async getRequestAttachment(attachmentId: number): Promise<any | null> { return null; }
  async createRequestAttachment(data: any): Promise<any> { return null; }
  async deleteRequestAttachment(attachmentId: number): Promise<boolean> { return false; }

  async getNotifications(userId: number): Promise<any[]> { return []; }
  async createNotification(data: any): Promise<any> { return null; }
  async markNotificationAsRead(id: number): Promise<any> { return null; }

  async getRoles(): Promise<any[]> { return []; }
  async createRole(role: any): Promise<any> { return null; }
  async updateRole(id: number, data: any): Promise<any | null> { return null; }
  async deleteRole(id: number): Promise<boolean> { return false; }
  async getPermissions(): Promise<any[]> { return []; }
  async createPermission(permission: any): Promise<any> { return null; }
  async updatePermission(id: number, data: any): Promise<any | null> { return null; }
  async deletePermission(id: number): Promise<boolean> { return false; }
  async assignRoleToUser(userId: number, roleId: number): Promise<boolean> { return false; }
  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> { return false; }
  async getUserRoles(userId: number): Promise<any[]> { return []; }
  async getRolePermissions(roleId: number): Promise<any[]> { return []; }
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<boolean> { return false; }
  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> { return false; }
  async getModulesWithPermissions(): Promise<any[]> { return []; }
  async updateEmployeePermissions(employeeId: number, permissions: any[]): Promise<void> { }
  async getEmployeePermissions(employeeId: number): Promise<any[]> { return []; }

  // BRD Operations
  async getBrdDocuments(projectId?: number): Promise<any[]> { return this.brdDocuments; }
  async getBrdDocument(id: number): Promise<any | null> { return this.brdDocuments.find(doc => doc.id === id) || null; }
  async createBrdDocument(data: any): Promise<any> { return this.createBrdDocument(data); }
  async updateBrdDocument(id: number, updateData: any): Promise<any | null> { return this.updateBrdDocument(id, updateData); }
  async deleteBrdDocument(id: number): Promise<boolean> { return this.deleteBrdDocument(id); }

  async getBrdVersions(brdId: number): Promise<any[]> { return this.getBrdVersions(brdId); }
  async getBrdDocumentVersions(brdId: number): Promise<any[]> { return this.getBrdVersions(brdId); }
  async createBrdVersion(versionData: any): Promise<any> { return this.createBrdVersion(versionData); }
  async revertBrdDocumentToVersion(brdId: number, versionId: number): Promise<any | null> { return this.revertBrdDocumentToVersion(brdId, versionId); }

  async getBrdTestCases(brdId: number): Promise<any[]> { return this.getBrdTestCases(brdId); }
  async getBrdTestCase(id: number): Promise<any | null> { return this.getBrdTestCase(id); }
  async createBrdTestCase(data: any): Promise<any> { return this.createBrdTestCase(data); }
  async updateBrdTestCase(id: number, data: any): Promise<any | null> { return this.updateBrdTestCase(id, data); }
  async deleteBrdTestCase(id: number): Promise<boolean> { return this.deleteBrdTestCase(id); }

  // Work Logs
  async getWorkLogs(): Promise<any[]> { return this.trackerWorkLogs; }
  async getUserWorkLogs(userId: number): Promise<any[]> { return this.trackerWorkLogs.filter(wl => wl.userId === userId); }
  async getProjectWorkLogs(projectId: number): Promise<any[]> { return this.trackerWorkLogs.filter(wl => wl.projectId === projectId); }

  // Test Case Status operations
  async updateTestCaseStatus(id: number, status: any): Promise<TestCase | null> { 
    return this.updateTestCase(id, { status });
  }

  // Bug Status operations  
  async updateBugStatus(id: number, status: any): Promise<Bug | null> {
    return this.updateBug(id, { status });
  }

  // Helper methods
  async fixExistingTestCaseIds(): Promise<void> { }

  // Message Read Status tracking
  async createMessageReadStatus(data: any): Promise<any> { return null; }
  async getMessageReadStatuses(messageId: number): Promise<any[]> { return []; }

  // Bug Comments
  async getBugComments(bugId: number): Promise<any[]> { return []; }
  async createBugComment(data: any): Promise<any> { return null; }
  async updateBugComment(id: number, data: any): Promise<any> { return null; }
  async deleteBugComment(id: number): Promise<boolean> { return false; }
  async addCommentReaction(data: any): Promise<any> { return null; }

  // Additional Request Form methods
  async getRequestFormOptions(formTypeId: number): Promise<any[]> { return []; }
  async createRequestFormOption(data: any): Promise<any> { return null; }
  async getResourceRequests(filters?: any): Promise<any[]> { return []; }
  async approveResourceRequest(id: number, data: any): Promise<any> { return null; }
  async createRequestExtension(data: any): Promise<any> { return null; }
  async getRequestExtensions(requestId: number): Promise<any[]> { return []; }</old_str>

  // Employee permissions storage
  private employeePermissions: { employeeId: number; permissions: any[] }[] = [];

  // BRD Documents storage
  private brdDocuments: any[] = [];
  private brdVersions: any[] = [];
  private brdTestCases: any[] = [];
  private nextBrdId = 1;
  private nextBrdVersionId = 1;
  private nextBrdTestCaseId = 1;

  // Bug History storage
  private bugHistoryEntries: BugHistory[] = [];
  private nextBugHistoryId = 1;

  // Bug History operations
  async getBugHistory(bugId: number): Promise<BugHistory[]> {
    return this.bugHistoryEntries
      .filter(entry => entry.bugId === bugId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createBugHistory(history: InsertBugHistory): Promise<BugHistory> {
    const id = this.nextBugHistoryId++;
    const entry: BugHistory = {
      id,
      ...history,
      createdAt: new Date(),
    };

    this.bugHistoryEntries.push(entry);
    return entry;
  }

  async syncBugHistoryWithGitHub(bugId: number, githubEvents: any[]): Promise<void> {
    for (const event of githubEvents) {
      // Check if this GitHub event is already synced
      const existingEntry = this.bugHistoryEntries.find(
        entry => entry.bugId === bugId && entry.githubEventId === event.id.toString()
      );

      if (!existingEntry) {
        let action = 'github_activity';
        let description = `GitHub: ${event.event}`;

        // Map GitHub events to our actions
        switch (event.event) {
          case 'labeled':
          case 'unlabeled':
            action = 'label_changed';
            description = `${event.event === 'labeled' ? 'Added' : 'Removed'} label: ${event.label?.name}`;
            break;
          case 'assigned':
          case 'unassigned':
            action = 'assigned';
            description = `${event.event === 'assigned' ? 'Assigned to' : 'Unassigned from'}: ${event.assignee?.login}`;
            break;
          case 'closed':
          case 'reopened':
            action = 'status_changed';
            description = `Issue ${event.event}`;
            break;
          default:
            description = `GitHub: ${event.event}`;
        }

        await this.createBugHistory({
          bugId,
          action,
          description,
          userId: 1, // System user for GitHub sync
          githubEventId: event.id.toString(),
          githubUrl: event.url,
          metadata: { githubEvent: event },
        });
      }
    }
  }

  // BRD Document operations
  async getBrdDocuments(projectId?: number): Promise<any[]> {
    let results = [...this.brdDocuments];
    if (projectId) {
      results = results.filter(doc => doc.projectId === projectId);
    }
    return results;
  }

  async getBrdDocument(id: number): Promise<any | null> {
    const document = this.brdDocuments.find(doc => doc.id === id) || null;
    if (document) {
      // Include version history
      const versions = await this.getBrdVersions(id);
      return { ...document, versions };
    }
    return null;
  }

  async createBrdDocument(data: any): Promise<any> {
    const id = this.nextBrdId++;
    const now = new Date();

    const document = {
      id,
      ...data,
      version: "1.0",
      status: "Draft",
      createdAt: now,
      updatedAt: now
    };

    this.brdDocuments.push(document);

    // Create initial version record
    await this.createBrdVersion({
      brdId: id,
      version: "1.0",
      changes: "Initial version",
      createdById: data.createdById
    });

    return document;
  }

  async updateBrdDocument(id: number, data: any): Promise<any | null> {
    const index = this.brdDocuments.findIndex(doc => doc.id === id);
    if (index === -1) return null;

    const currentDoc = this.brdDocuments[index];
    const updatedDoc = {
      ...currentDoc,
      ...data,
      updatedAt: new Date()
    };

    // If content changed, create new version
    const contentFields = [
      'overview', 'problemStatement', 'objectives', 'scope',
      'userStories', 'functionalRequirements', 'nonFunctionalRequirements',
      'designNotes', 'dependencies', 'assumptions', 'acceptanceCriteria', 'risks'
    ];

    const hasContentChanges = contentFields.some(field =>
      data[field] !== undefined && data[field] !== currentDoc[field]
    );

    if (hasContentChanges) {
      const versionParts = currentDoc.version.split('.');
      const newMinorVersion = parseInt(versionParts[1]) + 1;
      const newVersion = `${versionParts[0]}.${newMinorVersion}`;

      updatedDoc.version = newVersion;

      // Create version record
      await this.createBrdVersion({
        brdId: id,
        version: newVersion,
        changes: data.changes || "Document updated",
        createdById: data.updatedById || currentDoc.createdById
      });
    }

    this.brdDocuments[index] = updatedDoc;
    return updatedDoc;
  }

  async deleteBrdDocument(id: number): Promise<boolean> {
    const initialLength = this.brdDocuments.length;
    this.brdDocuments = this.brdDocuments.filter(doc => doc.id !== id);
    // Also delete related versions and test cases
    this.brdVersions = this.brdVersions.filter(version => version.brdId !== id);
    this.brdTestCases = this.brdTestCases.filter(testCase => testCase.brdId !== id);
    return this.brdDocuments.length < initialLength;
  }

  // BRD Version operations
  async getBrdVersions(brdId: number): Promise<any[]> {
    return this.brdVersions
      .filter(version => version.brdId === brdId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBrdDocumentVersions(brdId: number): Promise<any[]> {
    return this.getBrdVersions(brdId);
  }

  async createBrdVersion(versionData: any): Promise<any> {
    const id = this.nextBrdVersionId++;
    const version = {
      id,
      brdId: versionData.brdId,
      version: versionData.version,
      data: versionData.data,
      createdById: versionData.createdById,
      createdAt: new Date(),
      comment: versionData.comment || 'Version created',
      ...versionData
    };
    this.brdVersions.push(version);
    return version;
  }

  async revertBrdDocumentToVersion(brdId: number, versionId: number): Promise<any | null> {
    try {
      // Get the version data
      const version = this.brdVersions.find((v: any) => v.id === versionId && v.brdId === brdId);
      if (!version) {
        return null;
      }

      // Get the current document
      const currentDoc = this.brdDocuments.find((doc: any) => doc.id === brdId);
      if (!currentDoc) {
        return null;
      }

      // Create a new version with current data before reverting
      await this.createBrdVersion({
        brdId: brdId,
        version: `${currentDoc.version}_backup_${Date.now()}`,
        data: { ...currentDoc },
        createdById: version.createdById,
        comment: 'Backup before revert'
      });

      // Revert to the specified version
      const revertedData = version.data;
      const updatedDoc = {
        ...currentDoc,
        ...revertedData,
        version: `${revertedData.version}_reverted_${Date.now()}`,
        updatedAt: new Date(),
        updatedById: version.createdById
      };

      // Update the document
      const docIndex = this.brdDocuments.findIndex((doc: any) => doc.id === brdId);
      if (docIndex !== -1) {
        this.brdDocuments[docIndex] = updatedDoc;
        return updatedDoc;
      }

      return null;
    } catch (error) {
      console.error('Error reverting BRD document:', error);
      return null;
    }
  }

  // BRD Test Case operations
  async getBrdTestCases(brdId: number): Promise<any[]> {
    return this.brdTestCases
      .filter(testCase => testCase.brdId === brdId)
      .sort((a, b) => a.testCaseId.localeCompare(b.testCaseId));
  }

  async getBrdTestCase(id: number): Promise<any | null> {
    return this.brdTestCases.find(testCase => testCase.id === id) || null;
  }

  async createBrdTestCase(data: any): Promise<any> {
    const id = this.nextBrdTestCaseId++;
    const now = new Date();

    const testCase = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    this.brdTestCases.push(testCase);
    return testCase;
  }

  async updateBrdTestCase(id: number, data: any): Promise<any | null> {
    const index = this.brdTestCases.findIndex(testCase => testCase.id === id);
    if (index === -1) return null;

    const updatedTestCase = {
      ...this.brdTestCases[index],
      ...data,
      updatedAt: new Date()
    };

    this.brdTestCases[index] = updatedTestCase;
    return updatedTestCase;
  }

  async deleteBrdTestCase(id: number): Promise<boolean> {
    const initialLength = this.brdTestCases.length;
    this.brdTestCases = this.brdTestCases.filter(testCase => testCase.id !== id);
    return this.brdTestCases.length < initialLength;
  }

  // Project Tracker Storage Methods
  private trackerProjects: TrackerProject[] = [];
  private trackerFeatures: TrackerFeature[] = [];
  private trackerSubFeatures: TrackerSubFeature[] = [];
  private trackerWorkLogs: TrackerWorkLog[] = [];
  private trackerTimelineExtensions: TrackerTimelineExtension[] = [];
  private trackerDependencies: TrackerDependency[] = [];
  private trackerAuditLogs: TrackerAuditLog[] = [];
  private trackerCustomDropdowns: TrackerCustomDropdown[] = [];
  private nextTrackerProjectId = 1;
  private nextTrackerFeatureId = 1;
  private nextTrackerSubFeatureId = 1;
  private nextTrackerWorkLogId = 1;
  private nextTrackerTimelineExtensionId = 1;
  private nextTrackerDependencyId = 1;
  private nextTrackerAuditLogId = 1;
  private nextTrackerCustomDropdownId = 1;

  // Tracker Projects
  async getTrackerProjects(): Promise<TrackerProject[]> {
    return this.trackerProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrackerProject(id: number): Promise<TrackerProject | null> {
    return this.trackerProjects.find(p => p.id === id) || null;
  }

  async createTrackerProject(data: InsertTrackerProject): Promise<TrackerProject> {
    const project: TrackerProject = {
      id: this.nextTrackerProjectId++,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerProjects.push(project);
    return project;
  }

  async updateTrackerProject(id: number, data: Partial<TrackerProject>): Promise<TrackerProject | null> {
    const index = this.trackerProjects.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.trackerProjects[index] = {
      ...this.trackerProjects[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.trackerProjects[index];
  }

  async deleteTrackerProject(id: number): Promise<boolean> {
    const index = this.trackerProjects.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.trackerProjects.splice(index, 1);
    return true;
  }

  // Tracker Features
  async getTrackerFeatures(projectId?: number): Promise<TrackerFeature[]> {
    if (projectId) {
      return this.trackerFeatures.filter(f => f.projectId === projectId);
    }
    return this.trackerFeatures;
  }

  async getTrackerFeature(id: number): Promise<TrackerFeature | null> {
    return this.trackerFeatures.find(f => f.id === id) || null;
  }

  async createTrackerFeature(data: InsertTrackerFeature): Promise<TrackerFeature> {
    const feature: TrackerFeature = {
      id: this.nextTrackerFeatureId++,
      ...data,
      progressPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerFeatures.push(feature);
    return feature;
  }

  async updateTrackerFeature(id: number, data: Partial<TrackerFeature>): Promise<TrackerFeature | null> {
    const index = this.trackerFeatures.findIndex(f => f.id === id);
    if (index === -1) return null;

    this.trackerFeatures[index] = {
      ...this.trackerFeatures[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.trackerFeatures[index];
  }

  async deleteTrackerFeature(id: number): Promise<boolean> {
    const index = this.trackerFeatures.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.trackerFeatures.splice(index, 1);
    return true;
  }

  // Tracker Sub-Features
  async getTrackerSubFeatures(featureId?: number, projectId?: number): Promise<TrackerSubFeature[]> {
    let subFeatures = this.trackerSubFeatures;

    if (featureId) {
      subFeatures = subFeatures.filter(sf => sf.featureId === featureId);
    }
    if (projectId) {
      subFeatures = subFeatures.filter(sf => sf.projectId === projectId);
    }

    return subFeatures;
  }

  async getTrackerSubFeature(id: number): Promise<TrackerSubFeature | null> {
    return this.trackerSubFeatures.find(sf => sf.id === id) || null;
  }

  async createTrackerSubFeature(data: InsertTrackerSubFeature): Promise<TrackerSubFeature> {
    const subFeature: TrackerSubFeature = {
      id: this.nextTrackerSubFeatureId++,
      ...data,
      progressPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerSubFeatures.push(subFeature);
    return subFeature;
  }

  async updateTrackerSubFeature(id: number, data: Partial<TrackerSubFeature>): Promise<TrackerSubFeature | null> {
    const index = this.trackerSubFeatures.findIndex(sf => sf.id === id);
    if (index === -1) return null;

    this.trackerSubFeatures[index] = {
      ...this.trackerSubFeatures[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.trackerSubFeatures[index];
  }

  async deleteTrackerSubFeature(id: number): Promise<boolean> {
    const index = this.trackerSubFeatures.findIndex(sf => sf.id === id);
    if (index === -1) return false;
    this.trackerSubFeatures.splice(index, 1);
    return true;
  }

  // Work Logs
  async getTrackerWorkLogs(filters?: {
    projectId?: number;
    featureId?: number;
    subFeatureId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TrackerWorkLog[]> {
    let workLogs = this.trackerWorkLogs;

    if (filters) {
      if (filters.projectId) {
        workLogs = workLogs.filter(wl => wl.projectId === filters.projectId);
      }
      if (filters.featureId) {
        workLogs = workLogs.filter(wl => wl.featureId === filters.featureId);
      }
      if (filters.subFeatureId) {
        workLogs = workLogs.filter(wl => wl.subFeatureId === filters.subFeatureId);
      }
      if (filters.userId) {
        workLogs = workLogs.filter(wl => wl.userId === filters.userId);
      }
      if (filters.startDate) {
        workLogs = workLogs.filter(wl => wl.workDate >= filters.startDate!);
      }
      if (filters.endDate) {
        workLogs = workLogs.filter(wl => wl.workDate <= filters.endDate!);
      }
    }

    return workLogs;
  }

  async createTrackerWorkLog(data: InsertTrackerWorkLog): Promise<TrackerWorkLog> {
    const workLog: TrackerWorkLog = {
      id: this.nextTrackerWorkLogId++,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerWorkLogs.push(workLog);
    return workLog;
  }

  // Timeline Extensions
  async createTrackerTimelineExtension(data: InsertTrackerTimelineExtension): Promise<TrackerTimelineExtension> {
    const extension: TrackerTimelineExtension = {
      id: this.nextTrackerTimelineExtensionId++,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.trackerTimelineExtensions.push(extension);
    return extension;
  }

  async getTrackerTimelineExtensions(entityType: string, entityId: number): Promise<TrackerTimelineExtension[]> {
    return this.trackerTimelineExtensions.filter(
      te => te.entityType === entityType && te.entityId === entityId
    );
  }

  // Dependencies
  async createTrackerDependency(data: InsertTrackerDependency): Promise<TrackerDependency> {
    const dependency: TrackerDependency = {
      id: this.nextTrackerDependencyId++,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.trackerDependencies.push(dependency);
    return dependency;
  }

  async getTrackerDependencies(entityType?: string, entityId?: number): Promise<TrackerDependency[]> {
    let dependencies = this.trackerDependencies;

    if (entityType && entityId) {
      dependencies = dependencies.filter(
        d => (d.dependentType === entityType && d.dependentId === entityId) ||
            (d.blockerType === entityType && d.blockerId === entityId)
      );
    }

    return dependencies;
  }

  // Custom Dropdowns
  async getTrackerCustomDropdowns(type?: string): Promise<TrackerCustomDropdown[]> {
    if (type) {
      return this.trackerCustomDropdowns.filter(cd => cd.type === type);
    }
    return this.trackerCustomDropdowns;
  }

  async createTrackerCustomDropdown(data: InsertTrackerCustomDropdown): Promise<TrackerCustomDropdown> {
    const dropdown: TrackerCustomDropdown = {
      id: this.nextTrackerCustomDropdownId++,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerCustomDropdowns.push(dropdown);
    return dropdown;
  }

  // Audit Logs
  async getTrackerAuditLogs(entityType?: string, entityId?: number): Promise<TrackerAuditLog[]> {
    let logs = this.trackerAuditLogs;

    if (entityType && entityId) {
      logs = logs.filter(log => log.entityType === entityType && log.entityId === entityId);
    }

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrackerProject(id: number): Promise<TrackerProject | null> {
    return this.trackerProjects.find(p => p.id === id) || null;
  }

  async createTrackerProject(data: InsertTrackerProject): Promise<TrackerProject> {
    const newProject = {
      ...data,
      id: this.nextTrackerProjectId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerProjects.push(newProject);

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'project',
      entityId: newProject.id,
      action: 'created',
      newValues: newProject,
      changedFields: Object.keys(newProject),
      userId: data.createdById,
    });

    return newProject;
  }

  async updateTrackerProject(id: number, data: Partial<TrackerProject>): Promise<TrackerProject | null> {
    const index = this.trackerProjects.findIndex(p => p.id === id);
    if (index === -1) return null;

    const oldProject = { ...this.trackerProjects[index] };
    const updatedProject = {
      ...this.trackerProjects[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.trackerProjects[index] = updatedProject;

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'project',
      entityId: id,
      action: 'updated',
      oldValues: oldProject,
      newValues: updatedProject,
      changedFields: Object.keys(data),
      userId: data.createdById || oldProject.createdById,
    });

    return updatedProject;
  }

  async deleteTrackerProject(id: number): Promise<boolean> {
    const index = this.trackerProjects.findIndex(p => p.id === id);
    if (index === -1) return false;

    const project = this.trackerProjects[index];
    this.trackerProjects.splice(index, 1);

    // Delete related features and sub-features
    this.trackerFeatures = this.trackerFeatures.filter(f => f.projectId !== id);
    this.trackerSubFeatures = this.trackerSubFeatures.filter(sf => sf.projectId !== id);
    this.trackerWorkLogs = this.trackerWorkLogs.filter(wl => wl.projectId !== id);

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'project',
      entityId: id,
      action: 'deleted',
      oldValues: project,
      changedFields: ['deleted'],
      userId: project.createdById,
    });

    return true;
  }

  // Tracker Features
  async getTrackerFeatures(projectId?: number): Promise<TrackerFeature[]> {
    let features = this.trackerFeatures;
    if (projectId) {
      features = features.filter(f => f.projectId === projectId);
    }
    return features.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrackerFeature(id: number): Promise<TrackerFeature | null> {
    return this.trackerFeatures.find(f => f.id === id) || null;
  }

  async createTrackerFeature(data: InsertTrackerFeature): Promise<TrackerFeature> {
    const newFeature = {
      ...data,
      id: this.nextTrackerFeatureId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerFeatures.push(newFeature);

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'feature',
      entityId: newFeature.id,
      action: 'created',
      newValues: newFeature,
      changedFields: Object.keys(newFeature),
      userId: data.createdById,
    });

    return newFeature;
  }

  async updateTrackerFeature(id: number, data: Partial<TrackerFeature>): Promise<TrackerFeature | null> {
    const index = this.trackerFeatures.findIndex(f => f.id === id);
    if (index === -1) return null;

    const oldFeature = { ...this.trackerFeatures[index] };
    const updatedFeature = {
      ...this.trackerFeatures[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.trackerFeatures[index] = updatedFeature;

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'feature',
      entityId: id,
      action: 'updated',
      oldValues: oldFeature,
      newValues: updatedFeature,
      changedFields: Object.keys(data),
      userId: data.createdById || oldFeature.createdById,
    });

    return updatedFeature;
  }

  async deleteTrackerFeature(id: number): Promise<boolean> {
    const index = this.trackerFeatures.findIndex(f => f.id === id);
    if (index === -1) return false;

    const feature = this.trackerFeatures[index];
    this.trackerFeatures.splice(index, 1);

    // Delete related sub-features
    this.trackerSubFeatures = this.trackerSubFeatures.filter(sf => sf.featureId !== id);
    this.trackerWorkLogs = this.trackerWorkLogs.filter(wl => wl.featureId !== id);

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'feature',
      entityId: id,
      action: 'deleted',
      oldValues: feature,
      changedFields: ['deleted'],
      userId: feature.createdById,
    });

    return true;
  }

  // Tracker Sub-Features
  async getTrackerSubFeatures(featureId?: number, projectId?: number): Promise<TrackerSubFeature[]> {
    let subFeatures = this.trackerSubFeatures;
    if (featureId) {
      subFeatures = subFeatures.filter(sf => sf.featureId === featureId);
    }
    if (projectId) {
      subFeatures = subFeatures.filter(sf => sf.projectId === projectId);
    }
    return subFeatures.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrackerSubFeature(id: number): Promise<TrackerSubFeature | null> {
    return this.trackerSubFeatures.find(sf => sf.id === id) || null;
  }

  async createTrackerSubFeature(data: InsertTrackerSubFeature): Promise<TrackerSubFeature> {
    const newSubFeature = {
      ...data,
      id: this.nextTrackerSubFeatureId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerSubFeatures.push(newSubFeature);

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'sub_feature',
      entityId: newSubFeature.id,
      action: 'created',
      newValues: newSubFeature,
      changedFields: Object.keys(newSubFeature),
      userId: data.createdById,
    });

    return newSubFeature;
  }

  async updateTrackerSubFeature(id: number, data: Partial<TrackerSubFeature>): Promise<TrackerSubFeature | null> {
    const index = this.trackerSubFeatures.findIndex(sf => sf.id === id);
    if (index === -1) return null;

    const oldSubFeature = { ...this.trackerSubFeatures[index] };
    const updatedSubFeature = {
      ...this.trackerSubFeatures[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.trackerSubFeatures[index] = updatedSubFeature;

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'sub_feature',
      entityId: id,
      action: 'updated',
      oldValues: oldSubFeature,
      newValues: updatedSubFeature,
      changedFields: Object.keys(data),
      userId: data.createdById || oldSubFeature.createdById,
    });

    return updatedSubFeature;
  }

  async deleteTrackerSubFeature(id: number): Promise<boolean> {
    const index = this.trackerSubFeatures.findIndex(sf => sf.id === id);
    if (index === -1) return false;

    const subFeature = this.trackerSubFeatures[index];
    this.trackerSubFeatures.splice(index, 1);

    // Delete related work logs
    this.trackerWorkLogs = this.trackerWorkLogs.filter(wl => wl.subFeatureId !== id);

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'sub_feature',
      entityId: id,
      action: 'deleted',
      oldValues: subFeature,
      changedFields: ['deleted'],
      userId: subFeature.createdById,
    });

    return true;
  }

  // Work Logs
  async getTrackerWorkLogs(filters?: {
    projectId?: number;
    featureId?: number;
    subFeatureId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TrackerWorkLog[]> {
    let workLogs = this.trackerWorkLogs;

    if (filters) {
      if (filters.projectId) workLogs = workLogs.filter(wl => wl.projectId === filters.projectId);
      if (filters.featureId) workLogs = workLogs.filter(wl => wl.featureId === filters.featureId);
      if (filters.subFeatureId) workLogs = workLogs.filter(wl => wl.subFeatureId === filters.subFeatureId);
      if (filters.userId) workLogs = workLogs.filter(wl => wl.userId === filters.userId);
      if (filters.startDate) workLogs = workLogs.filter(wl => wl.workDate >= filters.startDate!);
      if (filters.endDate) workLogs = workLogs.filter(wl => wl.workDate <= filters.endDate!);
    }

    return workLogs.sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
  }

  async createTrackerWorkLog(data: InsertTrackerWorkLog): Promise<TrackerWorkLog> {
    const newWorkLog = {
      ...data,
      id: this.nextTrackerWorkLogId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerWorkLogs.push(newWorkLog);

    // Log audit
    await this.createTrackerAuditLog({
      entityType: 'work_log',
      entityId: newWorkLog.id,
      action: 'created',
      newValues: newWorkLog,
      changedFields: Object.keys(newWorkLog),
      userId: data.userId,
    });

    return newWorkLog;
  }

  // Timeline Extensions
  async createTrackerTimelineExtension(data: InsertTrackerTimelineExtension): Promise<TrackerTimelineExtension> {
    const newExtension = {
      ...data,
      id: this.nextTrackerTimelineExtensionId++,
      createdAt: new Date().toISOString(),
    };
    this.trackerTimelineExtensions.push(newExtension);

    // Log audit
    await this.createTrackerAuditLog({
      entityType: data.entityType,
      entityId: data.entityId,
      action: 'extended',
      newValues: { extensionDays: data.extensionDays, reason: data.reason },
      changedFields: ['endDate', 'extensionDays'],
      userId: data.requestedById,
    });

    return newExtension;
  }

  async getTrackerTimelineExtensions(entityType: string, entityId: number): Promise<TrackerTimelineExtension[]> {
    return this.trackerTimelineExtensions
      .filter(ext => ext.entityType === entityType && ext.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Dependencies
  async createTrackerDependency(data: InsertTrackerDependency): Promise<TrackerDependency> {
    const newDependency = {
      ...data,
      id: this.nextTrackerDependencyId++,
      createdAt: new Date().toISOString(),
    };
    this.trackerDependencies.push(newDependency);

    return newDependency;
  }

  async getTrackerDependencies(entityType?: string, entityId?: number): Promise<TrackerDependency[]> {
    let dependencies = this.trackerDependencies;
    if (entityType && entityId) {
      dependencies = dependencies.filter(d => 
        (d.dependentType === entityType && d.dependentId === entityId) ||
        (d.blockerType === entityType && d.blockerId === entityId)
      );
    }
    return dependencies;
  }

  // Custom Dropdowns
  async getTrackerCustomDropdowns(type?: string): Promise<TrackerCustomDropdown[]> {
    let dropdowns = this.trackerCustomDropdowns.filter(d => d.isActive);
    if (type) {
      dropdowns = dropdowns.filter(d => d.type === type);
    }
    return dropdowns.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createTrackerCustomDropdown(data: InsertTrackerCustomDropdown): Promise<TrackerCustomDropdown> {
    const newDropdown = {
      ...data,
      id: this.nextTrackerCustomDropdownId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackerCustomDropdowns.push(newDropdown);
    return newDropdown;
  }

  // Audit Logs
  async createTrackerAuditLog(data: InsertTrackerAuditLog): Promise<TrackerAuditLog> {
    const newLog = {
      ...data,
      id: this.nextTrackerAuditLogId++,
      createdAt: new Date().toISOString(),
    };
    this.trackerAuditLogs.push(newLog);
    return newLog;
  }

  async getTrackerAuditLogs(entityType?: string, entityId?: number): Promise<TrackerAuditLog[]> {
    let logs = this.trackerAuditLogs;
    if (entityType && entityId) {
      logs = logs.filter(log => log.entityType === entityType && log.entityId === entityId);
    }
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// Export storage and class
export const storage = new MemStorage();

export { MemStorage };