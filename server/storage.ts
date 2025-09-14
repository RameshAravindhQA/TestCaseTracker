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
  InsertTrackerCustomDropdown
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

  // Notebook storage
  private notebooks: Notebook[] = [];
  private notebookCategories: NotebookCategory[] = [];
  private notebookComments: NotebookComment[] = [];
  private nextNotebookId = 1;
  private nextNotebookCategoryId = 1;
  private nextNotebookCommentId = 1;

  // Employee permissions storage
  private employeePermissions: { employeeId: number; permissions: any[] }[] = [];

  // BRD Documents storage
  private brdDocuments: any[] = [];
  private brdVersions: any[] = [];
  private brdTestCases: any[] = [];
  private nextBrdId = 1;
  private nextBrdVersionId = 1;
  private nextBrdTestCaseId = 1;

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

  // Initialize data property for compatibility
  private data: any = {
    todoLists: [],
    testCases: [], // Added to ensure testCases array is available in data
    bugs: [],
    activities: [],
    customMarkers: [],
    bugComments: [], // Initialize bugComments
    bugCommentReactions: [] // Initialize bugCommentReactions
  };

  // Employee Management Methods Implementation
  async getEmployees(): Promise<any[]> {
    return [...this.employees];
  }

  async getEmployee(id: number): Promise<any | undefined> {
    return this.employees.find(emp => emp.id === id);
  }

  async getEmployeeByEmail(email: string): Promise<any | undefined> {
    return this.employees.find(emp => emp.email === email);
  }

  async createEmployee(data: any): Promise<any> {
    const id = this.getNextId();
    const employee = {
      id: id,
      employeeId: data.employeeId || `EMP-${String(Date.now()).slice(-6)}`,
      firstName: data.firstName,
      lastName: data.lastName || '',
      email: data.email,
      phoneNumber: data.phone || data.phoneNumber || '',
      department: data.department || '',
      designation: data.designation || '',
      joiningDate: data.joiningDate || new Date().toISOString(),
      status: data.status || 'Active',
      technologies: (() => {
        if (Array.isArray(data.technologies)) {
          return data.technologies;
        }
        if (typeof data.technologies === 'string' && data.technologies.trim()) {
          return data.technologies.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
        return [];
      })(),
      locality: data.locality || '',
      overallExperience: data.overallExperience || '',
      profilePicture: data.profilePicture || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: data.createdById || 1
    };

    this.employees.push(employee);
    return employee;
  }

  async updateEmployee(id: number, data: any): Promise<any | null> {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) return null;

    const updatedEmployee = {
      ...this.employees[index],
      ...data,
      updatedAt: new Date()
    };

    this.employees[index] = updatedEmployee;
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const initialLength = this.employees.length;
    this.employees = this.employees.filter(emp => emp.id !== id);
    return this.employees.length < initialLength;
  }

  async importEmployees(employees: any[]): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < employees.length; i++) {
      try {
        const empData = employees[i];

        // Validate required fields
        if (!empData.firstName || !empData.email) {
          errors.push(`Row ${i + 1}: Missing required fields (firstName, email)`);
          errorCount++;
          continue;
        }

        // Check if employee already exists
        const existingEmployee = await this.getEmployeeByEmail(empData.email);
        if (existingEmployee) {
          errors.push(`Row ${i + 1}: Employee with email ${empData.email} already exists`);
          errorCount++;
          continue;
        }

        await this.createEmployee(empData);
        successCount++;
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }

    return { successCount, errorCount, errors };
  }

  // Enhanced Chat and Messaging methods
  private conversations = new Map<number, { id: number; type: 'direct' | 'group'; participants: number[]; createdAt: Date; updatedAt: Date }>();
  private chatMessagesMap = new Map<number, ChatMessage>(); // Use Map for better indexing
  private messageReactions = new Map<number, any[]>();
  private messageThreads = new Map<number, number[]>();
  private conversationMembers = new Map<number, Set<number>>();
  private messageReadStatus = new Map<string, Set<number>>(); // messageId-userId -> Set<userId>
  private conversationMessages = new Map<number, any[]>(); // conversationId -> messages array
  private userUnreadCounts = new Map<number, number>(); // userId -> unread count
  private chatMessages: ChatMessage[] = [];
  private messages: any[] = [];
  private nextMessageId = 1;
  private nextChatId = 1;

  // Helper method for conversation management
  private async getOrCreateConversationId(userId1: number, userId2: number): Promise<number> {
    // Check if a direct conversation already exists
    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.type === 'direct' &&
          conversation.participants.includes(userId1) &&
          conversation.participants.includes(userId2)) {
        return id;
      }
    }

    // Create a new conversation
    const conversation = await this.createDirectConversation(userId1, userId2);
    return conversation.id;
  }

  // Chat method implementations
  async createChatMessage(messageData: any): Promise<any> {
    try {
      const id = this.nextMessageId++;
      const now = new Date();

      const chatMessage = {
        id,
        projectId: messageData.projectId || messageData.conversationId || 1,
        userId: messageData.userId,
        userName: messageData.userName,
        userAvatar: messageData.userAvatar,
        message: messageData.message,
        timestamp: now,
        createdAt: now.toISOString(),
        type: messageData.type || 'text',
        mentionedUsers: messageData.mentionedUsers || [],
        ...messageData
      };

      this.chatMessages.push(chatMessage);
      this.chatMessagesMap.set(id, chatMessage);

      // Also store in project conversation messages
      const projectConversationId = messageData.projectId || messageData.conversationId || 1;
      const projectMessages = this.conversationMessages.get(projectConversationId) || [];
      projectMessages.push(chatMessage);
      this.conversationMessages.set(projectConversationId, projectMessages);

      return chatMessage;
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw error;
    }
  }

  async createMessage(messageData: any): Promise<any> {
    try {
      const id = this.nextMessageId++;
      const now = new Date();

      // Get sender information for complete message
      const sender = await this.getUser(messageData.senderId);

      const message = {
        id,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        timestamp: now.toISOString(),
        createdAt: now.toISOString(),
        isRead: false,
        type: messageData.type || 'text',
        attachments: messageData.attachments || [],
        sender: sender || {
          id: messageData.senderId,
          firstName: 'Unknown',
          lastName: '',
          email: ''
        },
        ...messageData
      };

      this.messages.push(message);

      // Also store in conversation messages for consistent retrieval
      const conversationId = await this.getOrCreateConversationId(messageData.senderId, messageData.receiverId);
      const conversationMessages = this.conversationMessages.get(conversationId) || [];
      conversationMessages.push(message);
      this.conversationMessages.set(conversationId, conversationMessages);

      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getChatMessages(projectId: number, limit?: number): Promise<any[]> {
    try {
      let messages = this.chatMessages.filter(msg => msg.projectId === projectId);
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (limit) {
        messages = messages.slice(-limit);
      }

      return messages;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async getMessagesByChat(chatId: number): Promise<any[]> {
    try {
      return this.conversationMessages.get(chatId) || [];
    } catch (error) {
      console.error('Error getting messages by chat:', error);
      return [];
    }
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<any[]>{
    try {
      const messages = this.messages.filter(msg =>
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      );

      return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('Error getting messages between users:', error);
      return [];
    }
  }

  async createDirectConversation(userId1: number, userId2: number): Promise<any> {
    try {
      const conversationId = this.nextChatId++;
      const conversation = {
        id: conversationId,
        participants: [userId1, userId2],
        type: 'direct',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.conversations.set(conversationId, conversation);
      this.conversationMembers.set(conversationId, new Set([userId1, userId2]));
      this.conversationMessages.set(conversationId, []);

      return conversation;
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      throw error;
    }
  }

  async getDirectConversation(userId1: number, userId2: number): Promise<any | null> {
    try {
      for (const [id, conversation] of this.conversations.entries()) {
        if (conversation.type === 'direct' &&
            conversation.participants.includes(userId1) &&
            conversation.participants.includes(userId2)) {
          return conversation;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting direct conversation:', error);
      return null;
    }
  }

  async getUserConversations(userId: number): Promise<any[]> {
    try {
      const conversations = [];
      for (const conversation of this.conversations.values()) {
        if (conversation.participants && conversation.participants.includes(userId)) {
          conversations.push(conversation);
        }
      }
      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  async updateChatMessage(messageId: number, userId: number, updates: any): Promise<any | null> {
    try {
      const message = this.chatMessagesMap.get(messageId);
      if (!message || message.userId !== userId) {
        return null;
      }

      Object.assign(message, updates, { updatedAt: new Date() });
      return message;
    } catch (error) {
      console.error('Error updating chat message:', error);
      return null;
    }
  }

  async getChatMessage(id: number): Promise<any | null> {
    try {
      return this.chatMessagesMap.get(id) || null;
    } catch (error) {
      console.error('Error getting chat message:', error);
      return null;
    }
  }

  async createDirectMessage(messageData: any): Promise<any> {
    return this.createMessage(messageData);
  }

  async updateDirectMessage(messageId: number, userId: number, updates: any): Promise<any | null> {
    try {
      const messageIndex = this.messages.findIndex(msg => msg.id === messageId && msg.senderId === userId);
      if (messageIndex === -1) {
        return null;
      }

      this.messages[messageIndex] = { ...this.messages[messageIndex], ...updates, updatedAt: new Date() };
      return this.messages[messageIndex];
    } catch (error) {
      console.error('Error updating direct message:', error);
      return null;
    }
  }

  async deleteDirectMessage(messageId: number, userId: number): Promise<boolean> {
    try {
      const initialLength = this.messages.length;
      this.messages = this.messages.filter(msg => !(msg.id === messageId && msg.senderId === userId));
      return this.messages.length < initialLength;
    } catch (error) {
      console.error('Error deleting direct message:', error);
      return false;
    }
  }

  // Additional messaging methods for enhanced functionality
  async getChatsByUser(userId: number): Promise<any[]> {
    return this.getUserConversations(userId);
  }

  async addParticipantToConversation(conversationId: number, userId: number): Promise<boolean> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) return false;

      if (!conversation.participants.includes(userId)) {
        conversation.participants.push(userId);
        const members = this.conversationMembers.get(conversationId) || new Set();
        members.add(userId);
        this.conversationMembers.set(conversationId, members);
      }

      return true;
    } catch (error) {
      console.error('Error adding participant to conversation:', error);
      return false;
    }
  }

  async removeParticipantFromConversation(conversationId: number, userId: number): Promise<boolean> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) return false;

      conversation.participants = conversation.participants.filter((id: number) => id !== userId);
      const members = this.conversationMembers.get(conversationId);
      if (members) {
        members.delete(userId);
      }

      return true;
    } catch (error) {
      console.error('Error removing participant from conversation:', error);
      return false;
    }
  }

  async updateConversation(id: number, updates: any): Promise<any | null> {
    try {
      const conversation = this.conversations.get(id);
      if (!conversation) return null;

      Object.assign(conversation, updates, { updatedAt: new Date() });
      return conversation;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return null;
    }
  }

  async deleteConversation(id: number): Promise<boolean> {
    try {
      return this.conversations.delete(id);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  async addConversationMember(conversationId: number, userId: number): Promise<boolean> {
    return this.addParticipantToConversation(conversationId, userId);
  }

  async removeConversationMember(conversationId: number, userId: number): Promise<boolean> {
    return this.removeParticipantFromConversation(conversationId, userId);
  }

  async getConversationMembers(conversationId: number): Promise<any[]> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) return [];

      return conversation.participants || [];
    } catch (error) {
      console.error('Error getting conversation members:', error);
      return [];
    }
  }

  async deleteChatMessage(id: number, userId: number): Promise<boolean> {
    try {
      const message = this.chatMessagesMap.get(id);
      if (!message || message.userId !== userId) {
        return false;
      }

      this.chatMessages = this.chatMessages.filter(msg => msg.id !== id);
      return this.chatMessagesMap.delete(id);
    } catch (error) {
      console.error('Error deleting chat message:', error);
      return false;
    }
  }

  async addMessageReaction(messageId: number, userId: number, emoji: string): Promise<any | null> {
    try {
      const reactions = this.messageReactions.get(messageId) || [];
      const existingReaction = reactions.find(r => r.userId === userId && r.emoji === emoji);

      if (existingReaction) {
        return existingReaction;
      }

      const reaction = { userId, emoji, timestamp: new Date() };
      reactions.push(reaction);
      this.messageReactions.set(messageId, reactions);

      return reaction;
    } catch (error) {
      console.error('Error adding message reaction:', error);
      return null;
    }
  }

  async getMessageThread(parentMessageId: number): Promise<any[]> {
    try {
      return this.messageThreads.get(parentMessageId) || [];
    } catch (error) {
      console.error('Error getting message thread:', error);
      return [];
    }
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    try {
      const key = `${messageId}`;
      const readByUsers = this.messageReadStatus.get(key) || new Set();
      readByUsers.add(userId);
      this.messageReadStatus.set(key, readByUsers);

      // Also update the message's isRead status if it's a direct message
      const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1 && this.messages[messageIndex].receiverId === userId) {
        this.messages[messageIndex].isRead = true;
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async markConversationAsRead(conversationId: number, userId: number): Promise<void> {
    try {
      const messages = this.conversationMessages.get(conversationId) || [];
      for (const message of messages) {
        await this.markMessageAsRead(message.id, userId);
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }

  async getUnreadCountForUser(conversationId: number, userId: number): Promise<number> {
    try {
      const messages = this.conversationMessages.get(conversationId) || [];
      let unreadCount = 0;

      for (const message of messages) {
        if (message.userId !== userId) {
          const key = `${message.id}`;
          const readByUsers = this.messageReadStatus.get(key) || new Set();
          if (!readByUsers.has(userId)) {
            unreadCount++;
          }
        }
      }

      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async searchMessages(query: string, conversationId?: number, userId?: number): Promise<any[]> {
    try {
      let messages = conversationId ?
        (this.conversationMessages.get(conversationId) || []) :
        this.chatMessages;

      if (userId) {
        messages = messages.filter(msg => msg.userId === userId);
      }

      return messages.filter(msg =>
        msg.message && msg.message.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Unread message tracking methods
  async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      // Count unread messages for this user
      let unreadCount = 0;

      // Count direct messages where user is receiver and not read
      const directMessages = this.messages.filter(msg =>
        msg.receiverId === userId && !msg.isRead
      );
      unreadCount += directMessages.length;

      // Count chat messages in conversations where user participates
      for (const [conversationId, messages] of this.conversationMessages.entries()) {
        const conversation = this.conversations.get(conversationId);
        if (conversation && conversation.participants.includes(userId)) {
          for (const message of messages) {
            if (message.userId !== userId) { // Not sent by this user
              const key = `${message.id}`;
              const readByUsers = this.messageReadStatus.get(key) || new Set();
              if (!readByUsers.has(userId)) {
                unreadCount++;
              }
            }
          }
        }
      }

      console.log(`Storage: User ${userId} has ${unreadCount} unread messages`);
      return unreadCount;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  // Get unread message count per sender for a user
  getUnreadMessageCountBySender(userId: number): { senderId: number; senderName: string; count: number }[] {
    try {
      const unreadMessages = this.chatMessages.filter(m => m.receiverId === userId && !m.isRead);
      const senderCounts = new Map<number, { count: number; senderName: string }>();

      unreadMessages.forEach(message => {
        const sender = this.users.find(u => u.id === message.senderId);
        const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'Unknown User';

        if (senderCounts.has(message.senderId)) {
          senderCounts.get(message.senderId)!.count++;
        } else {
          senderCounts.set(message.senderId, { count: 1, senderName });
        }
      });

      const result = Array.from(senderCounts.entries()).map(([senderId, { count, senderName }]) => ({
        senderId,
        senderName,
        count
      }));

      console.log(`Storage: User ${userId} unread messages by sender:`, result);
      return result;
    } catch (error) {
      console.error('Error getting unread message count by sender:', error);
      return [];
    }
  }

  // Mark messages as read between two users
  markMessagesAsRead(receiverId: number, senderId: number): boolean {
    try {
      let markedCount = 0;
      this.chatMessages.forEach(message => {
        if (message.receiverId === receiverId && message.senderId === senderId && !message.isRead) {
          message.isRead = true;
          markedCount++;
        }
      });

      console.log(`Storage: Marked ${markedCount} messages as read between sender ${senderId} and receiver ${receiverId}`);
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  async markAllMessagesAsRead(userId: number): Promise<void> {
    try {
      // Mark direct messages as read
      this.messages.forEach(msg => {
        if (msg.receiverId === userId) {
          msg.isRead = true;
        }
      });

      // Mark conversation messages as read
      for (const [conversationId, messages] of this.conversationMessages.entries()) {
        const conversation = this.conversations.get(conversationId);
        if (conversation && conversation.participants.includes(userId)) {
          for (const message of messages) {
            if (message.userId !== userId) {
              this.markMessageAsRead(message.id, userId);
            }
          }
        }
      }

      console.log(`Storage: Marked all messages as read for user ${userId}`);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  }

  // Todo Management Maps
  private todoListsMap = new Map<number, any>();
  private todosMap = new Map<number, any>();

  // Employee Management Storage
  private employees: any[] = [];
  private employeeProjects: any[] = [];
  private technologyOptions: any[] = [];
  private departmentOptions: any[] = [];
  private navadhitiProjects: any[] = [];
  private statusReviews = new Map<number, any>();
  private employeeProjectHistory: any[] = []; // Added for storing history
  private nextEmployeeId = 1;

  // Request Forms Module Maps
  private requestFormTypes: any[] = [];
  private requestFormOptions: any[] = [];
  private resourceRequests: any[] = [];
  private requestExtensions: any[] = [];
  private requestComments: any[] = [];
  private requestAttachments: any[] = [];
  private notifications = new Map<number, any>();

  // Flow diagram storage
  private flowDiagrams = new Map<string, any>();
  private nextFlowDiagramId = 1;

  // ID counters
  private nextUserId = 1;
  private nextProjectId = 1;
  private nextModuleId = 1;
  private nextTestCaseId = 1;
  private nextBugId = 1;
  private nextActivityId = 1;
  private nextDocumentFolderId = 1;
  private nextDocumentId = 1;
  private nextTimeSheetId = 1;
  private nextTimeSheetFolderId = 1;
  private nextCustomerId = 1;


  private initializeEmployeeDefaults() {
    // Add default technology options
    const defaultTechOptions = [
      { id: 1, name: 'React', createdAt: new Date() },
      { id: 2, name: 'Node.js', createdAt: new Date() },
      { id: 3, name: 'Python', createdAt: new Date() },
      { id: 4, name: 'Java', createdAt: new Date() },
      { id: 5, name: 'JavaScript', createdAt: new Date() },
      { id: 6, name: 'TypeScript', createdAt: new Date() },
    ];

    defaultTechOptions.forEach(tech => this.technologyOptions.push(tech));

    // Add default department options
    const defaultDeptOptions = [
      { id: 1, name: 'Development', createdAt: new Date() },
      { id: 2, name: 'Quality Assurance', createdAt: new Date() },
      { id: 3, name: 'DevOps', createdAt: new Date() },
      { id: 4, name: 'UI/UX Design', createdAt: new Date() },
      { id: 5, name: 'Project Management', createdAt: new Date() },
    ];

    defaultDeptOptions.forEach(dept => this.departmentOptions.push(dept));
  }

  private getNextId(entityType?: string): number {
    let id = this.nextUserId++;
    // For specific entities like 'employee', you can add more specific ID generation logic if needed.
    return id;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.getNextId();
    const user: User = {
      id: id,
      ...insertUser,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;

    const updatedUser = { ...this.users[index], ...userData };
    this.users[index] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return this.users.length < initialLength;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return [...this.projects];
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    // Get projects created by this user
    const createdProjects = this.projects
      .filter(project => project.createdById === userId);

    // Get projects where user is a member
    const membershipProjects = this.projectMembers
      .filter(member => member.userId === userId)
      .map(member => this.projects.find(p => p.id === member.projectId))
      .filter(project => project !== undefined) as Project[];

    // Combine and remove duplicates
    const projectMap = new Map<number, Project>();

    // Add created projects
    createdProjects.forEach(project => {
      projectMap.set(project.id, project);
    });

    // Add member projects
    membershipProjects.forEach(project => {
      projectMap.set(project.id, project);
    });

    const allAccessibleProjects = Array.from(projectMap.values());

    console.log(`Storage: getProjectsByUserId(${userId}) returning ${allAccessibleProjects.length} projects (${createdProjects.length} created, ${membershipProjects.length} as member)`);

    return allAccessibleProjects;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.find(project => project.id === id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.getNextId();
    const project: Project = {
      id: id,
      ...insertProject,
      createdAt: new Date(),
    };
    this.projects.push(project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const index = this.projects.findIndex(project => project.id === id);
    if (index === -1) return undefined;

    const updatedProject = { ...this.projects[index], ...projectData };
    this.projects[index] = updatedProject;
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    const initialLength = this.projects.length;
    this.projects = this.projects.filter(project => project.id !== id);
    return this.projects.length < initialLength;
  }

  // Module operations
  async getModules(): Promise<Module[]> {
    return [...this.modules];
  }

  async getModulesByProject(projectId: number): Promise<Module[]> {
    console.log(`Storage: getModulesByProject called for projectId: ${projectId}`);
    const filteredModules = this.modules.filter(module => {
      console.log(`Storage: Checking module ${module.id} (${module.name}) - projectId: ${module.projectId} vs requested: ${projectId}`);
      return module.projectId === projectId;
    });
    console.log(`Storage: Returning ${filteredModules.length} modules for project ${projectId}:`,
      filteredModules.map(m => ({ id: m.id, moduleId: m.moduleId, name: m.name, projectId: m.projectId })));
    return filteredModules;
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.find(module => module.id === id);
  }

  async createModule(moduleData: InsertModule): Promise<Module> {
    const id = this.getNextId();

    console.log('Creating module with ID:', id, 'Data:', moduleData);

    // Auto-generate module ID if not provided
    let moduleId = moduleData.moduleId;
    if (!moduleId || moduleId.trim() === '') {
      // Get the project to access its details
      const project = this.projects.find(p => p.id === moduleData.projectId);
      if (!project) {
        throw new Error(`Project with ID ${moduleData.projectId} not found`);
      }

      // Get project prefix (first 2-5 letters of project name, or use project.prefix if available)
      let projectPrefix = project.prefix;
      if (!projectPrefix) {
        // Extract first 2-5 letters from project name
        const cleanProjectName = project.name.replace(/[^a-zA-Z]/g, '');
        if (cleanProjectName.length >= 5) {
          projectPrefix = cleanProjectName.substring(0, 5).toUpperCase();
        } else if (cleanProjectName.length >= 3) {
          projectPrefix = cleanProjectName.substring(0, cleanProjectName.length).toUpperCase();
        } else {
          projectPrefix = cleanProjectName.toUpperCase().padEnd(3, 'X');
        }
      }

      // Get module name prefix (first 3 letters of module name)
      let modulePrefix = 'MOD';
      if (moduleData.name) {
        const cleanModuleName = moduleData.name.replace(/[^a-zA-Z]/g, '');
        if (cleanModuleName.length >= 3) {
          modulePrefix = cleanModuleName.substring(0, 3).toUpperCase();
        } else {
          modulePrefix = cleanModuleName.toUpperCase().padEnd(3, 'X');
        }
      }

      // Get existing modules for this specific project only
      const projectModules = this.modules
        .filter(module => module.projectId === moduleData.projectId);

      console.log('Storage: Project modules found:', projectModules.length, 'for project:', moduleData.projectId, 'with prefix:', projectPrefix, 'module prefix:', modulePrefix);

      // Find the highest module number for this project across ALL module types
      const modulePattern = new RegExp(`^${projectPrefix}-[A-Z]{3}-MOD-(\\d+)$`);
      const existingNumbers = projectModules
        .map(module => {
          if (!module.moduleId) return 0;
          const match = module.moduleId.match(modulePattern);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num) && num > 0);

      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      moduleId = `${projectPrefix}-${modulePrefix}-MOD-${String(nextNumber).padStart(2, '0')}`;

      console.log('Storage: Generated module ID:', moduleId, 'for project:', moduleData.projectId, 'with prefix:', projectPrefix, 'module prefix:', modulePrefix, 'existing numbers:', existingNumbers);
    }

    const module: Module = {
      id,
      ...moduleData,
      moduleId,
      createdAt: new Date(),
    };

    console.log('Module object created with moduleId:', module.moduleId, 'and database ID:', module.id);

    this.modules.push(module);

    console.log('Module stored, total modules:', this.modules.length);

    return module;
  }

  async updateModule(id: number, moduleData: Partial<Module>): Promise<Module | undefined> {
    const index = this.modules.findIndex(module => module.id === id);
    if (index === -1) return undefined;

    const updatedModule = { ...this.modules[index], ...moduleData };
    this.modules[index] = updatedModule;
    return updatedModule;
  }

  async deleteModule(id: number): Promise<boolean> {
    const initialLength = this.modules.length;
    this.modules = this.modules.filter(module => module.id !== id);
    return this.modules.length < initialLength;
  }

  // Test case operations
  async getTestCases(projectId?: number, moduleId?: number): Promise<TestCase[]> {
    if (projectId && moduleId) {
      return this.getTestCasesByFilters(projectId, moduleId);
    } else if (projectId) {
      return this.getTestCasesByProject(projectId);
    }
    return [...this.testCases];
  }

  async getTestCasesByFilters(projectId?: number, moduleId?: number): Promise<TestCase[]> {
    let results = [...this.testCases];

    if (projectId) {
      results = results.filter(tc => tc.projectId === projectId);
      console.log(`Storage: Filtered by projectId ${projectId}, found ${results.length} test cases`);
    }

    if (moduleId) {
      results = results.filter(tc => tc.moduleId === moduleId);
      console.log(`Storage: Filtered by moduleId ${moduleId}, found ${results.length} test cases`);
    }

    console.log(`Storage: getTestCasesByFilters(${projectId}, ${moduleId}) returning ${results.length} test cases:`,
      results.map(tc => ({ id: tc.id, testCaseId: tc.testCaseId, projectId: tc.projectId, moduleId: tc.moduleId })));
    return results;
  }

  async getTestCasesByProject(projectId: number): Promise<TestCase[]> {
    console.log(`Storage: getTestCasesByProject called for projectId: ${projectId}`);
    const results = this.testCases.filter(tc => {
      console.log(`Storage: Checking test case ${tc.id} (${tc.testCaseId}) - projectId: ${tc.projectId} vs requested: ${projectId}, isDeleted: ${tc.isDeleted}`);
      return tc.projectId === projectId && tc.isDeleted !== true;
    });
    console.log(`Storage: getTestCasesByProject(${projectId}) returning ${results.length} active test cases:`,
      results.map(tc => ({ id: tc.id, testCaseId: tc.testCaseId, projectId: tc.projectId })));
    return results;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.testCases.find(testCase => testCase.id === id);
  }

  async createTestCase(insertTestCase: InsertTestCase): Promise<TestCase> {
    const id = this.getNextId();
    const now = new Date();

    // Auto-generate test case ID if not provided
    let testCaseId = insertTestCase.testCaseId;
    if (!testCaseId || testCaseId.trim() === '') {
      // Get the module and project to build the test case ID
      const module = this.modules.find(m => m.id === insertTestCase.moduleId);
      const project = this.projects.find(p => p.id === insertTestCase.projectId);

      if (!module || !project) {
        throw new Error(`Module or Project not found`);
      }

      const projectPrefix = project.prefix || 'DEF';

      // Extract module prefix from module ID with robust logic
      let modulePrefix = 'MOD';
      console.log(`Storage: Module ID: ${module.moduleId}, attempting to extract prefix...`);

      if (module.moduleId && module.moduleId.includes('-')) {
        const moduleIdParts = module.moduleId.split('-');
        console.log(`Storage: Module ID parts:`, moduleIdParts);

        // For format like "BEG-REG-MOD-01", extract "REG" (second part)
        if (moduleIdParts.length >= 4 && moduleIdParts[2] === 'MOD') {
          const potentialPrefix = moduleIdParts[1];
          if (potentialPrefix && potentialPrefix.length >= 2) {
            modulePrefix = potentialPrefix.toUpperCase();
            console.log(`Storage: Extracted module prefix from ID: ${modulePrefix}`);
          }
        }
      }

      // If extraction failed or module doesn't have proper ID format, generate from module name
      if (modulePrefix === 'MOD' && module.name) {
        console.log(`Storage: Generating module prefix from module name: ${module.name}`);
        const cleanModuleName = module.name.replace(/[^a-zA-Z]/g, '').toLowerCase();

        // Smart keyword-based mapping
        if (cleanModuleName.includes('register') || cleanModuleName.includes('registration') || cleanModuleName.includes('signup')) {
          modulePrefix = 'REG';
        } else if (cleanModuleName.includes('login') || cleanModuleName.includes('signin') || cleanModuleName.includes('auth')) {
          modulePrefix = 'LOG';
        } else if (cleanModuleName.includes('profile') || cleanModuleName.includes('account')) {
          modulePrefix = 'PROF';
        } else if (cleanModuleName.includes('dashboard') || cleanModuleName.includes('home')) {
          modulePrefix = 'DASH';
        } else if (cleanModuleName.includes('user') || cleanModuleName.includes('users')) {
          modulePrefix = 'USR';
        } else if (cleanModuleName.includes('admin') || cleanModuleName.includes('administration')) {
          modulePrefix = 'ADM';
        } else if (cleanModuleName.includes('payment') || cleanModuleName.includes('billing')) {
          modulePrefix = 'PAY';
        } else if (cleanModuleName.includes('order') || cleanModuleName.includes('cart')) {
          modulePrefix = 'ORD';
        } else if (cleanModuleName.includes('product') || cleanModuleName.includes('catalog')) {
          modulePrefix = 'PRD';
        } else if (cleanModuleName.includes('search') || cleanModuleName.includes('filter')) {
          modulePrefix = 'SRC';
        } else {
          // Fall back to first 3 characters of clean module name
          const cleanName = module.name.replace(/[^a-zA-Z]/g, '');
          if (cleanName.length >= 3) {
            modulePrefix = cleanName.substring(0, 3).toUpperCase();
          } else {
            modulePrefix = cleanName.toUpperCase().padEnd(3, 'X');
          }
        }
        console.log(`Storage: Generated module prefix from name: ${modulePrefix}`);
      }

      console.log(`Storage: Final module prefix to use: ${modulePrefix}`);

      // Find the highest existing test case number for this specific module
      // Use the exact format: PROJECT-MODULE-TC-###
      const prefixPattern = new RegExp(`^${projectPrefix}-${modulePrefix}-TC-(\\d+)$`);
      const existingTestCases = this.testCases
        .filter(tc => tc.moduleId === insertTestCase.moduleId && tc.projectId === insertTestCase.projectId && !tc.isDeleted)
        .map(tc => tc.testCaseId)
        .filter(id => id && prefixPattern.test(id))
        .map(id => {
          const match = id.match(prefixPattern);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num) && num > 0);

      // Start numbering from 1 for each module independently
      const nextNumber = existingTestCases.length > 0 ? Math.max(...existingTestCases) + 1 : 1;
      testCaseId = `${projectPrefix}-${modulePrefix}-TC-${String(nextNumber).padStart(3, '0')}`;

      console.log(`Storage: Generated test case ID ${testCaseId} for project ${insertTestCase.projectId}, module ${insertTestCase.moduleId} (${module.name}). Project prefix: ${projectPrefix}, Module prefix: ${modulePrefix}, existing numbers: [${existingTestCases.join(', ')}], next: ${nextNumber}`);
    }

    const testCase: TestCase = {
      ...insertTestCase,
      id,
      testCaseId,
      createdAt: now,
      updatedAt: now
    };

    this.testCases.push(testCase);
    this.recordActivity('test_case', 'created', testCase.id, insertTestCase.createdById);
    return testCase;
  }

  async updateTestCase(id: number, data: Partial<TestCase>): Promise<TestCase | null> {
    const index = this.testCases.findIndex(testCase => testCase.id === id);
    if (index === -1) return null;

    const updatedTestCase = {
      ...this.testCases[index],
      ...data,
      updatedAt: new Date()
    };

    // Force immediate persistence
    this.testCases[index] = updatedTestCase;

    // Log activity for status changes specifically
    if (data.status && data.status !== this.testCases[index].status) {
      this.recordActivity('test_case', `status_changed_to_${data.status}`, id, data.assignedTo || this.testCases[index].assignedTo || 1);
    } else {
      this.recordActivity('test_case', 'updated', id, data.assignedTo || this.testCases[index].assignedTo || 1);
    }

    return updatedTestCase;
  }

  async deleteTestCase(id: number, userId: number, hardDelete: boolean = false): Promise<boolean> {
    const index = this.testCases.findIndex(testCase => testCase.id === id);
    if (index === -1) return false;

    if (hardDelete) {
      console.log(`Storage: Permanently deleting test case ID ${id} (${this.testCases[index].testCaseId})`);
      this.testCases.splice(index, 1); // Remove from array
      this.recordActivity('test_case', 'permanently_deleted', id, userId);
      console.log(`Storage: Test case permanently deleted. Total test cases: ${this.testCases.length}`);
      return true;
    } else {
      console.log(`Storage: Soft deleting test case ID ${id} (${this.testCases[index].testCaseId}) by user ${userId}`);
      const deletedTestCase: TestCase = {
        ...this.testCases[index],
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: userId,
        updatedAt: new Date()
      };
      this.testCases[index] = deletedTestCase;
      this.recordActivity('test_case', 'deleted', id, userId);
      console.log(`Storage: Test case soft deleted. ID: ${this.testCases[index].testCaseId}`);
      return true;
    }
  }

  // Deleted test case operations
  async getDeletedTestCases(projectId?: number): Promise<TestCase[]> {
    let results = this.testCases.filter(tc => tc.isDeleted === true);

    if (projectId) {
      results = results.filter(tc => tc.projectId === projectId);
    }

    console.log(`Storage: getDeletedTestCases(${projectId}) returning ${results.length} deleted test cases`);
    return results;
  }

  async getDeletedTestCasesByProject(projectId: number): Promise<TestCase[]> {
    const results = this.testCases.filter(tc => tc.projectId === projectId && tc.isDeleted === true);

    console.log(`Storage: getDeletedTestCasesByProject(${projectId}) returning ${results.length} deleted test cases`);
    return results;
  }

  async restoreTestCase(id: number): Promise<TestCase | undefined> {
    const index = this.testCases.findIndex(testCase => testCase.id === id);
    if (index === -1 || !this.testCases[index].isDeleted) return undefined;

    console.log(`Storage: Restoring test case ID ${id} (${this.testCases[index].testCaseId})`);

    const restoredTestCase: TestCase = {
      ...this.testCases[index],
      isDeleted: false,
      deletedAt: null,
      deletedById: null,
      updatedAt: new Date()
    };

    this.testCases[index] = restoredTestCase;
    this.recordActivity('test_case', 'restored', id, this.testCases[index].assignedTo || 1);

    console.log(`Storage: Test case restored. ID: ${this.testCases[index].testCaseId}`);
    return restoredTestCase;
  }

  async permanentlyDeleteTestCase(id: number): Promise<boolean> {
    const initialLength = this.testCases.length;
    const testCase = this.testCases.find(tc => tc.id === id);
    if (!testCase) return false;

    console.log(`Storage: Permanently deleting test case ID ${id} (${testCase.testCaseId})`);

    this.testCases = this.testCases.filter(tc => tc.id !== id);
    this.recordActivity('test_case', 'permanently_deleted', id, testCase.assignedTo || 1);

    console.log(`Storage: Test case permanently deleted. Total test cases: ${this.testCases.length}`);
    return this.testCases.length < initialLength;
  }

  // Bug operations
  async createBug(insertBug: InsertBug): Promise<Bug> {
    const id = this.getNextId();
    const now = new Date();

    // Auto-generate bug ID if not provided
    let bugId = insertBug.bugId;
    if (!bugId || bugId.trim() === '') {
      // Find the highest existing bug number
      const existingBugs = this.bugs
        .map(bug => bug.bugId)
        .filter(id => id && id.match(/^BUG-(\d+)$/))
        .map(id => parseInt(id.replace('BUG-', ''), 10))
        .filter(num => !isNaN(num));

      const nextNumber = existingBugs.length > 0 ? Math.max(...existingBugs) + 1 : 1;
      bugId = `BUG-${String(nextNumber).padStart(3, '0')}`;
    }

    const bug: Bug = {
      ...insertBug,
      id,
      bugId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.bugs.push(bug);
    this.recordActivity('bug', 'created', bug.id, insertBug.reportedById);
    return bug;
  }

  async getBugs(projectId?: number, moduleId?: number): Promise<Bug[]> {
    let results = [...this.bugs];

    console.log(`Storage: Total bugs in storage: ${this.bugs.length}`);

    if (projectId) {
      results = results.filter(bug => bug.projectId === projectId);
      console.log(`Storage: After filtering by projectId ${projectId}: ${results.length} bugs`);
    }

    if (moduleId) {
      results = results.filter(bug => bug.moduleId === moduleId);
      console.log(`Storage: After filtering by moduleId ${moduleId}: ${results.length} bugs`);
    }

    console.log(`Storage: getBugs(${projectId}, ${moduleId}) returning ${results.length} bugs:`,
      results.map(bug => ({ id: bug.id, bugId: bug.bugId, title: bug.title, projectId: bug.projectId, moduleId: bug.moduleId })));
    return results;
  }

  async getBugsByProject(projectId: number): Promise<Bug[]> {
    console.log(`Storage: getBugsByProject called for projectId: ${projectId}`);
    const results = this.bugs.filter(bug => {
      console.log(`Storage: Checking bug ${bug.id} (${bug.bugId}) - projectId: ${bug.projectId} vs requested: ${projectId}`);
      return bug.projectId === projectId;
    });
    console.log(`Storage: getBugsByProject(${projectId}) returning ${results.length} bugs:`,
      results.map(bug => ({ id: bug.id, bugId: bug.bugId, title: bug.title, projectId: bug.projectId })));
    return results;
  }

  async getBug(id: number): Promise<Bug | undefined> {
    return this.bugs.find(bug => bug.id === id);
  }

  async getBugsWithFilters(filters?: { projectId?: number; status?: string; severity?: string }): Promise<Bug[]> {
    let bugs = [...this.bugs];

    if (filters?.projectId) {
      bugs = bugs.filter(bug => bug.projectId === filters.projectId);
    }
    if (filters?.status) {
      bugs = bugs.filter(bug => bug.status === filters.status);
    }
    if (filters?.severity) {
      bugs = bugs.filter(bug => bug.severity === filters.severity);
    }

    return bugs;
  }

  async getBugById(id: number): Promise<Bug | null> {
    return this.bugs.find(bug => bug.id === id) || null;
  }

  async updateBug(id: number, data: Partial<Bug>): Promise<Bug | null> {
    const index = this.bugs.findIndex(bug => bug.id === id);
    if (index === -1) return null;

    const updatedBug = {
      ...this.bugs[index],
      ...data,
      updatedAt: new Date()
    };

    // Force immediate persistence
    this.bugs[index] = updatedBug;

    // Log activity for status and severity changes specifically
    if (data.status && data.status !== this.bugs[index].status) {
      this.recordActivity('bug', `status_changed_to_${data.status}`, id, data.assignedTo || this.bugs[index].assignedTo);
    } else if (data.severity && data.severity !== this.bugs[index].severity) {
      this.recordActivity('bug', `severity_changed_to_${data.severity}`, id, data.assignedTo || this.bugs[index].assignedTo);
    } else {
      this.recordActivity('bug', 'updated', id, data.assignedTo || this.bugs[index].assignedTo);
    }

    return updatedBug;
  }

  async deleteBug(id: number): Promise<boolean> {
    const initialLength = this.bugs.length;
    const bug = this.bugs.find(b => b.id === id);
    if (!bug) return false;

    this.bugs = this.bugs.filter(bug => bug.id !== id);
    this.recordActivity('bug', 'deleted', id, bug.assignedTo);
    return this.bugs.length < initialLength;
  }

  // Document operations
  async createDocument(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    const id = this.getNextId();
    const now = new Date();

    const document: Document = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.documents.push(document);
    this.recordActivity('document', 'created', document.id, data.uploadedBy);
    return document;
  }

  async getDocuments(projectId: number, folderId?: number): Promise<Document[]> {
    let results = this.documents.filter(doc => doc.projectId === projectId);
    if (folderId !== undefined) {
      results = results.filter(doc => doc.folderId === folderId);
    }
    return results;
  }

  async getDocumentById(id: number): Promise<Document | null> {
    return this.documents.find(doc => doc.id === id) || null;
  }

  async updateDocument(id: number, data: Partial<Document>): Promise<Document | null> {
    const index = this.documents.findIndex(document => document.id === id);
    if (index === -1) return null;

    const updatedDocument = { ...this.documents[index], ...data, updatedAt: new Date() };
    this.documents[index] = updatedDocument;
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(document => document.id !== id);
    const doc = this.documents.find(d => d.id === id); // Need to capture the deleted doc for activity logging if it existed
    if (doc) {
      this.recordActivity('document', 'deleted', id, doc.uploadedBy);
    }
    return this.documents.length < initialLength;
  }

  // Document folder operations
  async createDocumentFolder(data: Omit<DocumentFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentFolder> {
    const id = this.getNextId();
    const now = new Date();

    const folder: DocumentFolder = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.documentFolders.push(folder);
    return folder;
  }

  async getDocumentFolders(projectId: number): Promise<DocumentFolder[]> {
    return this.documentFolders.filter(folder => folder.projectId === projectId);
  }

  async getDocumentFolderById(id: number): Promise<DocumentFolder | null> {
    return this.documentFolders.find(folder => folder.id === id) || null;
  }

  async updateDocumentFolder(id: number, data: Partial<DocumentFolder>): Promise<DocumentFolder | null> {
    const index = this.documentFolders.findIndex(folder => folder.id === id);
    if (index === -1) return null;

    const updatedFolder = { ...this.documentFolders[index], ...data, updatedAt: new Date() };
    this.documentFolders[index] = updatedFolder;
    return updatedFolder;
  }

  async deleteDocumentFolder(id: number): Promise<boolean> {
    const initialLength = this.documentFolders.length;
    // Also delete all documents in this folder
    this.documents = this.documents.filter(doc => doc.folderId !== id);

    // Delete all subfolders
    const subfolders = this.documentFolders.filter(f => f.parentId === id);
    for (const subfolder of subfolders) {
      await this.deleteDocumentFolder(subfolder.id); // Recursively delete subfolders
    }

    this.documentFolders = this.documentFolders.filter(folder => folder.id !== id);
    return this.documentFolders.length < initialLength;
  }

  // Customer operations
  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const id = this.nextCustomerId++;
    const now = new Date();

    const customer: Customer = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.customers.push(customer);
    return customer;
  }

  async getCustomers(): Promise<Customer[]>{
    return [...this.customers];
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return this.customers.find(customer => customer.id === id) || null;
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer | null> {
    const index = this.customers.findIndex(customer => customer.id === id);
    if (index === -1) return null;

    const updatedCustomer = { ...this.customers[index], ...data, updatedAt: new Date() };
    this.customers[index] = updatedCustomer;
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const initialLength = this.customers.length;
    this.customers = this.customers.filter(customer => customer.id !== id);
    return this.customers.length < initialLength;
  }

  // Tag operations
  async createTag(data: Omit<Tag, 'id'>): Promise<Tag> {
    const id = this.getNextId();

    const tag: Tag = {
      ...data,
      id
    };

    this.tags.push(tag);
    return tag;
  }

  async getTags(): Promise<Tag[]> {
    return [...this.tags];
  }

  async getTagsByProject(projectId: number): Promise<Tag[]> {
    return this.tags.filter(tag => tag.projectId === projectId);
  }

  getAllTestCaseTags(): Tag[] {
    const testCases = this.testCases;
    const tagSet = new Set<string>();

    testCases.forEach(testCase => {
      if (testCase.tags && Array.isArray(testCase.tags)) {
        testCase.tags.forEach(tag => tagSet.add(tag.name));
      }
    });

    return Array.from(tagSet).map((name, index) => ({
      id: index + 1000,
      name,
      color: this.getRandomColor(),
      projectId: 0 // Global tags
    }));
  }

  getAllBugTags(): Tag[] {
    const bugs = this.bugs;
    const tagSet = new Set<string>();

    bugs.forEach(bug => {
      if (bug.tags && Array.isArray(bug.tags)) {
        bug.tags.forEach(tag => tagSet.add(tag.name));
      }
    });

    return Array.from(tagSet).map((name, index) => ({
      id: index + 2000,
      name,
      color: this.getRandomColor(),
      projectId: 0 // Global tags
    }));
  }

  getAllTags(): Tag[] {
    const allTags = [...this.tags];
    const testCaseTags = this.getAllTestCaseTags();
    const bugTags = this.getAllBugTags();

    return [...allTags, ...testCaseTags, ...bugTags];
  }

  getRandomColor(): string {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async getTagById(id: number): Promise<Tag | null> {
    return this.tags.find(tag => tag.id === id) || null;
  }

  async updateTag(id: number, data: Partial<Tag>): Promise<Tag | null> {
    const index = this.tags.findIndex(tag => tag.id === id);
    if (index === -1) return null;

    const updatedTag = { ...this.tags[index], ...data };
    this.tags[index] = updatedTag;
    return updatedTag;
  }

  async deleteTag(id: number): Promise<boolean> {
    const initialLength = this.tags.length;
    this.tags = this.tags.filter(tag => tag.id !== id);
    return this.tags.length < initialLength;
  }

  // Kanban operations
  async createKanbanColumn(data: Omit<KanbanColumn, 'id'>): Promise<KanbanColumn> {
    const id = this.getNextId();

    const column: KanbanColumn = {
      ...data,
      id
    };

    this.kanbanColumns.push(column);
    return column;
  }

  async getKanbanColumns(projectId: number): Promise<KanbanColumn[]> {
    return this.kanbanColumns.filter(col => col.projectId === projectId)
      .sort((a, b) => a.position - b.position);
  }

  async updateKanbanColumn(id: number, data: Partial<KanbanColumn>): Promise<KanbanColumn | null> {
    const index = this.kanbanColumns.findIndex(column => column.id === id);
    if (index === -1) return null;

    const updatedColumn = { ...this.kanbanColumns[index], ...data };
    this.kanbanColumns[index] = updatedColumn;
    return updatedColumn;
  }

  async deleteKanbanColumn(id: number): Promise<boolean> {
    const initialLength = this.kanbanColumns.length;
    // Also delete all cards in this column
    this.kanbanCards = this.kanbanCards.filter(card => card.columnId !== id);

    this.kanbanColumns = this.kanbanColumns.filter(column => column.id !== id);
    return this.kanbanColumns.length < initialLength;
  }

  async createKanbanCard(data: Omit<KanbanCard, 'id'>): Promise<KanbanCard> {
    const id = this.getNextId();

    const card: KanbanCard = {
      ...data,
      id
    };

    this.kanbanCards.push(card);
    return card;
  }

  async getKanbanCards(columnId: number): Promise<KanbanCard[]> {
    return this.kanbanCards.filter(card => card.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  }

  async updateKanbanCard(id: number, cardData: any): Promise<any> {
    const index = this.kanbanCards.findIndex(card => card.id === id);
    if (index === -1) return null;

    const updatedCard = { ...this.kanbanCards[index], ...cardData };
    this.kanbanCards[index] = updatedCard;
    return updatedCard;
  }

  async deleteKanbanCard(id: number): Promise<boolean> {
    const initialLength = this.kanbanCards.length;
    // Also delete all cards in this column
    this.kanbanCards = this.kanbanCards.filter(card => card.columnId !== id);

    return this.kanbanCards.length < initialLength;
  }

  // Custom marker operations
  async createCustomMarker(data: any): Promise<CustomMarker> {
    const id = this.getNextId();

    const marker: CustomMarker = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.customMarkers.push(marker);
    console.log(`Storage: Created custom marker with ID ${id}:`, marker);
    return marker;
  }

  async getCustomMarkers(): Promise<CustomMarker[]> {
    return [...this.customMarkers];
  }

  async getCustomMarkersByProject(projectId: number): Promise<CustomMarker[]> {
    const markers = this.customMarkers.filter(marker => marker.projectId === projectId);
    console.log(`Storage: Found ${markers.length} markers for project ${projectId}:`, markers);
    return markers;
  }

  async getCustomMarker(id: number): Promise<CustomMarker | undefined> {
    return this.customMarkers.find(marker => marker.id === id);
  }

  async updateCustomMarker(id: number, data: Partial<CustomMarker>): Promise<CustomMarker | null> {
    const index = this.customMarkers.findIndex(marker => marker.id === id);
    if (index === -1) return null;

    const updatedMarker = {
      ...this.customMarkers[index],
      ...data,
      updatedAt: new Date()
    };
    this.customMarkers[index] = updatedMarker;
    return updatedMarker;
  }

  async deleteCustomMarker(id: number): Promise<boolean> {
    const initialLength = this.customMarkers.length;
    this.customMarkers = this.customMarkers.filter(marker => marker.id !== id);
    return this.customMarkers.length < initialLength;
  }

  // Traceability marker operations (separate from custom markers)
  async createTraceabilityMarker(data: any): Promise<any> {
    const id = this.getNextId();
    const now = new Date();

    const marker = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.traceabilityMarkers.push(marker);
    console.log(`Storage: Created traceability marker with ID ${id}:`, marker);
    return marker;
  }

  async getTraceabilityMarkers(projectId: number): Promise<any[]> {
    const markers = this.traceabilityMarkers.filter(marker => marker.projectId === projectId);
    console.log(`Storage: Found ${markers.length} traceability markers for project ${projectId}:`, markers);
    return markers;
  }

  async getTraceabilityMarker(id: number): Promise<any | undefined> {
    return this.traceabilityMarkers.find(marker => marker.id === id);
  }

  async updateTraceabilityMarker(id: number, data: any): Promise<any> {
    const index = this.traceabilityMarkers.findIndex(marker => marker.id === id);
    if (index === -1) return null;

    const updatedMarker = {
      ...this.traceabilityMarkers[index], // <-- This looks like a typo, should be this.traceabilityMarkers
      ...data,
      updatedAt: new Date()
    };
    this.traceabilityMarkers[index] = updatedMarker;
    console.log(`Storage: Updated traceability marker with ID ${id}:`, updatedMarker);
    return updatedMarker;
  }

  async deleteTraceabilityMarker(id: number): Promise<boolean> {
    const initialLength = this.traceabilityMarkers.length;
    this.traceabilityMarkers = this.traceabilityMarkers.filter(marker => marker.id !== id);
    return this.traceabilityMarkers.length < initialLength;
  }

  // Matrix operations
  async createMatrixCell(data: Omit<MatrixCell, 'id'>): Promise<MatrixCell> {
    const id = this.getNextId();
    const now = new Date();

    const cell: MatrixCell = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.matrixCells.push(cell);
    console.log(`Storage: Created matrix cell with ID ${id}:`, cell);
    return cell;
  }

  async getMatrixCells(): Promise<MatrixCell[]> {
    return [...this.matrixCells];
  }

  async getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]> {
    const cells = this.matrixCells.filter(cell => cell.projectId === projectId);
    console.log(`Storage: Found ${cells.length} matrix cells for project ${projectId}:`, cells);
    return cells;
  }

  async getMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<MatrixCell | undefined> {
    return this.matrixCells.find(cell =>
      cell.rowModuleId === rowModuleId &&
      cell.colModuleId === colModuleId &&
      cell.projectId === projectId
    );
  }

  async upsertMatrixCell(cellData: any): Promise<any> {
    const existingCell = await this.getMatrixCell(
      cellData.rowModuleId,
      cellData.colModuleId,
      cellData.projectId
    );

    if (existingCell) {
      const updatedData = {
        value: cellData.value,
        updatedAt: new Date()
      };
      return await this.updateMatrixCell(existingCell.id, updatedData);
    } else {
      // Create new matrix cell with proper ID structure
      const id = this.getNextId();
      const now = new Date();

      const cell: MatrixCell = {
        id,
        rowModuleId: cellData.rowModuleId,
        colModuleId: cellData.colModuleId,
        projectId: cellData.projectId,
        value: cellData.value || '',
        createdById: cellData.createdById,
        createdAt: now,
        updatedAt: now
      };

      this.matrixCells.push(cell);
      console.log(`Storage: Created matrix cell with ID ${id}:`, cell);
      console.log(`Storage: Total matrix cells now: ${this.matrixCells.length}`);
      return cell;
    }
  }

  async updateMatrixCell(id: number, data: Partial<MatrixCell>): Promise<MatrixCell | null> {
    const index = this.matrixCells.findIndex(cell => cell.id === id);
    if (index === -1) return null;

    const updatedCell = {
      ...this.matrixCells[index],
      ...data,
      updatedAt: new Date()
    };
    this.matrixCells[index] = updatedCell;
    return updatedCell;
  }

  async deleteMatrixCell(id: number): Promise<boolean>;
  async deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<boolean>;
  async deleteMatrixCell(idOrRowModuleId: number, colModuleId?: number, projectId?: number): Promise<boolean> {
    if (colModuleId !== undefined && projectId !== undefined) {
      // Delete by row/col/project combination
      const initialLength = this.matrixCells.length;
      this.matrixCells = this.matrixCells.filter(cell =>
        !(cell.rowModuleId === idOrRowModuleId &&
          cell.colModuleId === colModuleId &&
          cell.projectId === projectId)
      );
      return this.matrixCells.length < initialLength;
    } else {
      // Delete by ID
      const initialLength = this.matrixCells.length;
      this.matrixCells = this.matrixCells.filter(cell => cell.id !== idOrRowModuleId);
      return this.matrixCells.length < initialLength;
    }
  }

  // Project member operations
  async addProjectMember(data: Omit<ProjectMember, 'id'>): Promise<ProjectMember> {
    const id = this.getNextId();

    const member: ProjectMember = {
      ...data,
      id
    };

    this.projectMembers.push(member);
    return member;
  }

  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return this.projectMembers.filter(member => member.projectId === projectId);
  }

  // Get project memberships for a specific user
  async getUserProjectMemberships(userId: number): Promise<ProjectMember[]> {
    return this.projectMembers.filter(member => member.userId === userId);
  }

  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const initialLength = this.projectMembers.length;
    this.projectMembers = this.projectMembers.filter(m => !(m.projectId === projectId && m.userId === userId));
    return this.projectMembers.length < initialLength;
  }

  // Activity operations
  async getActivities(limit = 10): Promise<any[]> {
    return this.activities
      .sort((a, b) => (b.timestamp || b.createdAt).getTime() - (a.timestamp || a.createdAt).getTime())
      .slice(0, limit);
  }

  async getProjectActivities(projectId: number, limit: number = 10): Promise<any[]> {
    return this.activities
      .filter(activity => activity.details?.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      id: this.nextActivityId++,
      userId: activity.userId,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      details: activity.details || null,
      createdAt: new Date(),
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  // CSV Export for Projects
  async exportProjectsCSV(): Promise<any[]> {
    const projects = await this.getProjects();
    const exportData = [];

    for (const project of projects) {
      const modules = await this.getModulesByProject(project.id);
      const testCases = await this.getTestCasesByProject(project.id);
      const bugs = await this.getBugsByProject(project.id);

      exportData.push({
        projectId: project.id,
        projectName: project.name,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        totalModules: modules.length,
        totalTestCases: testCases.length,
        totalBugs: bugs.length,
        modules: modules.map(m => m.name).join(';'),
        testCases: testCases.map(tc => `${tc.testCaseId}:${tc.title}`).join(';'),
        bugs: bugs.map(b => `${b.bugId}:${b.title}`).join(';')
      });
    }

    return exportData;
  }

  // Test Sheets methods
  async getTestSheets(projectId?: number): Promise<any[]> {
    let results = [...this.testSheets];

    if (projectId) {
      results = results.filter(sheet => sheet.projectId === projectId);
    }

    console.log(`Storage: getTestSheets(${projectId}) returning ${results.length} sheets`);
    return results;
  }

  async getTestSheet(id: number): Promise<any | null> {
    return this.testSheets.find(sheet => sheet.id === id) || null;
  }

  async createTestSheet(data: any): Promise<any> {
    const id = this.getNextId();
    const now = new Date().toISOString();

    const newSheet = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.testSheets.push(newSheet);
    console.log('Created test sheet:', newSheet);
    return newSheet;
  }

  async updateTestSheet(id: number, data: any): Promise<any> {
    const index = this.testSheets.findIndex(sheet => sheet.id === id);
    if (index === -1) return null;

    const updatedSheet = {
      ...this.testSheets[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.testSheets[index] = updatedSheet;
    return updatedSheet;
  }

  async deleteTestSheet(id: number): Promise<boolean> {
    const initialLength = this.testSheets.length;
    this.testSheets = this.testSheets.filter(sheet => sheet.id !== id);
    return this.testSheets.length < initialLength;
  }

  async duplicateTestSheet(id: number, name: string, userId: number): Promise<any> {
    const originalSheet = this.testSheets.find(sheet => sheet.id === id);
    if (!originalSheet) {
      throw new Error('Original sheet not found');
    }

    const newId = this.getNextId();
    const now = new Date().toISOString();

    const duplicatedSheet = {
      id: newId,
      name,
      projectId: originalSheet.projectId,
      data: { ...originalSheet.data },
      metadata: {
        ...originalSheet.metadata,
        version: 1,
        lastModifiedBy: userId,
      },
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    };

    this.testSheets.push(duplicatedSheet);
    return duplicatedSheet;
  }

  // Flow diagram storage
  // private flowDiagrams = new Map<string, any>();
  // private nextFlowDiagramId = 1;

  // Flow Diagrams methods
  async getFlowDiagramsByProject(projectId: string): Promise<any[]> {
    const results = [];
    for (const diagram of this.flowDiagrams.values()) {
      if (diagram.projectId === parseInt(projectId)) {
        results.push(diagram);
      }
    }
    console.log(`Storage: Found ${results.length} flow diagrams for project ${projectId}`);
    return results;
  }

  async getFlowDiagram(id: string): Promise<any | null> {
    const diagram = this.flowDiagrams.get(id) || null;
    console.log(`Storage: Getting flow diagram ${id}:`, diagram ? 'found' : 'not found');
    return diagram;
  }

  async createFlowDiagram(diagramData: any): Promise<any> {
    const id = this.nextFlowDiagramId++;
    const now = new Date().toISOString();

    const diagram = {
      id: id,
      ...diagramData,
      createdAt: now,
      updatedAt: now,
    };

    this.flowDiagrams.set(id.toString(), diagram);
    console.log(`Storage: Created flow diagram with ID ${id}:`, diagram);
    return diagram;
  }

  async updateFlowDiagram(id: string, updates: any): Promise<any> {
    const existingDiagram = this.flowDiagrams.get(id);
    if (!existingDiagram) {
      console.log(`Storage: Flow diagram ${id} not found for update`);
      return null;
    }

    const updatedDiagram = {
      ...existingDiagram,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.flowDiagrams.set(id, updatedDiagram);
    console.log(`Storage: Updated flow diagram ${id}`);
    return updatedDiagram;
  }

  async deleteFlowDiagram(id: string): Promise<boolean> {
    const deleted = this.flowDiagrams.delete(id);
    console.log(`Storage: Flow diagram ${id} ${deleted ? 'deleted' : 'not found'}`);
    return deleted;
  }

  // Method to get test cases by module ID
  async getTestCasesByModule(moduleId: string): Promise<TestCase[]> {
    return this.testCases.filter(tc => tc.moduleId === parseInt(moduleId));
  }

  // Dashboard Stats
  async getDashboardStats(userId?: number): Promise<{
    totalProjects: number;
    totalTestCases: number;
    openBugs: number;
    passRate: number;
    testCaseStatusCounts?: TestCaseStatusCounts;
    bugStatusCounts?: BugStatusCounts;
    totalUsers?: number;
  }> {
    let projects, testCases, bugs;
    const users = this.data.users || [];

    if (userId) {
      // Get user's accessible projects with proper security verification
      const userProjects = await this.getProjectsByUserId(userId);
      const accessibleProjects = [];

      for (const project of userProjects) {
        const members = await this.getProjectMembers(project.id);
        const isMember = members.some(member => member.userId === userId);

        if (project.createdById === userId || isMember) {
          accessibleProjects.push(project);
        }
      }

      projects = accessibleProjects;

      // Filter test cases and bugs to only accessible projects
      const accessibleProjectIds = projects.map(p => p.id);
      testCases = (this.data.testCases || []).filter(tc =>
        accessibleProjectIds.includes(tc.projectId) && !tc.isDeleted
      );
      bugs = (this.data.bugs || []).filter(bug =>
        accessibleProjectIds.includes(bug.projectId)
      );
    } else {
      // Admin user - can see all data
      projects = this.data.projects || [];
      testCases = (this.data.testCases || []).filter(tc => !tc.isDeleted);
      bugs = this.data.bugs || [];
    }

    return {
      totalProjects: projects.length,
      totalTestCases: testCases.length,
      totalBugs: bugs.length,
      totalUsers: users.length,
      testCaseStatusCounts: {
        passed: testCases.filter(tc => tc.status === 'Passed').length,
        failed: testCases.filter(tc => tc.status === 'Failed').length,
        blocked: testCases.filter(tc => tc.status === 'Blocked').length,
        notExecuted: testCases.filter(tc => tc.status === 'Not Executed').length,
      },
      bugStatusCounts: {
        critical: bugs.filter(bug => bug.severity === 'Critical').length,
        major: bugs.filter(bug => bug.severity === 'Major').length,
        minor: bugs.filter(bug => bug.severity === 'Minor').length,
        trivial: bugs.filter(bug => bug.severity === 'Trivial').length,
      }
    };
  }

  // Document operations (re-declared, ensure consistency)
  async getDocuments(): Promise<Document[]> {
    return [...this.documents];
  }

  async getDocumentFolders(projectId: number): Promise<DocumentFolder[]> {
    return this.documentFolders.filter(folder => folder.projectId === projectId);
  }

  async getDocumentFolder(id: number): Promise<DocumentFolder | undefined> {
    return this.documentFolders.find(folder => folder.id === id);
  }

  async createDocumentFolder(folder: InsertDocumentFolder): Promise<DocumentFolder> {
    const newFolder: DocumentFolder = {
      id: this.getNextId(),
      ...folder,
      createdAt: new Date(),
    };
    this.documentFolders.push(newFolder);
    return newFolder;
  }

  async updateDocumentFolder(id: number, folderData: Partial<DocumentFolder>): Promise<DocumentFolder | undefined> {
    const index = this.documentFolders.findIndex(folder => folder.id === id);
    if (index === -1) return undefined;

    const updatedFolder = { ...this.documentFolders[index], ...folderData };
    this.documentFolders[index] = updatedFolder;
    return updatedFolder;
  }

  async deleteDocumentFolder(id: number): Promise<boolean> {
    const initialLength = this.documentFolders.length;
    this.documentFolders = this.documentFolders.filter(folder => folder.id !== id);
    return this.documentFolders.length < initialLength;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.find(document => document.id === id);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const newDocument: Document = {
      id: this.getNextId(),
      ...document,
      uploadedAt: new Date(),
    };
    this.documents.push(newDocument);
    return newDocument;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const index = this.documents.findIndex(document => document.id === id);
    if (index === -1) return undefined;

    const updatedDocument = { ...this.documents[index], ...documentData };
    this.documents[index] = updatedDocument;
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(document => document.id !== id);
    return this.documents.length < initialLength;
  }

  // Customer operations (re-declared, ensure consistency)
  async getCustomers(): Promise<Customer[]>{
    return [...this.customers];
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.find(customer => customer.id === id);
  }

  async getCustomersByStatus(status: string): Promise<Customer[]> {
    return this.customers.filter(customer => customer.status === status);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const newCustomer: Customer = {
      id: this.nextCustomerId++,
      ...customer,
      createdAt: new Date(),
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const index = this.customers.findIndex(customer => customer.id === id);
    if (index === -1) return undefined;

    const updatedCustomer = { ...this.customers[index], ...customerData };
    this.customers[index] = updatedCustomer;
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const initialLength = this.customers.length;
    this.customers = this.customers.filter(customer => customer.id !== id);
    return this.customers.length < initialLength;
  }

  // Customer Projects operations
  async getCustomerProjects(): Promise<CustomerProject[]> {
    return [...this.customerProjects];
  }

  async getProjectsByCustomerId(customerId: number): Promise<Project[]> {
    const customerProjectIds = this.customerProjects
      .filter(cp => cp.customerId === customerId)
      .map(cp => cp.projectId);

    return this.projects
      .filter(project => customerProjectIds.includes(project.id));
  }

  async getCustomersByProjectId(projectId: number): Promise<Customer[]> {
    const customerIds = this.customerProjects
      .filter(cp => cp.projectId === projectId)
      .map(cp => cp.customerId);

    return this.customers
      .filter(customer => customerIds.includes(customer.id));
  }

  async createCustomerProject(customerProject: InsertCustomerProject): Promise<CustomerProject> {
    const id = this.getNextId();
    const newCustomerProject: CustomerProject = {
      ...customerProject,
      id,
      createdAt: new Date(),
    };
    this.customerProjects.push(newCustomerProject);
    return newCustomerProject;
  }

  async deleteCustomerProject(id: number): Promise<boolean> {
    const initialLength = this.customerProjects.length;
    this.customerProjects = this.customerProjects.filter(cp => cp.id !== id);
    return this.customerProjects.length < initialLength;
  }

  // TimeSheet operations
  async getTimeSheets(projectId?: number, userId?: number): Promise<TimeSheet[]> {
    let results = [...this.timeSheets];

    if (projectId && userId) {
      results = results.filter(ts => {
        const tsProjectId = typeof ts.projectId === 'string' ? parseInt(ts.projectId, 10) : ts.projectId;
        return tsProjectId === projectId && ts.userId === userId;
      });
    } else if (projectId) {
      results = results.filter(ts => {
        const tsProjectId = typeof ts.projectId === 'string' ? parseInt(ts.projectId, 10) : ts.projectId;
        return tsProjectId === projectId;
      });
    } else if (userId) {
      results = results.filter(ts => ts.userId === userId);
    }

    console.log(`Storage: getTimeSheets(${projectId}, ${userId}) returning ${results.length} timesheets:`,
      results.map(ts => ({ id: ts.id, projectId: ts.projectId, userId: ts.userId, description: ts.description })));

    return results;
  }

  async getUserTimeSheets(userId: number): Promise<TimeSheet[]> {
    const results = this.timeSheets.filter(ts => ts.userId === userId);
    console.log(`Storage: getUserTimeSheets(${userId}) returning ${results.length} timesheets:`,
      results.map(ts => ({ id: ts.id, projectId: ts.projectId, description: ts.description.substring(0, 50) })));
    return results;
  }

  async getProjectTimeSheets(projectId: number): Promise<TimeSheet[]> {
    return this.timeSheets.filter(ts => ts.projectId === projectId);
  }

  async getTimeSheet(id: number): Promise<TimeSheet | undefined> {
    return this.timeSheets.find(ts => ts.id === id);
  }

  async createTimeSheet(timeSheet: InsertTimeSheet): Promise<TimeSheet> {
    const newTimeSheet: TimeSheet = {
      id: this.nextTimeSheetId++,
      userId: timeSheet.userId,
      projectId: timeSheet.projectId, // Keep as string to match schema
      customerId: timeSheet.customerId || null,
      moduleId: timeSheet.moduleId || null,
      testCaseId: timeSheet.testCaseId || null,
      bugId: timeSheet.bugId || null,
      folderId: timeSheet.folderId || null,
      description: timeSheet.description,
      workDate: new Date(timeSheet.workDate),
      startTime: timeSheet.startTime,
      endTime: timeSheet.endTime,
      hours: timeSheet.hours,
      status: timeSheet.status || "Pending",
      tags: timeSheet.tags || [],
      comments: timeSheet.comments || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.timeSheets.push(newTimeSheet);

    console.log(`Storage: Created timesheet ID ${newTimeSheet.id} for user ${newTimeSheet.userId}, project ${newTimeSheet.projectId}. Total timesheets: ${this.timeSheets.length}`);

    return newTimeSheet;
  }

  async updateTimeSheet(id: number, timeSheetData: Partial<TimeSheet>): Promise<TimeSheet | undefined> {
    const index = this.timeSheets.findIndex(ts => ts.id === id);
    if (index === -1) return undefined;

    const updatedTimeSheet: TimeSheet = { ...this.timeSheets[index], ...timeSheetData, updatedAt: new Date() };
    this.timeSheets[index] = updatedTimeSheet;

    console.log(`Storage: Updated timesheet ${id} with status: ${timeSheetData.status}`, updatedTimeSheet);
    return updatedTimeSheet;
  }

  async deleteTimeSheet(id: number): Promise<boolean> {
    const initialLength = this.timeSheets.length;
    this.timeSheets = this.timeSheets.filter(ts => ts.id !== id);
    return this.timeSheets.length < initialLength;
  }

  // TimeSheet Folder operations
  async getTimeSheetFolders(userId: number): Promise<TimeSheetFolder[]> {
    return this.timeSheetFolders.filter(folder => folder.userId === userId);
  }

  async getTimeSheetFolder(id: number): Promise<TimeSheetFolder | undefined> {
    return this.timeSheetFolders.find(folder => folder.id === id);
  }

  async createTimeSheetFolder(timeSheetFolder: InsertTimeSheetFolder): Promise<TimeSheetFolder> {
    const newFolder: TimeSheetFolder = {
      id: this.nextTimeSheetFolderId++,
      ...timeSheetFolder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.timeSheetFolders.push(newFolder);

    console.log(`Storage: Created timesheet folder ID ${newFolder.id} for user ${newFolder.userId}. Total folders: ${this.timeSheetFolders.length}`);

    return newFolder;
  }

  async updateTimeSheetFolder(id: number, timeSheetFolderData: Partial<TimeSheetFolder>): Promise<TimeSheetFolder | undefined> {
    const index = this.timeSheetFolders.findIndex(folder => folder.id === id);
    if (index === -1) return undefined;

    const updatedFolder = { ...this.timeSheetFolders[index], ...timeSheetFolderData, updatedAt: new Date() };
    this.timeSheetFolders[index] = updatedFolder;

    console.log(`Storage: Updated timesheet folder ${id}`);
    return updatedFolder;
  }

  async deleteTimeSheetFolder(id: number): Promise<boolean> {
    const initialLength = this.timeSheetFolders.length;
    this.timeSheetFolders = this.timeSheetFolders.filter(folder => folder.id !== id);
    return this.initialLength < initialLength;
  }

  async getTimesheetsByFolder(folderId: number): Promise<TimeSheet[]> {
    return this.timeSheets.filter(ts => ts.folderId === folderId);
  }

  // Sprint operations
  async getSprints(projectId?: number): Promise<Sprint[]> {
    let results = [...this.sprints];
    if (projectId) {
      results = results.filter(sprint => sprint.projectId === projectId);
    }
    return results;
  }

  async getSprint(id: number): Promise<Sprint | undefined> {
    return this.sprints.find(sprint => sprint.id === id);
  }

  async createSprint(sprint: InsertSprint): Promise<Sprint> {
    const newSprint: Sprint = {
      id: this.getNextId(),
      ...sprint,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sprints.push(newSprint);
    return newSprint;
  }

  async updateSprint(id: number, sprintData: Partial<Sprint>): Promise<Sprint | undefined> {
    const index = this.sprints.findIndex(sprint => sprint.id === id);
    if (index === -1) throw new Error("Sprint not found");

    const updatedSprint = { ...this.sprints[index], ...sprintData, updatedAt: new Date() };
    this.sprints[index] = updatedSprint;
    return updatedSprint;
  }

  async deleteSprint(id: number): Promise<boolean> {
    const initialLength = this.sprints.length;
    this.sprints = this.sprints.filter(sprint => sprint.id !== id);
    return this.sprints.length < initialLength;
  }

  // Kanban operations (re-declared, ensure consistency)
  async getKanbanColumns(projectId?: number, sprintId?: number): Promise<KanbanColumn[]> {
    let results = [...this.kanbanColumns];

    if (projectId && sprintId) {
      results = results.filter(col => col.projectId === projectId && col.sprintId === sprintId);
    } else if (projectId) {
      results = results.filter(col => col.projectId === projectId);
    } else if (sprintId) {
      results = results.filter(col => col.sprintId === sprintId);
    }

    return results.sort((a, b) => a.order - b.order);
  }

  async getKanbanColumn(id: number): Promise<KanbanColumn | undefined> {
    return this.kanbanColumns.find(column => column.id === id);
  }

  async createKanbanColumn(column: InsertKanbanColumn): Promise<KanbanColumn> {
    const newColumn: KanbanColumn = {
      id: this.getNextId(),
      ...column,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.kanbanColumns.push(newColumn);
    return newColumn;
  }

  async updateKanbanColumn(id: number, columnData: Partial<KanbanColumn>): Promise<KanbanColumn | undefined> {
    const index = this.kanbanColumns.findIndex(column => column.id === id);
    if (index === -1) throw new Error("Column not found");

    const updatedColumn = { ...this.kanbanColumns[index], ...columnData, updatedAt: new Date() };
    this.kanbanColumns[index] = updatedColumn;
    return updatedColumn;
  }

  async deleteKanbanColumn(id: number): Promise<boolean> {
    const initialLength = this.kanbanColumns.length;
    this.kanbanColumns = this.kanbanColumns.filter(column => column.id !== id);
    return this.kanbanColumns.length < initialLength;
  }

  async getKanbanCards(columnId?: number, sprintId?: number, projectId?: number): Promise<KanbanCard[]> {
    let results = [...this.kanbanCards];

    if (columnId !== undefined) {
      results = results.filter(card => card.columnId === columnId);
    }
    if (sprintId !== undefined) {
      results = results.filter(card => card.sprintId === sprintId);
    }
    if (projectId !== undefined) {
      results = results.filter(card => card.projectId === projectId);
    }

    return results.sort((a, b) => a.order - b.order);
  }

  async getKanbanSubCards(parentId: number): Promise<KanbanCard[]> {
    return this.kanbanCards
      .filter(card => card.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  async getKanbanCard(id: number): Promise<KanbanCard | undefined> {
    return this.kanbanCards.find(card => card.id === id);
  }

  async createKanbanCard(card: InsertKanbanCard): Promise<KanbanCard> {
    const newCard: KanbanCard = {
      id: this.getNextId(),
      ...card,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.kanbanCards.push(newCard);
    return newCard;
  }

  async updateKanbanCard(id: number, cardData: Partial<KanbanCard>): Promise<KanbanCard | undefined> {
    const index = this.kanbanCards.findIndex(card => card.id === id);
    if (index === -1) throw new Error("Card not found");

    const updatedCard = { ...this.kanbanCards[index], ...cardData, updatedAt: new Date() };
    this.kanbanCards[index] = updatedCard;
    return updatedCard;
  }

  async deleteKanbanCard(id: number): Promise<boolean> {
    const initialLength = this.kanbanCards.length;
    this.kanbanCards = this.kanbanCards.filter(card => card.id !== id);
    return this.kanbanCards.length < initialLength;
  }

  // Matrix operations
  async upsertMatrixCell(cell: any): Promise<any> {
    const key = `${cell.rowModuleId}-${cell.colModuleId}-${cell.projectId}`;
    const existingCellIndex = this.matrixCells.findIndex(c => c.rowModuleId === cell.rowModuleId && c.colModuleId === cell.colModuleId && c.projectId === cell.projectId);

    if (existingCellIndex !== -1) {
      const updatedCell: MatrixCell = {
        ...this.matrixCells[existingCellIndex],
        ...cell,
        updatedAt: new Date().toISOString()
      };
      this.matrixCells[existingCellIndex] = updatedCell;
      return updatedCell;
    } else {
      const id = this.getNextId().toString();
      const newCell: MatrixCell = {
        id,
        ...cell,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.matrixCells.push(newCell);
      return newCell;
    }
  }

  async getMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<MatrixCell | undefined> {
    return this.matrixCells.find(cell =>
      cell.rowModuleId === rowModuleId &&
      cell.colModuleId === colModuleId &&
      cell.projectId === projectId
    );
  }

  async deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<boolean> {
    const initialLength = this.matrixCells.length;
    this.matrixCells = this.matrixCells.filter(cell =>
      !(cell.rowModuleId === rowModuleId &&
        cell.colModuleId === colModuleId &&
        cell.projectId === projectId)
    );
    return this.matrixCells.length < initialLength;
  }

  // Custom marker operations with proper ID handling
  async createCustomMarker(data: InsertCustomMarker): Promise<CustomMarker> {
    const id = this.getNextId();

    const marker: CustomMarker = {
      ...data,
      id
    };

    this.customMarkers.push(marker);
    return marker;
  }

  async getCustomMarkers(): Promise<CustomMarker[]> {
    return [...this.customMarkers];
  }

  async getCustomMarkersByProject(projectId: number): Promise<CustomMarker[]> {
    return this.customMarkers.filter(marker => marker.projectId === projectId);
  }

  async updateCustomMarker(id: number, data: Partial<CustomMarker>): Promise<CustomMarker | null> {
    const index = this.customMarkers.findIndex(marker => marker.id === id);
    if (index === -1) return null;

    const updatedMarker = {
      ...this.customMarkers[index],
      ...data
    };
    this.customMarkers[index] = updatedMarker;
    return updatedMarker;
  }

  async deleteCustomMarker(id: number): Promise<boolean> {
    const initialLength = this.customMarkers.length;
    this.customMarkers = this.customMarkers.filter(marker => marker.id !== id);
    return this.customMarkers.length < initialLength;
  }

  // Matrix cell operations with proper storage
  async createMatrixCell(data: InsertMatrixCell): Promise<MatrixCell> {
    const key = `${data.rowModuleId}-${data.colModuleId}-${data.projectId}`;

    // Check if cell already exists, if so update it
    const existingCellIndex = this.matrixCells.findIndex(cell => cell.rowModuleId === data.rowModuleId && cell.colModuleId === data.colModuleId && cell.projectId === data.projectId);

    if (existingCellIndex !== -1) {
      const updatedCell: MatrixCell = {
        ...this.matrixCells[existingCellIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };
      this.matrixCells[existingCellIndex] = updatedCell;
      console.log(`Storage: Updated matrix cell ${key} with value ${data.value}`);
      return updatedCell;
    } else {
      const id = this.getNextId().toString();
      const cell: MatrixCell = {
        ...data,
        id: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.matrixCells.push(cell);
      console.log(`Storage: Created matrix cell ${key} with value ${data.value}`);
      return cell;
    }
  }

  async getMatrixCells(): Promise<MatrixCell[]> {
    return [...this.matrixCells];
  }

  async getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]> {
    return this.matrixCells.filter(cell => cell.projectId === projectId);
  }

  async updateMatrixCell(id: number, data: Partial<MatrixCell>): Promise<MatrixCell | null> {
    const index = this.matrixCells.findIndex(cell => cell.id === id.toString());
    if (index === -1) return null;

    const updatedCell = {
      ...this.matrixCells[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.matrixCells[index] = updatedCell;
    return updatedCell;
  }

  // Additional missing methods for traceability
  async getTraceabilityMatrix(projectId: number): Promise<any> {
    return this.traceabilityMatrixes.find(matrix => matrix.projectId === projectId);
  }

  async saveTraceabilityMatrix(projectId: number, matrixData: any[]): Promise<any> {
    try {
      console.log(`Storage: Saving traceability matrix for project ${projectId}:`, matrixData);

      // Clear existing matrix cells for this project
      this.matrixCells = this.matrixCells.filter(cell => cell.projectId !== projectId);

      // Save new matrix cells
      for (const cellData of matrixData) {
        await this.createMatrixCell({
          rowModuleId: cellData.rowModuleId,
          colModuleId: cellData.colModuleId,
          projectId: projectId,
          value: cellData.markerId?.toString() || '',
          createdById: cellData.createdById || 1
        });
      }

      console.log(`Storage: Successfully saved ${matrixData.length} matrix cells for project ${projectId}`);
      return { success: true, message: 'Matrix saved successfully' };
    } catch (error) {
      console.error('Error saving traceability matrix:', error);
      throw error;
    }
  }

  async getTraceabilityMatrixById(id: number): Promise<any | undefined> {
    return this.traceabilityMatrixes.find(matrix => matrix.id === id);
  }

  async createTraceabilityMatrix(matrix: any): Promise<any> {
    const id = this.getNextId();
    const newMatrix = {
      id,
      ...matrix,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.traceabilityMatrixes.push(newMatrix);
    return newMatrix;
  }

  async updateTraceabilityMatrix(id: number, matrix: any): Promise<any> {
    const index = this.traceabilityMatrixes.findIndex(m => m.id === id);
    if (index === -1) return null;

    const updatedMatrix = {
      ...this.traceabilityMatrixes[index],
      ...matrix,
      updatedAt: new Date()
    };
    this.traceabilityMatrixes[index] = updatedMatrix;
    return updatedMatrix;
  }

  async deleteTraceabilityMatrix(id: number): Promise<boolean> {
    const initialLength = this.traceabilityMatrixes.length;
    this.traceabilityMatrixes = this.traceabilityMatrixes.filter(m => m.id !== id);
    return this.traceabilityMatrixes.length < initialLength;
  }

  async getTraceabilityMarkers(projectId: number): Promise<any[]> {
    return this.traceabilityMarkers.filter(marker => marker.projectId === projectId);
  }

  async getTraceabilityMarker(id: number): Promise<any | undefined> {
    return this.traceabilityMarkers.find(marker => marker.id === id);
  }

  async createTraceabilityMarker(marker: any): Promise<any> {
    const id = this.getNextId();
    const newMarker = {
      id,
      ...marker,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.traceabilityMarkers.push(newMarker);
    console.log(`Storage: Created traceability marker with ID ${id}:`, newMarker);
    return newMarker;
  }

  async updateTraceabilityMarker(id: number, marker: any): Promise<any> {
    const index = this.traceabilityMarkers.findIndex(m => m.id === id);
    if (index === -1) return null;

    const updatedMarker = {
      ...this.traceabilityMatrixes[index],
      ...marker,
      updatedAt: new Date()
    };
    this.traceabilityMarkers[index] = updatedMarker;
    console.log(`Storage: Updated traceability marker with ID ${id}:`, updatedMarker);
    return updatedMarker;
  }

  async deleteTraceabilityMarker(id: number): Promise<boolean> {
    const initialLength = this.traceabilityMarkers.length;
    this.traceabilityMarkers = this.traceabilityMarkers.filter(m => m.id !== id);
    console.log(`Storage: Deleted traceability marker with ID ${id}`);
    return this.traceabilityMarkers.length < initialLength;
  }

  async getTraceabilityMatrixCells(matrixId: number): Promise<any[]> {
    return []; // Placeholder for now
  }

  async createTraceabilityMatrixCell(cell: any): Promise<any> {
    return cell; // Placeholder for now
  }

  async updateTraceabilityMatrixCell(id: number, cell: any): Promise<any> {
    return cell; // Placeholder for now
  }

  // Method to fix existing test case IDs
  async fixExistingTestCaseIds(): Promise<void> {
    console.log('🔧 Starting to fix existing test case IDs...');

    // First, fix module IDs to ensure they have proper format
    for (const module of this.modules) {
      const project = this.projects.find(p => p.id === module.projectId);
      if (!project) continue;

      const projectPrefix = project.prefix || 'BEG';

      // If module doesn't have proper ID format, fix it
      if (!module.moduleId || !module.moduleId.includes('-MOD-')) {
        let modulePrefix = 'MOD';
        if (module.name) {
          const cleanModuleName = module.name.replace(/[^a-zA-Z]/g, '').toLowerCase();

          // Enhanced keyword-based mapping
          if (cleanModuleName.includes('register') || cleanModuleName.includes('registration') || cleanModuleName.includes('signup')) {
            modulePrefix = 'REG';
          } else if (cleanModuleName.includes('login') || cleanModuleName.includes('signin') || cleanModuleName.includes('auth')) {
            modulePrefix = 'LOG';
          } else if (cleanModuleName.includes('profile') || cleanModuleName.includes('account')) {
            modulePrefix = 'PROF';
          } else if (cleanModuleName.includes('dashboard') || cleanModuleName.includes('home')) {
            modulePrefix = 'DASH';
          } else if (cleanModuleName.includes('user') || cleanModuleName.includes('users')) {
            modulePrefix = 'USR';
          } else if (cleanModuleName.includes('admin') || cleanModuleName.includes('administration')) {
            modulePrefix = 'ADM';
          } else if (cleanModuleName.includes('payment') || cleanModuleName.includes('billing')) {
            modulePrefix = 'PAY';
          } else if (cleanModuleName.includes('order') || cleanModuleName.includes('cart')) {
            modulePrefix = 'ORD';
          } else if (cleanModuleName.includes('product') || cleanModuleName.includes('catalog')) {
            modulePrefix = 'PRD';
          } else if (cleanModuleName.includes('search') || cleanModuleName.includes('filter')) {
            modulePrefix = 'SRC';
          } else {
            // Fall back to first 3 characters of clean module name
            const cleanName = module.name.replace(/[^a-zA-Z]/g, '');
            if (cleanName.length >= 3) {
              modulePrefix = cleanName.substring(0, 3).toUpperCase();
            } else {
              modulePrefix = cleanName.toUpperCase().padEnd(3, 'X');
            }
          }
        }

        // Find the highest existing module number for this project
        const modulePattern = new RegExp(`^${projectPrefix}-[A-Z]{3}-MOD-(\\d+)$`);
        const existingNumbers = this.modules
          .filter(m => m.projectId === module.projectId && m.id !== module.id && m.moduleId)
          .map(m => {
            const match = m.moduleId.match(modulePattern);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(num => !isNaN(num) && num > 0);

        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        module.moduleId = `${projectPrefix}-${modulePrefix}-MOD-${String(nextNumber).padStart(2, '0')}`;
        module.updatedAt = new Date();

        console.log(`✅ Fixed module ID ${module.id}: ${module.moduleId} (${module.name})`);
      }
    }

    // Now fix test case IDs based on corrected module IDs
    for (const testCase of this.testCases) {
      const module = this.modules.find(m => m.id === testCase.moduleId);
      const project = this.projects.find(p => p.id === testCase.projectId);

      if (!module || !project) {
        console.log(`⚠️ Skipping test case ${testCase.id}: Module or project not found`);
        continue;
      }

      const projectPrefix = project.prefix || 'BEG';

      // Extract module prefix from corrected module ID
      let modulePrefix = 'MOD';
      if (module.moduleId && module.moduleId.includes('-')) {
        const moduleIdParts = module.moduleId.split('-');
        if (moduleIdParts.length >= 3) {
          const potentialPrefix = moduleIdParts[1];
          if (potentialPrefix && potentialPrefix.length >= 2) {
            modulePrefix = potentialPrefix.toUpperCase();
          }
        }
      }

      // Check if test case already has proper format
      const expectedPattern = new RegExp(`^${projectPrefix}-${modulePrefix}-TC-\\d{3}$`);
      if (testCase.testCaseId && expectedPattern.test(testCase.testCaseId)) {
        continue; // Already has proper format
      }

      // Find the highest existing test case number for this specific module
      const prefixPattern = new RegExp(`^${projectPrefix}-${modulePrefix}-TC-(\\d+)$`);
      const existingTestCases = this.testCases
        .filter(tc => tc.moduleId === testCase.moduleId && tc.projectId === testCase.projectId && tc.id !== testCase.id && !tc.isDeleted)
        .map(tc => tc.testCaseId)
        .filter(id => id && prefixPattern.test(id))
        .map(id => {
          const match = id.match(prefixPattern);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num) && num > 0);

      const nextNumber = existingTestCases.length > 0 ? Math.max(...existingTestCases) + 1 : 1;
      const newTestCaseId = `${projectPrefix}-${modulePrefix}-TC-${String(nextNumber).padStart(3, '0')}`;

      // Update the test case
      testCase.testCaseId = newTestCaseId;
      testCase.updatedAt = new Date();

      console.log(`✅ Fixed test case ID ${testCase.id}: ${testCase.testCaseId} (module: ${module.name}, modulePrefix: ${modulePrefix})`);
    }

    console.log('🔧 Finished fixing existing test case IDs');
  }

  // Helper method to record activities
  private recordActivity(entityType: string, action: string, entityId: number, userId: number) {
    const activity: Activity = {
      id: this.nextActivityId++,
      userId,
      action,
      entityType,
      entityId,
      details: {
        entityType,
        action,
        entityId
      },
      createdAt: new Date(),
    };
    this.activities.push(activity);
  }

  // Notebook operations implementation
  async getNotebooks(userId: number): Promise<Notebook[]> {
    return this.notebooks.filter(notebook => 
      notebook.userId === userId || 
      notebook.isPublic || 
      (notebook.sharedWith && notebook.sharedWith.includes(userId))
    );
  }

  async getNotebook(id: number, userId: number): Promise<Notebook | null> {
    const notebook = this.notebooks.find(n => n.id === id);
    if (!notebook) return null;

    // Check if user has access
    if (notebook.userId === userId || notebook.isPublic || (notebook.sharedWith && notebook.sharedWith.includes(userId))) {
      // Update last viewed
      notebook.lastViewedAt = new Date();
      return notebook;
    }

    return null;
  }

  async createNotebook(notebookData: any): Promise<Notebook> {
    const id = this.nextNotebookId++;
    const now = new Date();

    const notebook: Notebook = {
      id,
      title: notebookData.title,
      content: notebookData.content || '',
      color: notebookData.color || '#4F46E5',
      isPinned: notebookData.isPinned || false,
      isArchived: notebookData.isArchived || false,
      tags: notebookData.tags || [],
      attachments: notebookData.attachments || [],
      categoryId: notebookData.categoryId || null,
      isPublic: notebookData.isPublic || false,
      sharedWith: notebookData.sharedWith || [],
      lastViewedAt: now,
      userId: notebookData.userId,
      createdAt: now,
      updatedAt: now,
    };

    this.notebooks.push(notebook);
    return notebook;
  }

  async updateNotebook(id: number, userId: number, updates: any): Promise<Notebook | null> {
    const index = this.notebooks.findIndex(n => n.id === id && n.userId === userId);
    if (index === -1) return null;

    const updatedNotebook = {
      ...this.notebooks[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.notebooks[index] = updatedNotebook;
    return updatedNotebook;
  }

  async deleteNotebook(id: number, userId: number): Promise<boolean> {
    const initialLength = this.notebooks.length;
    this.notebooks = this.notebooks.filter(n => !(n.id === id && n.userId === userId));

    // Also delete related comments
    this.notebookComments = this.notebookComments.filter(c => c.notebookId !== id);

    return this.notebooks.length < initialLength;
  }

  async searchNotebooks(userId: number, query: string): Promise<Notebook[]> {
    const userNotebooks = await this.getNotebooks(userId);
    const searchTerm = query.toLowerCase();

    return userNotebooks.filter(notebook =>
      notebook.title.toLowerCase().includes(searchTerm) ||
      notebook.content.toLowerCase().includes(searchTerm) ||
      notebook.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  async getSharedNotebooks(userId: number): Promise<Notebook[]> {
    return this.notebooks.filter(notebook => 
      notebook.sharedWith && notebook.sharedWith.includes(userId) && notebook.userId !== userId
    );
  }

  async shareNotebook(notebookId: number, userId: number, targetUserIds: number[]): Promise<boolean> {
    const notebook = this.notebooks.find(n => n.id === notebookId && n.userId === userId);
    if (!notebook) return false;

    notebook.sharedWith = [...new Set([...notebook.sharedWith, ...targetUserIds])];
    notebook.updatedAt = new Date();
    return true;
  }

  // Notebook Categories
  async getNotebookCategories(userId: number): Promise<NotebookCategory[]> {
    return this.notebookCategories.filter(category => category.userId === userId);
  }

  async createNotebookCategory(categoryData: any): Promise<NotebookCategory> {
    const id = this.nextNotebookCategoryId++;
    const now = new Date();

    const category: NotebookCategory = {
      id,
      name: categoryData.name,
      description: categoryData.description || null,
      color: categoryData.color || '#6B7280',
      userId: categoryData.userId,
      createdAt: now,
    };

    this.notebookCategories.push(category);
    return category;
  }

  async updateNotebookCategory(id: number, userId: number, updates: any): Promise<NotebookCategory | null> {
    const index = this.notebookCategories.findIndex(c => c.id === id && c.userId === userId);
    if (index === -1) return null;

    const updatedCategory = {
      ...this.notebookCategories[index],
      ...updates,
    };

    this.notebookCategories[index] = updatedCategory;
    return updatedCategory;
  }

  async deleteNotebookCategory(id: number, userId: number): Promise<boolean> {
    const initialLength = this.notebookCategories.length;
    this.notebookCategories = this.notebookCategories.filter(c => !(c.id === id && c.userId === userId));

    // Remove category reference from notebooks
    this.notebooks.forEach(notebook => {
      if (notebook.categoryId === id && notebook.userId === userId) {
        notebook.categoryId = null;
        notebook.updatedAt = new Date();
      }
    });

    return this.notebookCategories.length < initialLength;
  }

  // Notebook Comments
  async getNotebookComments(notebookId: number): Promise<NotebookComment[]> {
    return this.notebookComments
      .filter(comment => comment.notebookId === notebookId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createNotebookComment(commentData: any): Promise<NotebookComment> {
    const id = this.nextNotebookCommentId++;
    const now = new Date();

    const comment: NotebookComment = {
      id,
      notebookId: commentData.notebookId,
      content: commentData.content,
      authorId: commentData.authorId,
      parentId: commentData.parentId || null,
      createdAt: now,
      updatedAt: now,
    };

    this.notebookComments.push(comment);
    return comment;
  }

  async updateNotebookComment(id: number, authorId: number, updates: any): Promise<NotebookComment | null> {
    const index = this.notebookComments.findIndex(c => c.id === id && c.authorId === authorId);
    if (index === -1) return null;

    const updatedComment = {
      ...this.notebookComments[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.notebookComments[index] = updatedComment;
    return updatedComment;
  }

  async deleteNotebookComment(id: number, authorId: number): Promise<boolean> {
    const initialLength = this.notebookComments.length;
    this.notebookComments = this.notebookComments.filter(c => !(c.id === id && c.authorId === authorId));
    return this.notebookComments.length < initialLength;
  }

  // Initialize with default data
  constructor() {
    this.initializeDefaultData();
    this.initializeEmployeeDefaults();

    // Fix existing test case IDs immediately to ensure proper format
    setTimeout(() => {
      this.fixExistingTestCaseIds().then(() => {
        console.log('✅ Test case ID migration completed');
      });
    }, 100);

    // Initialize messaging arrays if they don't exist
    if (!this.data.messages) {
      this.data.messages = [];
    }
    if (!this.data.conversations) {
      this.data.conversations = [];
    }
  }

  private initializeDefaultData() {
    // Add default admin user only
    const defaultAdmin: User = {
      id: 1,
      firstName: "Admin",
      lastName: "User",
      email: "admin@testtracker.com",
      password: "$2b$10$rHVZqLHMxJ6Jy8ZxVGvYmeqPHBOQnDjCLKH1X8Zo1qC.2lXZ3cBqG", // "admin123"
      role: "Admin",
      status: "Active",
      theme: "light",
      createdAt: new Date(),
    };

    this.users.push(defaultAdmin);

    // Add requested super admin user
    const superAdmin: User = {
      id: 2,
      firstName: "Super",
      lastName: "Admin",
      email: "admin@navadhiti.com",
      password: "$2b$10$H3zGZ8laA8P8Om3Dym5H9.loF6HpABJHlCKc3TL4gxMOmcKCeeq/u", // "navadhiti@123"
      role: "Admin",
      status: "Active",
      theme: "light",
      createdAt: new Date(),
    };

    this.users.push(superAdmin);

    // Set counters to start fresh
    this.nextUserId = 3;
    this.nextProjectId = 1;
    this.nextModuleId = 1;
    this.nextTestCaseId = 1;
    this.nextBugId = 1;
    this.nextActivityId = 1;
    this.nextDocumentFolderId = 1;
    this.nextDocumentId = 1;
    this.nextTimeSheetId = 1;
    this.nextTimeSheetFolderId = 1;
    this.nextCustomerId = 1;


    console.log("✅ Initialized clean storage with admin user only:", {
      users: this.users.length,
      projects: this.projects.length,
      modules: this.modules.length,
      testCases: this.testCases.length,
      bugs: this.bugs.length
    });
  }

  async updateTestCaseStatus(id: number, status: TestCaseStatus): Promise<TestCase | null> {
    console.log(`Storage: updateTestCaseStatus(${id}, ${status})`);
    return this.updateTestCase(id, { status });
  }

  async updateBugStatus(id: number, status: BugStatus): Promise<Bug | null> {
    console.log(`Storage: updateBugStatus(${id}, ${status})`);
    return this.updateBug(id, { status });
  }

  // Todo Management Implementation
  async getTodos(userId: number): Promise<any[]> {
    const todos = Array.from(this.todosMap.values()).filter(todo => todo.userId === userId);
    console.log(`Storage: getTodos for user ${userId} returning ${todos.length} todos`);
    return todos;
  }

  async getTodosByUserId(userId: number): Promise<any[]> {
    const todos = Array.from(this.todosMap.values()).filter(todo => todo.userId === userId);
    console.log(`Storage: getTodosByUserId for user ${userId} returning ${todos.length} todos`);
    return todos;
  }

  async getTodo(id: number): Promise<any | undefined> {
    return this.todosMap.get(id);
  }

  async createTodo(data: any): Promise<any> {
    const id = this.getNextId();
    const todo = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.todosMap.set(id, todo);
    return todo;
  }

  async updateTodo(id: number, data: any): Promise<any | null> {
    const todo = this.todosMap.get(id);
    if (!todo) return null;

    const updatedTodo = {
      ...todo,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.todosMap.set(id, updatedTodo);
    return updatedTodo;
  }

  async deleteTodo(id: number): Promise<boolean> {
    return this.todosMap.delete(id);
  }

  async getTodoLists(userId: number): Promise<any[]> {
    console.log("Getting todo lists for user:", userId);

    // Initialize data.todoLists if it doesn't exist
    if (!this.data.todoLists) {
      this.data.todoLists = [];
    }

    const userTodoLists = this.data.todoLists.filter(list => list.userId === userId) || [];
    console.log("User todo lists:", userTodoLists);
    return userTodoLists;
  }

  async getTodoList(id: number): Promise<any | undefined> {
    if (!this.todoListsMap) {
      this.todoListsMap = new Map<number, any>();
    }
    return this.todoListsMap.get(id);
  }

  async updateTodoList(id: number, data: any): Promise<any | null> {
    if (!this.todoListsMap) {
      this.todoListsMap = new Map<number, any>();
    }
    const todoList = this.todoListsMap.get(id);
    if (!todoList) return null;

    const updatedTodoList = {
      ...todoList,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.todoListsMap.set(id, updatedTodoList);
    return updatedTodoList;
  }

  async deleteTodoList(id: number): Promise<boolean> {
    if (!this.todoListsMap) {
      this.todoListsMap = new Map<number, any>();
    }
    return this.todoListsMap.delete(id);
  }

  // Fix: Add getTodosByListId method
  async getTodosByListId(listId: number): Promise<any[]> {
    const todos = Array.from(this.todosMap.values()).filter(todo => todo.todoListId === listId);
    console.log(`Storage: getTodosByListId for list ${listId} returning ${todos.length} todos`);
    return todos;
  }
  async createTodoList(data: any): Promise<any> {
    const id = this.getNextId();
    const todoList = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Initialize data.todoLists if it doesn't exist
    if (!this.data.todoLists) {
      this.data.todoLists = [];
    }

    // Add to both the map and the data array for compatibility
    this.todoListsMap.set(id, todoList);
    this.data.todoLists.push(todoList);

    return todoList;
  }

  // Employee Management Implementation
  async getEmployees(): Promise<any[]> {
    return [...this.employees];
  }

  async getEmployee(id: number): Promise<any | undefined> {
    return this.employees.find(employee => employee.id === id);
  }

  async createEmployee(data: any): Promise<any> {
    const id = this.getNextId();

    // Auto-generate employee ID if not provided
    let employeeId = data.employeeId;
    if (!employeeId || employeeId.trim() === '') {
      const existingEmployees = [...this.employees];
      const existingNumbers = existingEmployees
        .map(emp => emp.employeeId)
        .filter(id => id && id.match(/^EMP-(\d+)$/))
        .map(id => parseInt(id.replace('EMP-', ''), 10))
        .filter(num => !isNaN(num));

      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      employeeId = `EMP-${String(nextNumber).padStart(4, '0')}`;
    }

    const employee = {
      id,
      ...data,
      employeeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.employees.push(employee);
    return employee;
  }

  async updateEmployee(id: number, data: any): Promise<any | null> {
    const index = this.employees.findIndex(employee => employee.id === id);
    if (index === -1) return null;

    const updatedEmployee = {
      ...this.employees[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.employees[index] = updatedEmployee;
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const initialLength = this.employees.length;
    this.employees = this.employees.filter(employee => employee.id !== id);
    return this.employees.length < initialLength;
  }

  // Employee Project Mapping
  async getEmployeeProjects(employeeId?: number): Promise<any[]> {
    let results = [...this.employeeProjects];
    if (employeeId) {
      results = results.filter(ep => ep.employeeId === employeeId);
    }
    return results;
  }

  async createEmployeeProject(data: any): Promise<any> {
    const id = this.getNextId();
    const employeeProject = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.employeeProjects.push(employeeProject);
    return employeeProject;
  }

  async deleteEmployeeProject(id: number): Promise<boolean> {
    const initialLength = this.employeeProjects.length;
    this.employeeProjects = this.employeeProjects.filter(ep => ep.id !== id);
    return this.employeeProjects.length < initialLength;
  }

  async updateEmployeeProject(id: number, data: Partial<any>): Promise<any> {
    const index = this.employeeProjects.findIndex(ep => ep.id === id);
    if (index === -1) {
      console.error(`Employee project with ID ${id} not found.`);
      return null;
    }
    const updatedEmployeeProject = {
      ...this.employeeProjects[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.employeeProjects[index] = updatedEmployeeProject;
    return updatedEmployeeProject;
  }

  // Modified getEmployeeProjectHistory to use the project name from the correct source
  async getEmployeeProjectHistory(employeeId: number): Promise<any[]> {
    // Initialize history array if needed
    if (!this.employeeProjectHistory) {
      this.employeeProjectHistory = [];
    }

    // Get history records for this employee
    const historyRecords = this.employeeProjectHistory.filter(hr => hr.employeeId === employeeId);

    // Get current employee projects for this specific employee
    const employeeProjects = this.employeeProjects
      .filter(ep => ep.employeeId === employeeId);

    // Combine history records with current projects
    const combinedHistory = [
      ...historyRecords,
      ...employeeProjects.map(ep => ({
        ...ep,
        action: ep.isActive ? 'active' : 'completed',
        status: ep.isActive ? ep.status : 'completed'
      }))
    ];

    // Enrich with project names
    const enrichedHistory = combinedHistory.map(ep => {
      let projectName = 'Unknown Project';

      if (ep.projectType === 'navadhiti') {
        const navadhitiProject = this.navadhitiProjects.find(p => p.id === ep.projectId);
        projectName = navadhitiProject?.projectName || navadhitiProject?.name || 'Unknown Navadhiti Project';
      } else {
        const regularProject = this.projects.find(p => p.id === ep.projectId);
        projectName = regularProject?.name || 'Unknown Regular Project';
      }

      return {
        ...ep,
        projectName
      };
    });

    console.log(`getEmployeeProjectHistory for employee ${employeeId}: returning`, enrichedHistory.length, 'records');
    console.log('History breakdown:', {
      extensionHistory: historyRecords.length,
      currentProjects: employeeProjects.length,
      total: enrichedHistory.length
    });

    // Sort by updatedAt/createdAt descending
    return enrichedHistory.sort((a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  }

  // Modified getAllEmployeeProjectHistory to use the project name from the correct source
  async getAllEmployeeProjectHistory(): Promise<any[]> {
    // Initialize history array if needed
    if (!this.employeeProjectHistory) {
      this.employeeProjectHistory = [];
    }

    // Get all history records (including extensions)
    const historyRecords = [...this.employeeProjectHistory];

    // Get all active employee projects and add them as history entries
    const allEmployeeProjects = [...this.employeeProjects];

    // Combine history records with active projects
    const combinedHistory = [
      ...historyRecords,
      ...allEmployeeProjects.map(ep => ({
        ...ep,
        action: ep.isActive ? 'active' : 'completed',
        status: ep.isActive ? ep.status : 'completed'
      }))
    ];

    // Enrich with project names
    const enrichedHistory = combinedHistory.map(ep => {
      let projectName = 'Unknown Project';

      if (ep.projectType === 'navadhiti') {
        const navadhitiProject = this.navadhitiProjects.find(p => p.id === ep.projectId);
        projectName = navadhitiProject?.projectName || navadhitiProject?.name || 'Unknown Navadhiti Project';
      } else {
        const regularProject = this.projects.find(p => p.id === ep.projectId);
        projectName = regularProject?.name || 'Unknown Regular Project';
      }

      return {
        ...ep,
        projectName
      };
    });

    console.log('getAllEmployeeProjectHistory: returning', enrichedHistory.length, 'records');
    console.log('History records breakdown:', {
      extensionHistory: historyRecords.length,
      activeProjects: allEmployeeProjects.length,
      total: enrichedHistory.length
    });

    // Sort by updatedAt/createdAt descending
    return enrichedHistory.sort((a, b) =>
      new Date(b.updatedAt || a.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  }

  // Add getEmployeeProjectAllocation method for extension functionality
  async getEmployeeProjectAllocation(allocationId: number): Promise<any | null> {
    try {
      const allocation = this.employeeProjects.find(ep => ep.id === allocationId);
      return allocation || null;
    } catch (error) {
      console.error('Error getting employee project allocation:', error);
      throw error;
    }
  }

  // Add createEmployeeProjectHistory method
  async createEmployeeProjectHistory(historyData: any): Promise<any> {
    try {
      const history = {
        id: Date.now() + Math.random(), // Using a simple unique ID generation
        ...historyData,
        createdAt: new Date().toISOString()
      };

      // Add to history
      if (!this.employeeProjectHistory) {
        this.employeeProjectHistory = [];
      }

      // Add to history immediately
      this.employeeProjectHistory.push(history);
      return history;
    } catch (error) {
      console.error('Error creating employee project history:', error);
      throw error;
    }
  }

  // Technology Options
  async getTechnologyOptions(): Promise<any[]> {
    return [...this.technologyOptions];
  }

  async createTechnologyOption(data: any): Promise<any> {
    const id = this.getNextId();
    const tech = {
      id,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.technologyOptions.push(tech);
    return tech;
  }

  // Department Options
  async getDepartmentOptions(): Promise<any[]> {
    return [...this.departmentOptions];
  }

  async createDepartmentOption(data: any): Promise<any> {
    const id = this.getNextId();
    const dept = {
      id,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.departmentOptions.push(dept);
    return dept;
  }

  // Navadhiti Projects implementation
  async getNavadhitiProjects(): Promise<any[]> {
    return [...this.navadhitiProjects];
  }

  async getNavadhitiProject(id: number): Promise<any | undefined> {
    return this.navadhitiProjects.find(project => project.id === id);
  }

  async createNavadhitiProject(data: any): Promise<any> {
    const id = this.getNextId();
    const project = {
      id,
      ...data,
      // Ensure customer and client name mapping
      customer: data.clientName || data.customer,
      clientName: data.clientName || data.customer,
      // Ensure project lead is properly stored
      projectLead: data.projectLead || data.assignedEmployees?.[0] || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.navadhitiProjects.push(project);
    return project;
  }

  async updateNavadhitiProject(id: number, data: any): Promise<any | null> {
    const index = this.navadhitiProjects.findIndex(project => project.id === id);
    if (index === -1) {
      return null;
    }

    const updatedProject = {
      ...this.navadhitiProjects[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Ensure status review fields are properly mapped
    if (data.overallProjectStatus !== undefined) {
      updatedProject.overallProjectStatus = data.overallProjectStatus;
    }
    if (data.currentSprint !== undefined) {
      updatedProject.currentSprint = data.currentSprint;
    }
    if (data.weeklyComms !== undefined) {
      updatedProject.weeklyComms = data.weeklyComms;
    }
    if (data.currentIssues !== undefined) {
      updatedProject.currentIssues = data.currentIssues;
    }
    if (data.immediateActionItems !== undefined) {
      updatedProject.immediateActionItems = data.immediateActionItems;
    }
    if (data.supportRequired !== undefined) {
      updatedProject.supportRequired = data.supportRequired;
    }
    if (data.additionalRemarks !== undefined) {
      updatedProject.additionalRemarks = data.additionalRemarks;
    }
    if (data.projectLead !== undefined) {
      updatedProject.projectLead = data.projectLead;
    }

    this.navadhitiProjects[index] = updatedProject;
    console.log(`Updated Navadhiti project ${id}:`, updatedProject);
    return updatedProject;
  }

  async deleteNavadhitiProject(id: number): Promise<boolean> {
    const initialLength = this.navadhitiProjects.length;
    this.navadhitiProjects = this.navadhitiProjects.filter(project => project.id !== id);
    return this.navadhitiProjects.length < initialLength;
  }

  // Status Review methods
  async getStatusReviews(date?: string): Promise<any[]> {
    let reviews = Array.from(this.statusReviews.values());

    if (date) {
      const targetDate = new Date(date).toISOString().split('T')[0];
      reviews = reviews.filter(review => {
        const reviewDate = new Date(review.reviewDate).toISOString().split('T')[0];
        return reviewDate === targetDate;
      });
    }

    return reviews;
  }

  async createStatusReview(data: any): Promise<any> {
    const id = this.getNextId();
    const review = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.statusReviews.set(id, review);

    // Also update the project with the status review data
    if (data.projectId) {
      const projectIndex = this.navadhitiProjects.findIndex(p => p.id === data.projectId);
      if (projectIndex !== -1) {
        const project = this.navadhitiProjects[projectIndex];
        const updatedProject = {
          ...project,
          // Update project lead if provided
          projectLead: data.projectLead || project.projectLead,
          // Store both status ID and labels for flexibility
          overallProjectStatus: data.overallProjectStatus,
          overallProjectStatusLabel: data.overallProjectStatusLabel,
          overallProjectStatusColor: data.overallProjectStatusColor,
          currentSprintStatus: data.currentSprintStatus,
          currentSprintStatusLabel: data.currentSprintStatusLabel,
          currentSprintStatusColor: data.currentSprintStatusColor,
          weeklyComms: data.weeklyComms,
          weeklyCommsLabel: data.weeklyCommsLabel,
          weeklyCommsColor: data.weeklyCommsColor,
          currentIssues: data.currentIssues,
          currentIssuesLabel: data.currentIssuesLabel,
          currentIssuesColor: data.currentIssuesColor,
          immediateActionItems: data.immediateActionItems,
          immediateActionItemsLabel: data.immediateActionItemsLabel,
          immediateActionItemsColor: data.immediateActionItemsColor,
          supportRequired: data.supportRequired,
          supportRequiredLabel: data.supportRequiredLabel,
          supportRequiredColor: data.supportRequiredColor,
          additionalRemarks: data.additionalRemarks,
          lastReviewDate: data.reviewDate,
          notes: data.notes,
          updatedAt: new Date().toISOString()
        };
        this.navadhitiProjects[projectIndex] = updatedProject;
        console.log(`Updated project ${data.projectId} with status review data:`, updatedProject);
      }
    }

    return review;
  }

  // Helper method for data persistence
  private saveData(): void {
    try {
      const dataToSave = {
        users: this.users,
        projects: this.projects,
        modules: this.modules,
        testCases: this.testCases,
        bugs: this.bugs,
        bugComments: this.bugComments,
        testSheets: this.testSheets,
        chats: this.chats,
        timesheets: this.timeSheets,
        documents: this.documents,
        documentFolders: this.documentFolders,
        notebooks: this.notebooks,
        navadhitiProjects: this.navadhitiProjects,
        employees: this.employees || []
      };
      // In memory storage - no actual persistence needed for this implementation
      // console.log("Data saved to memory storage", dataToSave); // Uncomment for debugging
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  // Add extend employee project duration route for history management
  async extendEmployeeProject(allocationId: number, newEndDate: string, extensionDays?: number): Promise<any> {
    try {
      const allocationIndex = this.employeeProjects.findIndex(ep => ep.id === allocationId);
      if (allocationIndex === -1) {
        throw new Error('Project allocation not found');
      }
      const allocation = this.employeeProjects[allocationIndex];

      const previousEndDate = allocation.endDate;

      // Create history record BEFORE updating the allocation
      const historyId = this.getNextId();
      const historyRecord = {
        id: historyId,
        employeeProjectId: allocationId,
        employeeId: allocation.employeeId,
        projectId: allocation.projectId,
        projectType: allocation.projectType || 'navadhiti',
        role: allocation.role,
        startDate: allocation.startDate,
        endDate: previousEndDate, // Original end date
        isActive: false,
        status: 'extended',
        allocation: allocation.allocation || 100,
        action: 'extended',
        previousEndDate: previousEndDate,
        newEndDate: newEndDate,
        extensionDays: extensionDays || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to history
      if (!this.employeeProjectHistory) {
        this.employeeProjectHistory = [];
      }

      // Add to history immediately
      this.employeeProjectHistory.push(historyRecord);

      // Now update the allocation with new end date
      const updatedAllocation = {
        ...allocation,
        endDate: newEndDate,
        updatedAt: new Date().toISOString()
      };

      this.employeeProjects[allocationIndex] = updatedAllocation;

      return {
        success: true,
        message: "Project duration extended successfully",
        allocation: updatedAllocation,
        historyRecord: historyRecord
      };
    } catch (error) {
      console.error('Error extending employee project:', error);
      throw error;
    }
  }

  // Request Forms Module Methods Implementations
  async getRequestFormTypes(): Promise<any[]> {
    return [...this.requestFormTypes];
  }

  async getRequestFormType(id: number): Promise<any | undefined> {
    return this.requestFormTypes.find(formType => formType.id === id);
  }

  async createRequestFormType(data: any): Promise<any> {
    const id = this.getNextId();
    const formType = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requestFormTypes.push(formType);
    return formType;
  }

  async updateRequestFormType(id: number, data: any): Promise<any | null> {
    const index = this.requestFormTypes.findIndex(formType => formType.id === id);
    if (index === -1) return null;

    const updatedFormType = {
      ...this.requestFormTypes[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.requestFormTypes[index] = updatedFormType;
    return updatedFormType;
  }

  async deleteRequestFormType(id: number): Promise<boolean> {
    const initialLength = this.requestFormTypes.length;
    this.requestFormTypes = this.requestFormTypes.filter(formType => formType.id !== id);
    return this.requestFormTypes.length < initialLength;
  }

  async getOptionsByFormType(formTypeId: number): Promise<any[]> {
    return this.requestFormOptions.filter(option => option.formTypeId === formTypeId);
  }

  async getOption(id: number): Promise<any | undefined> {
    return this.requestFormOptions.find(option => option.id === id);
  }

  async createOption(data: any): Promise<any> {
    const id = this.getNextId();
    const option = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requestFormOptions.push(option);
    return option;
  }

  async updateOption(id: number, data: any): Promise<any | null> {
    const index = this.requestFormOptions.findIndex(option => option.id === id);
    if (index === -1) return null;

    const updatedOption = {
      ...this.requestFormOptions[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.requestFormOptions[index] = updatedOption;
    return updatedOption;
  }

  async deleteOption(id: number): Promise<boolean> {
    const initialLength = this.requestFormOptions.length;
    this.requestFormOptions = this.requestFormOptions.filter(option => option.id !== id);
    return this.requestFormOptions.length < initialLength;
  }

  async getResourceRequests(): Promise<any[]> {
    return [...this.resourceRequests];
  }

  async getResourceRequest(id: number): Promise<any | undefined> {
    return this.resourceRequests.find(request => request.id === id);
  }

  async createResourceRequest(request: any): Promise<any> {
    // Generate request ID if not provided
    let requestId = request.requestId;
    if (!requestId) {
      const prefix = request.requestType ?
        request.requestType.split(' ')[0].toUpperCase() : 'REQ';
      const timestamp = Date.now().toString().slice(-6);
      requestId = `${prefix}-${timestamp}`;
    }

    const id = this.getNextId();
    const newRequest = {
      id,
      ...request,
      requestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.resourceRequests.push(newRequest);
    return newRequest;
  }

  async updateResourceRequest(id: number, data: any): Promise<any | null> {
    const index = this.resourceRequests.findIndex(request => request.id === id);
    if (index === -1) return null;

    const updatedRequest = {
      ...this.resourceRequests[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.resourceRequests[index] = updatedRequest;
    return updatedRequest;
  }

  async deleteResourceRequest(id: number): Promise<boolean> {
    const initialLength = this.resourceRequests.length;
    this.resourceRequests = this.resourceRequests.filter(request => request.id !== id);
    return this.resourceRequests.length < initialLength;
  }

  async getResourceRequestExtensions(): Promise<any[]> {
    return [...this.requestExtensions];
  }

  async getResourceRequestExtension(id: number): Promise<any | undefined> {
    return this.requestExtensions.find(extension => extension.id === id);
  }

  async createResourceRequestExtension(data: any): Promise<any> {
    const id = this.getNextId();
    const extension = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requestExtensions.push(extension);
    return extension;
  }

  async updateResourceRequestExtension(id: number, data: any): Promise<any | null> {
    const index = this.requestExtensions.findIndex(extension => extension.id === id);
    if (index === -1) return null;

    const updatedExtension = {
      ...this.requestExtensions[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.requestExtensions[index] = updatedExtension;
    return updatedExtension;
  }

  async deleteResourceRequestExtension(id: number): Promise<boolean> {
    const initialLength = this.requestExtensions.length;
    this.requestExtensions = this.requestExtensions.filter(extension => extension.id !== id);
    return this.requestExtensions.length < initialLength;
  }

  async getRequestComments(requestId: number): Promise<any[]> {
    return this.requestComments.filter(comment => comment.requestId === requestId);
  }

  async getRequestComment(id: number): Promise<any | undefined> {
    return this.requestComments.find(comment => comment.id === id);
  }

  async createRequestComment(data: any): Promise<any> {
    const id = this.getNextId();
    const comment = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requestComments.push(comment);
    return comment;
  }

  async updateRequestComment(id: number, data: any): Promise<any | null> {
    const index = this.requestComments.findIndex(comment => comment.id === id);
    if (index === -1) return null;

    const updatedComment = {
      ...this.requestComments[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.requestComments[index] = updatedComment;
    return updatedComment;
  }

  async deleteRequestComment(id: number): Promise<boolean> {
    const initialLength = this.requestComments.length;
    this.requestComments = this.requestComments.filter(comment => comment.id !== id);
    return this.requestComments.length < initialLength;
  }

  // Request Form Attachments implementation
  async getRequestAttachments(requestId: number): Promise<any[]> {
    return this.requestAttachments.filter(attachment => attachment.requestId === requestId);
  }

  async getRequestAttachment(attachmentId: number): Promise<any | null> {
    return this.requestAttachments.find(attachment => attachment.id === attachmentId) || null;
  }

  async createRequestAttachment(data: any): Promise<any> {
    const id = this.getNextId();
    const attachment = {
      id,
      ...data,
      uploadedAt: new Date().toISOString()
    };
    this.requestAttachments.push(attachment);
    return attachment;
  }

  async deleteRequestAttachment(attachmentId: number): Promise<boolean> {
    const initialLength = this.requestAttachments.length;
    this.requestAttachments = this.requestAttachments.filter(attachment => attachment.id !== attachmentId);
    return this.requestAttachments.length < initialLength;
  }

  // Notification methods
  async getNotifications(userId: number): Promise<any[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(data: any): Promise<any> {
    const id = this.getNextId();
    const notification = {
      id,
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<any> {
    const notification = this.notifications.get(id);
    if (!notification) return null;

    const updatedNotification = {
      ...notification,
      read: true,
      readAt: new Date().toISOString(),
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Role and Permission Methods (for Role-Based Access Control)
  async getRoles(): Promise<Role[]> {
    return this.roles;
  }

  async createRole(role: Omit<Role, 'id'>): Promise<Role> {
    const newRole = {
      ...role,
      id: this.roles.length + 1
    };
    this.roles.push(newRole);
    return newRole;
  }

  async updateRole(id: number, data: Partial<Role>): Promise<Role | null> {
    const index = this.roles.findIndex(role => role.id === id);
    if (index === -1) return null;

    const updatedRole = {
      ...this.roles[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.roles[index] = updatedRole;
    return updatedRole;
  }

  async deleteRole(id: number): Promise<boolean> {
    const initialLength = this.roles.length;
    this.roles = this.roles.filter(role => role.id !== id);
    return this.roles.length < initialLength;
  }

  async getPermissions(): Promise<Permission[]> {
    return this.permissions;
  }

  async createPermission(permission: Omit<Permission, 'id'>): Promise<Permission> {
    const newPermission = {
      ...permission,
      id: this.permissions.length + 1
    };
    this.permissions.push(newPermission);
    return newPermission;
  }

  async updatePermission(id: number, data: Partial<Permission>): Promise<Permission | null> {
    const index = this.permissions.findIndex(permission => permission.id === id);
    if (index === -1) return null;

    const updatedPermission = {
      ...this.permissions[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.permissions[index] = updatedPermission;
    return updatedPermission;
  }

  async deletePermission(id: number): Promise<boolean> {
    const initialLength = this.permissions.length;
    this.permissions = this.permissions.filter(permission => permission.id !== id);
    return this.permissions.length < initialLength;
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<boolean> {
    // This is a placeholder; actual implementation would involve a join table or similar structure
    console.log(`Assigning role ${roleId} to user ${userId}`);
    return true;
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    // This is a placeholder
    console.log(`Removing role ${roleId} from user ${userId}`);
    return true;
  }

  async getUserRoles(userId: number): Promise<Role[]> {
    // This is a placeholder; actual implementation would query user-role mappings
    console.log(`Getting roles for user ${userId}`);
    return [];
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    // This is a placeholder; actual implementation would query role-permission mappings
    console.log(`Getting permissions for role ${roleId}`);
    return [];
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<boolean> {
    // This is a placeholder
    console.log(`Assigning permission ${permissionId} to role ${roleId}`);
    return true;
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    // This is a placeholder
    console.log(`Removing permission ${permissionId} from role ${roleId}`);
    return true;
  }

  async getModulesWithPermissions(): Promise<any[]> {
    // This is a placeholder; would involve joining module data with permission data
    console.log("Getting modules with permissions");
    return [];
  }

  // Employee permissions methods
  async updateEmployeePermissions(employeeId: number, permissions: any[]): Promise<void> {
    const existingIndex = this.employeePermissions.findIndex(ep => ep.employeeId === employeeId);
    if (existingIndex >= 0) {
      this.employeePermissions[existingIndex].permissions = permissions;
    } else {
      this.employeePermissions.push({ employeeId, permissions });
    }
    console.log(`Updated permissions for employee ${employeeId}:`, permissions);
  }

  async getEmployeePermissions(employeeId: number): Promise<any[]> {
    const employeePerms = this.employeePermissions.find(ep => ep.employeeId === employeeId);
    console.log(`Retrieved permissions for employee ${employeeId}:`, employeePerms ? employeePerms.permissions : []);
    return employeePerms ? employeePerms.permissions : [];
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

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());= id) || null;
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