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
  BugStatusCounts
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
  deleteTestCase(id: number): Promise<boolean>;

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
  getDocumentFolders(): Promise<DocumentFolder[]>;
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
  createNotebook(notebookData: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notebook>;
  updateNotebook(id: number, userId: number, updates: Partial<Notebook>): Promise<Notebook | null>;
  deleteNotebook(id: number, userId: number): Promise<boolean>;

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

  // Employee Management Methods
  getEmployees(): Promise<any[]>;
  getEmployee(id: number): Promise<any | undefined>;
  createEmployee(data: any): Promise<any>;
  updateEmployee(id: number, data: any): Promise<any | null>;
  deleteEmployee(id: number): Promise<boolean>;

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
  private notebooks: Notebook[] = [];
  private githubConfigs: GitHubConfig[] = [];
  private githubIssues: any[] = [];
  private projectMembers: ProjectMember[] = [];
  private sprints: Sprint[] = [];
  private kanbanColumns: KanbanColumn[] = [];
  private kanbanCards: KanbanCard[] = [];
  private traceabilityMatrixes: TraceabilityMatrix[] = [];

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
    return this.brdDocuments.find(doc => doc.id === id) || null;
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

  async createBrdVersion(data: any): Promise<any> {
    const id = this.nextBrdVersionId++;
    const version = {
      id,
      ...data,
      createdAt: new Date()
    };
    this.brdVersions.push(version);
    return version;
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

  // Initialize default data for roles and permissions if needed
  private roles: Role[] = [];
  private permissions: Permission[] = [];
  private userProjects: UserProject[] = [];
  private markers: Marker[] = [];
  private requestFormTypes: RequestFormType[] = [];
  private requestForms: RequestForm[] = [];
  private requestComments: RequestComment[] = [];
  private chatMessages: ChatMessage[] = [];
  private todos: Todo[] = [];
  private todoLists: TodoList[] = [];
  private timeSheetFolders: TimeSheetFolder[] = [];
  private timeSheets: TimeSheet[] = [];
  private githubConfigs: GitHubConfig[] = [];
  private notebooks: Notebook[] = [];

  // Initialize data property for compatibility
  private data: any = {
    todoLists: [],
    flowDiagrams: [], // Added for flow diagram storage
    testCases: [], // Added to ensure testCases array is available in data
  };

  // Enhanced Chat and Messaging methods
  private conversations = new Map<number, any>();
  private chatMessages = new Map<number, any>(); // Use Map for better indexing
  private messageReactions = new Map<number, any[]>();
  private messageThreads = new Map<number, number[]>();
  private conversationMembers = new Map<number, Set<number>>();
  private messageReadStatus = new Map<string, Set<number>>(); // messageId-userId -> Set<userId>
  private conversationMessages = new Map<number, any[]>(); // conversationId -> messages array

  // Todo management - using proper Maps
  private todoListsMap = new Map<number, any>();
  private todosMap = new Map<number, any>();

  // Employee Management
  private employees: any[] = [];
  private employeeProjects: any[] = [];
  private technologyOptions: any[] = [];
  private departmentOptions: any[] = [];
  private navadhitiProjects: any[] = [];
  private statusReviews = new Map<number, any>();
  private employeeProjectHistory: any[] = []; // Added for storing history

  // Request Forms Module Maps
  private requestFormTypes: any[] = [];
  private requestFormOptions: any[] = [];
  private resourceRequests: any[] = [];
  private requestExtensions: any[] = [];
  private requestComments: any[] = [];
  private notifications = new Map<number, any>();

  // Flow diagram storage
  private flowDiagrams = new Map<string, any>();

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
    return this.modules.filter(module => module.projectId === projectId);
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
    const results = this.testCases.filter(tc => tc.projectId === projectId && tc.isDeleted !== true);
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

  async deleteTestCase(id: number): Promise<boolean> {
    const index = this.testCases.findIndex(testCase => testCase.id === id);
    if (index === -1) return false;

    console.log(`Storage: Soft deleting test case ID ${id} (${this.testCases[index].testCaseId})`);

    // Soft delete - mark as deleted instead of removing
    const deletedTestCase: TestCase = {
      ...this.testCases[index],
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: 1, // Should be current user ID
      updatedAt: new Date()
    };

    this.testCases[index] = deletedTestCase;
    this.recordActivity('test_case', 'deleted', id, this.testCases[index].assignedTo || 1);

    console.log(`Storage: Test case soft deleted. ID: ${this.testCases[index].testCaseId}`);

    return true;
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
    const results = this.bugs.filter(bug => bug.projectId === projectId);
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
      id
    };

    this.customMarkers.push(marker);
    return marker;
  }

  async getCustomMarkers(): Promise<CustomMarker[]> {
    return [...this.customMarkers];
  }

  async updateCustomMarker(id: number, data: Partial<CustomMarker>): Promise<CustomMarker | null> {
    const index = this.customMarkers.findIndex(marker => marker.id === id);
    if (index === -1) return null;

    const updatedMarker = { ...this.customMarkers[index], ...data };
    this.customMarkers[index] = updatedMarker;
    return updatedMarker;
  }

  async deleteCustomMarker(id: number): Promise<boolean> {
    const initialLength = this.customMarkers.length;
    this.customMarkers = this.customMarkers.filter(marker => marker.id !== id);
    return this.customMarkers.length < initialLength;
  }

  // Matrix operations
  async createMatrixCell(data: Omit<MatrixCell, 'id'>): Promise<MatrixCell> {
    const id = this.getNextId();

    const cell: MatrixCell = {
      ...data,
      id
    };

    this.matrixCells.push(cell);
    return cell;
  }

  async getMatrixCells(): Promise<MatrixCell[]> {
    return [...this.matrixCells];
  }

  async updateMatrixCell(id: number, data: Partial<MatrixCell>): Promise<MatrixCell | null> {
    const index = this.matrixCells.findIndex(cell => cell.id === id);
    if (index === -1) return null;

    const updatedCell = { ...this.matrixCells[index], ...data };
    this.matrixCells[index] = updatedCell;
    return updatedCell;
  }

  async deleteMatrixCell(id: number): Promise<boolean> {
    const initialLength = this.matrixCells.length;
    this.matrixCells = this.matrixCells.filter(cell => cell.id !== id);
    return this.matrixCells.length < initialLength;
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

  // Flow Diagrams methods (placeholder)
  async getFlowDiagramsByProject(projectId: string): Promise<any[]> {
    return this.data.flowDiagrams.filter(diagram => diagram.projectId === parseInt(projectId));
  }

  async getFlowDiagram(id: string): Promise<any | null> {
    return this.data.flowDiagrams.find(diagram => diagram.id === parseInt(id));
  }

  async createFlowDiagram(diagramData: any): Promise<any> {
    const diagram = {
      id: Date.now(),
      ...diagramData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.flowDiagrams.push(diagram);
    this.saveData();
    return diagram;
  }

  async updateFlowDiagram(id: string, updates: any): Promise<any> {
    const index = this.data.flowDiagrams.findIndex(diagram => diagram.id === parseInt(id));
    if (index === -1) return null;

    this.data.flowDiagrams[index] = {
      ...this.data.flowDiagrams[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.flowDiagrams[index];
  }

  async deleteFlowDiagram(id: string): Promise<boolean> {
    const index = this.data.flowDiagrams.findIndex(diagram => diagram.id === parseInt(id));
    if (index === -1) return false;

    this.data.flowDiagrams.splice(index, 1);
    this.saveData();
    return true;
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
    const totalProjects = this.projects.length;
    const totalTestCases = this.testCases.length;
    const totalUsers = this.users.length;

    // Real-time test case status counts
    const testCases = [...this.testCases];
    const testCaseStatusCounts: TestCaseStatusCounts = {
      passed: testCases.filter(tc => tc.status === 'Pass').length,
      failed: testCases.filter(tc => tc.status === 'Fail').length,
      blocked: testCases.filter(tc => tc.status === 'Blocked').length,
      notExecuted: testCases.filter(tc => tc.status === 'Not Executed' || !tc.status).length    };

    // Real-time bug status counts
    const bugs = [...this.bugs];
    const bugStatusCounts: BugStatusCounts = {
      open: bugs.filter(bug => bug.status === 'Open').length,
      inProgress: bugs.filter(bug => bug.status === 'In Progress').length,
      resolved: bugs.filter(bug => bug.status === 'Resolved').length,
      closed: bugs.filter(bug => bug.status === 'Closed').length,
      critical: bugs.filter(bug => bug.severity === 'Critical').length,
      major: bugs.filter(bug => bug.severity === 'Major').length,
      minor: bugs.filter(bug => bug.severity === 'Minor').length
    };

    const openBugs = bugStatusCounts.open + bugStatusCounts.inProgress;
    const passRate = totalTestCases > 0 ? Math.round((testCaseStatusCounts.passed / totalTestCases) * 100) : 0;

    return {
      totalProjects,
      totalTestCases,
      openBugs,
      passRate,
      totalUsers,
      testCaseStatusCounts,
      bugStatusCounts
    };
  }

  // Document operations (re-declared, ensure consistency)
  async getDocuments(): Promise<Document[]> {
    return [...this.documents];
  }

  async getDocumentFolders(): Promise<DocumentFolder[]> {
    return [...this.documentFolders];
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

    const updatedTimeSheet = { ...this.timeSheets[index], ...timeSheetData, updatedAt: new Date() };
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
    return this.timeSheetFolders.length < initialLength;
  }

  async approveTimeSheet(id: number, approverId: number): Promise<TimeSheet | undefined> {
    const index = this.timeSheets.findIndex(ts => ts.id === id);
    if (index === -1) {
      console.error(`Storage: Timesheet ${id} not found for approval`);
      return undefined;
    }

    const approvedTimeSheet: TimeSheet = {
      ...this.timeSheets[index],
      status: "Approved",
      approvedById: approverId,
      approvalDate: new Date(),
      updatedAt: new Date()
    };
    this.timeSheets[index] = approvedTimeSheet;

    console.log(`Storage: Approved timesheet ${id} by user ${approverId}`, approvedTimeSheet);
    return approvedTimeSheet;
  }

  async rejectTimeSheet(id: number, approverId: number, reason: string): Promise<TimeSheet | undefined> {
    const index = this.timeSheets.findIndex(ts => ts.id === id);
    if (index === -1) {
      console.error(`Storage: Timesheet ${id} not found for rejection`);
      return undefined;
    }

    const rejectedTimeSheet: TimeSheet = {
      ...this.timeSheets[index],
      status: "Rejected",
      approvedById: approverId,
      approvalDate: new Date(),
      comments: reason,
      updatedAt: new Date()
    };
    this.timeSheets[index] = rejectedTimeSheet;

    console.log(`Storage: Rejected timesheet ${id} by user ${approverId} with reason: ${reason}`, rejectedTimeSheet);
    return rejectedTimeSheet;
  }

  // TimeSheet Folder operations
  async getTimeSheetFolders(): Promise<TimeSheetFolder[]> {
    return [...this.timeSheetFolders];
  }

  async getTimeSheetFolder(id: number): Promise<TimeSheetFolder | undefined> {
    return this.timeSheetFolders.find(folder => folder.id === id);
  }

  async createTimeSheetFolder(folder: InsertTimeSheetFolder): Promise<TimeSheetFolder> {
    const newFolder: TimeSheetFolder = {
      id: this.getNextId(),
      name: folder.name,
      userId: folder.userId,
      parentId: folder.parentId || null,
      path: folder.path,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.timeSheetFolders.push(newFolder);
    return newFolder;
  }

  async updateTimeSheetFolder(id: number, folderData: Partial<TimeSheetFolder>): Promise<TimeSheetFolder | undefined> {
    const index = this.timeSheetFolders.findIndex(folder => folder.id === id);
    if (index === -1) return undefined;

    const updatedFolder = { ...this.timeSheetFolders[index], ...folderData, updatedAt: new Date() };
    this.timeSheetFolders[index] = updatedFolder;
    return updatedFolder;
  }

  async deleteTimeSheetFolder(id: number): Promise<boolean> {
    const initialLength = this.timeSheetFolders.length;
    this.timeSheetFolders = this.timeSheetFolders.filter(folder => folder.id !== id);
    return this.timeSheetFolders.length < initialLength;
  }

  async getTimeSheetsByFolder(folderId: number): Promise<TimeSheet[]> {
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
    // For now, return empty matrix data
    // This should be implemented to fetch actual matrix data from storage
    return {};
  }

  async saveTraceabilityMatrix(projectId: number, matrixData: any[]): Promise<any> {
    try {
      // Store matrix data in memory (extend this for persistent storage)
      const key = `matrix_${projectId}`;

      // Convert array to object format for storage
      const matrixMap: Record<string, number> = {};
      matrixData.forEach(item => {
        const key = `${item.fromModuleId}-${item.toModuleId}`;
        matrixMap[key] = item.markerId;
      });

      // Store in a simple map for now
      if (!this.traceabilityMatrixes) {
        this.traceabilityMatrixes = []; // Initialize as array
      }

      // Find if matrix for this project already exists
      const existingMatrixIndex = this.traceabilityMatrixes.findIndex(m => m.projectId === projectId);

      if (existingMatrixIndex !== -1) {
        // Update existing matrix
        this.traceabilityMatrixes[existingMatrixIndex] = {
          ...this.traceabilityMatrixes[existingMatrixIndex],
          matrixData: matrixMap, // Assuming matrixData holds the relationships
          updatedAt: new Date().toISOString()
        };
      } else {
        // Create new matrix entry
        const newMatrixEntry = {
          id: this.getNextId(),
          projectId: projectId,
          matrixData: matrixMap,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.traceabilityMatrixes.push(newMatrixEntry);
      }

      console.log(`Storage: saveTraceabilityMatrix(${projectId}) saved ${matrixData.length} relationships`);
      return matrixMap;
    } catch (error) {
      console.error("Error saving traceability matrix:", error);
      throw error;
    }
  }

  async getTraceabilityMatrixById(id: number): Promise<any | undefined> {
    return this.traceabilityMatrixes.find(m => m.id === id);
  }

  async createTraceabilityMatrix(matrix: any): Promise<any> {
    const newMatrix = {
      id: this.getNextId(),
      ...matrix,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
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
    return []; // Placeholder for now
  }

  async getTraceabilityMarker(id: number): Promise<any | undefined> {
    return undefined; // Placeholder for now
  }

  async createTraceabilityMarker(marker: any): Promise<any> {
    return marker; // Placeholder for now
  }

  async updateTraceabilityMarker(id: number, marker: any): Promise<any> {
    return marker; // Placeholder for now
  }

  async deleteTraceabilityMarker(id: number): Promise<boolean> {
    return true; // Placeholder for now
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
    return this.notebooks.filter(notebook => notebook.userId === userId);
  }

  async getNotebook(id: number, userId: number): Promise<Notebook | null> {
    const notebook = this.notebooks.find(n => n.id === id && n.userId === userId);
    return notebook || null;
  }

  async createNotebook(notebookData: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notebook> {
    const id = this.getNextId();
    const now = new Date();

    const notebook: Notebook = {
      id,
      ...notebookData,
      createdAt: now,
      updatedAt: now
    };

    this.notebooks.push(notebook);
    return notebook;
  }

  async updateNotebook(id: number, userId: number, updates: Partial<Notebook>): Promise<Notebook | null> {
    const index = this.notebooks.findIndex(n => n.id === id && n.userId === userId);
    if (index === -1) return null;

    const updatedNotebook = {
      ...this.notebooks[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notebooks[index] = updatedNotebook;
    return updatedNotebook;
  }

  async deleteNotebook(id: number, userId: number): Promise<boolean> {
    const initialLength = this.notebooks.length;
    this.notebooks = this.notebooks.filter(n => !(n.id === id && n.userId === userId));
    return this.notebooks.length < initialLength;
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

    // Initialize todoLists if it doesn't exist
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

    // Get extension history records for this employee
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
      console.log('Created history record for extension:', historyRecord);
      console.log('Total history records:', this.employeeProjectHistory.length);

      // Now update the allocation with new end date
      const updatedAllocation = {
        ...allocation,
        endDate: newEndDate,
        updatedAt: new Date().toISOString()
      };

      this.employeeProjects[allocationIndex] = updatedAllocation;
      console.log('Updated allocation with new end date:', updatedAllocation);

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
    return this.brdDocuments.find(doc => doc.id === id) || null;
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

  async createBrdVersion(data: any): Promise<any> {
    const id = this.nextBrdVersionId++;
    const version = {
      id,
      ...data,
      createdAt: new Date()
    };
    this.brdVersions.push(version);
    return version;
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
}

// Export storage and class
export const storage = new MemStorage();

export { MemStorage };