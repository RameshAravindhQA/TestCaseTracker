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
  InsertTestingType,
  TestingTypeField,
  InsertTestingTypeField,
} from "@shared/schema";

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
  getTestCase(id: number): Promise<TestCase | undefined>;
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  updateTestCase(id: number, testCaseData: Partial<TestCase>): Promise<TestCase | undefined>;
  deleteTestCase(id: number): Promise<boolean>;

  // Bug operations
  getBugs(): Promise<Bug[]>;
  getBugsByProject(projectId: number): Promise<Bug[]>;
  getBug(id: number): Promise<Bug | undefined>;
  createBug(bug: InsertBug): Promise<Bug>;
  updateBug(id: number, bugData: Partial<Bug>): Promise<Bug | undefined>;
  deleteBug(id: number): Promise<boolean>;

  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocumentsByProject(projectId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Document folder operations
  getDocumentFolders(): Promise<DocumentFolder[]>;
  getDocumentFoldersByProject(projectId: number): Promise<DocumentFolder[]>;
  getDocumentFolder(id: number): Promise<DocumentFolder | undefined>;
  createDocumentFolder(folder: InsertDocumentFolder): Promise<DocumentFolder>;
  updateDocumentFolder(id: number, folderData: Partial<DocumentFolder>): Promise<DocumentFolder | undefined>;
  deleteDocumentFolder(id: number): Promise<boolean>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Tag operations
  getTags(): Promise<Tag[]>;
  getTagsByProject(projectId: number): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tagData: Partial<Tag>): Promise<Tag | undefined>;
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
  updateCustomMarker(id: number, markerData: Partial<CustomMarker>): Promise<CustomMarker | undefined>;
  deleteCustomMarker(id: number): Promise<boolean>;

  getMatrixCells(): Promise<MatrixCell[]>;
  getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]>;
  getMatrixCell(id: number): Promise<MatrixCell | undefined>;
  getMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<MatrixCell | undefined>;
  createMatrixCell(cell: InsertMatrixCell): Promise<MatrixCell>;
  updateMatrixCell(id: number, cellData: Partial<MatrixCell>): Promise<MatrixCell | undefined>;
  deleteMatrixCell(id: number): Promise<boolean>;
  deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<boolean>;

  // Test Sheet operations
  getTestSheets(projectId?: number): Promise<TestSheet[]>;
  getTestSheet(id: number): Promise<TestSheet | undefined>;
  createTestSheet(sheet: InsertTestSheet): Promise<TestSheet>;
  updateTestSheet(id: number, sheetData: Partial<TestSheet>): Promise<TestSheet | undefined>;
  deleteTestSheet(id: number): Promise<boolean>;

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
  createChatMessage(message: any): Promise<any>;
  getChatMessages(projectId: number, limit?: number): Promise<any[]>;
  updateChatMessage(messageId: number, userId: number, updates: any): Promise<any | null>;

  // Comment operations
  getBugComment(commentId: number): Promise<any>;
  updateComment(commentId: number, updates: any): Promise<any>;

    // Traceability Matrix operations
  getTraceabilityMatrix(projectId: number): Promise<any>;
  saveTraceabilityMatrix(projectId: number, matrixData: any[]): Promise<any>;

  // Enhanced Chat and Messaging methods
  getUserConversations(userId: number): Promise<any[]>;
  getDirectConversation(userId1: number, userId2: number): Promise<any | null>;
  createConversation(data: any): Promise<any>;
  getConversation(id: string): Promise<any | null>;
  getMessagesByChat(chatId: number): Promise<any[]>;
  addParticipantToConversation(conversationId: string, userId: number): Promise<boolean>;
  removeParticipantFromConversation(conversationId: string, userId: number): Promise<boolean>;
  updateConversation(id: string, updates: any): Promise<any | null>;
  deleteConversation(id: string): Promise<boolean>;
  addConversationMember(conversationId: string, userId: number): Promise<boolean>;
  removeConversationMember(conversationId: string, userId: number): Promise<boolean>;
  getConversationMembers(conversationId: string): Promise<any[]>;
  createChatMessage(messageData: any): Promise<any>;
  getChatMessages(conversationId: number, limit?: number, offset?: number): Promise<any[]>;
  getChatMessage(id: string): Promise<any | null>;
  updateChatMessage(id: string, userId: number, updates: any): Promise<any | null>;
  deleteChatMessage(id: string, userId: number): Promise<boolean>;
  addMessageReaction(messageId: string, userId: number, emoji: string): Promise<any | null>;
  getMessageThread(parentMessageId: string): Promise<any[]>;
  markMessageAsRead(messageId: string, userId: number): Promise<void>;
  markConversationAsRead(conversationId: string, userId: number): Promise<void>;
  getUnreadCountForUser(conversationId: string, userId: number): Promise<number>;

  // OnlyOffice Documents
  getOnlyOfficeDocuments(projectId?: number): Promise<any[]>;
  getOnlyOfficeDocument(id: string): Promise<any | null>;
  createOnlyOfficeDocument(data: any): Promise<any>;
  updateOnlyOfficeDocument(id: string, updates: any): Promise<any | null>;
  deleteOnlyOfficeDocument(id: string): Promise<boolean>;
  searchMessages(query: string, conversationId?: number, userId?: number): Promise<any[]>;
  getUserConversations(userId: number): Promise<any[]>;
  getMessagesByChat(chatId: number): Promise<any[]>;
  createMessage(messageData: any): Promise<any>;
  createConversation(conversationData: any): Promise<any>;
}

/**
 * In-memory storage implementation for development and testing
 */
class MemStorage implements IStorage {
  // In-memory storage for different entity types using Maps
  private projects = new Map<number, any>();
  private users = new Map<number, any>();
  private modules = new Map<number, any>();
  private testCases = new Map<number, any>();
  private bugs = new Map<number, any>();
  private activities = new Map<number, any>();
  private tags = new Map<number, any>();
  private documents = new Map<number, any>();
  private documentFolders = new Map<number, any>();
  private testSheets = new Map<number, any>();
  private todos = new Map<number, any>();
  private todoLists = new Map<number, any>();
  private customers = new Map<number, any>();
  private customerProjects = new Map<number, any>();
  private timeSheets = new Map<number, any>();
  private timeSheetFolders = new Map<number, any>();
  private customMarkers = new Map<string, any>();
  private matrixCells = new Map<string, any>();
  private notebooks = new Map<number, any>();
  private notebooksData = { notebooks: [] as any[] };
  private githubConfigs: any[] = [];
  private githubIssues: any[] = [];
  private messages: any[] = [];
  private projectMembers = new Map<number, any>();
  private sprints = new Map<number, any>();
  private kanbanColumns: Map<number, any> = new Map();
  private kanbanCards: Map<number, any> = new Map();
  private traceabilityMatrixes: Map<number, any> = new Map();

  // Initialize conversations as an array
  private conversations: Map<number, any> = new Map();
  private chatMessages = new Map<number, any>();
  private messageReactions = new Map<number, any[]>();
  private messageThreads = new Map<number, number[]>();
  private conversationMembers = new Map<number, Set<number>>();
  private messageReadStatus = new Map<string, Set<number>>(); // messageId-userId -> Set<userId>

  private nextId = 1;
  private testSheetIdCounter = 1;

  private getNextId(): number {
    return this.nextId++;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const existingIds = Array.from(this.users.keys());
    const id = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const user: User = {
      id: id,
      ...insertUser,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const existingIds = Array.from(this.projects.keys());
    const id = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const project: Project = {
      id: id,
      ...insertProject,
      createdAt: new Date(),
    };
    this.projects.set(project.id, project);
    return project;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = { ...project, ...projectData };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Module operations
  async getModules(): Promise<Module[]> {
    return Array.from(this.modules.values());
  }

  async getModulesByProject(projectId: number): Promise<Module[]> {
    return Array.from(this.modules.values()).filter(module => module.projectId === projectId);
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async createModule(moduleData: InsertModule): Promise<Module> {
    const id = this.getNextId();

    console.log('Creating module with ID:', id, 'Data:', moduleData);

    // Auto-generate module ID if not provided
    let moduleId = moduleData.moduleId;
    if (!moduleId || moduleId.trim() === '') {
      // Get the project to access its details
      const project = this.projects.get(moduleData.projectId);
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
      const projectModules = Array.from(this.modules.values())
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

    this.modules.set(id, module);

    console.log('Module stored, total modules:', this.modules.size);

    return module;
  }

  async updateModule(id: number, moduleData: Partial<Module>): Promise<Module | undefined> {
    const module = this.modules.get(id);
    if (!module) return undefined;

    const updatedModule = { ...module, ...moduleData };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }

  async deleteModule(id: number): Promise<boolean> {
    return this.modules.delete(id);
  }

  // Test case operations
  async getTestCases(): Promise<TestCase[]> {
    return Array.from(this.testCases.values());
  }

  async getTestCasesByFilters(projectId?: number, moduleId?: number): Promise<TestCase[]> {
    let results = Array.from(this.testCases.values());

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
    const results = Array.from(this.testCases.values()).filter(tc => tc.projectId === projectId);
    console.log(`Storage: getTestCasesByProject(${projectId}) returning ${results.length} test cases:`, 
      results.map(tc => ({ id: tc.id, testCaseId: tc.testCaseId, projectId: tc.projectId })));
    return results;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.testCases.get(id);
  }

  async createTestCase(insertTestCase: InsertTestCase): Promise<TestCase> {
    const id = this.getNextId();
    const now = new Date();

    // Auto-generate test case ID if not provided
    let testCaseId = insertTestCase.testCaseId;
    if (!testCaseId || testCaseId.trim() === '') {
      // Get the module and project to build the test case ID
      const module = this.modules.get(insertTestCase.moduleId);
      const project = this.projects.get(insertTestCase.projectId);

      if (!module || !project) {
        throw new Error(`Module or Project not found`);
      }

      const projectPrefix = project.prefix || 'DEF';

      // Get module name prefix (first 3 letters of module name)
      let modulePrefix = 'MOD';
      if (module.name) {
        const cleanModuleName = module.name.replace(/[^a-zA-Z]/g, '');
        modulePrefix = cleanModuleName.substring(0, 3).toUpperCase();
        if (modulePrefix.length < 3) {
          modulePrefix = modulePrefix.padEnd(3, 'X');
        }
      }

      // Find the highest existing test case number for this project and module with the same prefix
      const prefixPattern = new RegExp(`^${projectPrefix}-${modulePrefix}-TC-(\\d+)$`);
      const existingTestCases = Array.from(this.testCases.values())
        .filter(tc => tc.moduleId === insertTestCase.moduleId && tc.projectId === insertTestCase.projectId)
        .map(tc => tc.testCaseId)
        .filter(id => id && prefixPattern.test(id))
        .map(id => {
          const match = id.match(prefixPattern);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      const nextNumber = existingTestCases.length > 0 ? Math.max(...existingTestCases) + 1 : 1;
      testCaseId = `${projectPrefix}-${modulePrefix}-TC-${String(nextNumber).padStart(3, '0')}`;
    }

    const testCase: TestCase = {
      ...insertTestCase,
      id,
      testCaseId,
      createdAt: now,
      updatedAt: now
    };

    this.testCases.set(id, testCase);
    this.recordActivity('test_case', 'created', testCase.id, insertTestCase.createdById);
    return testCase;
  }

  async updateTestCase(id: number, data: Partial<TestCase>): Promise<TestCase | null> {
    const testCase = this.testCases.get(id);
    if (!testCase) return null;

    const updatedTestCase = { 
      ...testCase, 
      ...data, 
      updatedAt: new Date() 
    };

    // Force immediate persistence
    this.testCases.set(id, updatedTestCase);

    // Log activity for status changes specifically
    if (data.status && data.status !== testCase.status) {
      this.recordActivity('test_case', `status_changed_to_${data.status}`, id, data.assignedTo || testCase.assignedTo || 1);
    } else {
      this.recordActivity('test_case', 'updated', id, data.assignedTo || testCase.assignedTo || 1);
    }

    return updatedTestCase;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    const testCase = this.testCases.get(id);
    if (!testCase) return false;

    this.testCases.delete(id);
    this.recordActivity('test_case', 'deleted', id, testCase.assignedTo || 1);
    return true;
  }

  // Bug operations
  async createBug(insertBug: InsertBug): Promise<Bug> {
    const id = this.getNextId();
    const now = new Date();

    // Auto-generate bug ID if not provided
    let bugId = insertBug.bugId;
    if (!bugId || bugId.trim() === '') {
      // Find the highest existing bug number
      const existingBugs = Array.from(this.bugs.values())
        .map(bug => bug.bugId)
        .filter(id => id && id.match(/^BUG-(\\d+)$/))
        .map(id => parseInt(id.replace('BUG-', ''), 10))
        .filter(num => !isNaN(num));

      const nextNumber = existingBugs.length > 0 ? Math.max(...existingBugs) + 1 : 1;
      bugId = `BUG-${String(nextNumber).padStart(3, '0')}`;
    }

    const bug: Bug = {
      ...insertBug,
      id,
      bugId,
      createdAt: now,
      updatedAt: now
    };

    this.bugs.set(id, bug);
    this.recordActivity('bug', 'created', bug.id, insertBug.reportedById);
    return bug;
  }

  async getBugs(projectId?: number, moduleId?: number): Promise<Bug[]> {
    let results = Array.from(this.bugs.values());

    if (projectId) {
      results = results.filter(bug => bug.projectId === projectId);
    }

    if (moduleId) {
      results = results.filter(bug => bug.moduleId === moduleId);
    }

    console.log(`Storage: getBugs(${projectId}, ${moduleId}) returning ${results.length} bugs`);
    return results;
  }

  async getBugsByProject(projectId: number): Promise<Bug[]> {
    const results = Array.from(this.bugs.values()).filter(bug => bug.projectId === projectId);
    console.log(`Storage: getBugsByProject(${projectId}) returning ${results.length} bugs`);
    return results;
  }

  async getBug(id: number): Promise<Bug | undefined> {
    return this.bugs.get(id);
  }

  async getBugsWithFilters(filters?: { projectId?: number; status?: string; severity?: string }): Promise<Bug[]> {
    let bugs = Array.from(this.bugs.values());

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
    return this.bugs.get(id) || null;
  }

  async updateBug(id: number, data: Partial<Bug>): Promise<Bug | null> {
    const bug = this.bugs.get(id);
    if (!bug) return null;

    const updatedBug = { 
      ...bug, 
      ...data, 
      updatedAt: new Date() 
    };

    // Force immediate persistence
    this.bugs.set(id, updatedBug);

    // Log activity for status and severity changes specifically
    if (data.status && data.status !== bug.status) {
      this.recordActivity('bug', `status_changed_to_${data.status}`, id, data.assignedTo || bug.assignedTo);
    } else if (data.severity && data.severity !== bug.severity) {
      this.recordActivity('bug', `severity_changed_to_${data.severity}`, id, data.assignedTo || bug.assignedTo);
    } else {
      this.recordActivity('bug', 'updated', id, data.assignedTo || bug.assignedTo);
    }

    return updatedBug;
  }

  async deleteBug(id: number): Promise<boolean> {
    const bug = this.bugs.get(id);
    if (!bug) return false;

    this.bugs.delete(id);
    this.recordActivity('bug', 'deleted', id, bug.assignedTo);
    return true;
  }

  // Document operations
  async createDocument(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    const id = this.nextId++;
    const now = new Date();

    const document: Document = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.documents.set(id, document);
    this.recordActivity('document', 'created', document.id, data.uploadedBy);
    return document;
  }

  async getDocuments(folderId?: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.folderId === folderId);
  }

  async getDocumentById(id: number): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async updateDocument(id: number, data: Partial<Document>): Promise<Document | null> {
    const document = this.documents.get(id);
    if (!document) return null;

    const updatedDocument = { ...document, ...data, updatedAt: new Date() };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const document = this.documents.get(id);
    if (!document) return false;

    this.documents.delete(id);
    this.recordActivity('document', 'deleted', id, document.uploadedBy);
    return true;
  }

  // Document folder operations
  async createDocumentFolder(data: Omit<DocumentFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentFolder> {
    const id = this.nextId++;
    const now = new Date();

    const folder: DocumentFolder = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.documentFolders.set(id, folder);
    return folder;
  }

  async getDocumentFolders(parentId?: number): Promise<DocumentFolder[]> {
    return Array.from(this.documentFolders.values()).filter(folder => folder.parentId === parentId);
  }

  async getDocumentFolderById(id: number): Promise<DocumentFolder | null> {
    return this.documentFolders.get(id) || null;
  }

  async updateDocumentFolder(id: number, data: Partial<DocumentFolder>): Promise<DocumentFolder | null> {
    const folder = this.documentFolders.get(id);
    if (!folder) return null;

    const updatedFolder = { ...folder, ...data, updatedAt: new Date() };
    this.documentFolders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteDocumentFolder(id: number): Promise<boolean> {
    const folder = this.documentFolders.get(id);
    if (!folder) return false;

    // Also delete all documents in this folder
    const documentsInFolder = Array.from(this.documents.values()).filter(doc => doc.folderId === id);
    documentsInFolder.forEach(doc => this.documents.delete(doc.id));

    // Delete all subfolders
    const subfolders = Array.from(this.documentFolders.values()).filter(f => f.parentId === id);
    subfolders.forEach(subfolder => this.deleteDocumentFolder(subfolder.id));

    this.documentFolders.delete(id);
    return true;
  }

  // Customer operations
  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const id = this.nextId++;
    const now = new Date();

    const customer: Customer = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.customers.set(id, customer);
    return customer;
  }  
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...customerData, updatedAt: new Date() };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Tag operations
  async createTag(data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
    const id = this.nextId++;
    const now = new Date();

    const tag: Tag = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.tags.set(id, tag);
    return tag;
  }

  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTagsByProject(projectId: number): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(tag => tag.projectId === projectId);
  }

  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async updateTag(id: number, tagData: Partial<Tag>): Promise<Tag | undefined> {
    const tag = this.tags.get(id);
    if (!tag) return undefined;

    const updatedTag = { ...tag, ...tagData, updatedAt: new Date() };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }

  async deleteTag(id: number): Promise<boolean> {
    return this.tags.delete(id);
  }

  // Kanban operations
  async createKanbanColumn(data: Omit<KanbanColumn, 'id' | 'createdAt' | 'updatedAt'>): Promise<KanbanColumn> {
    const id = this.nextId++;
    const now = new Date();

    const column: KanbanColumn = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.kanbanColumns.set(id, column);
    return column;
  }

  async getKanbanColumns(): Promise<KanbanColumn[]> {
    return Array.from(this.kanbanColumns.values());
  }

  async getKanbanColumnsByProject(projectId: number): Promise<KanbanColumn[]> {
    return Array.from(this.kanbanColumns.values()).filter(column => column.projectId === projectId);
  }

  async getKanbanColumn(id: number): Promise<KanbanColumn | undefined> {
    return this.kanbanColumns.get(id);
  }

  async updateKanbanColumn(id: number, columnData: Partial<KanbanColumn>): Promise<KanbanColumn | undefined> {
    const column = this.kanbanColumns.get(id);
    if (!column) return undefined;

    const updatedColumn = { ...column, ...columnData, updatedAt: new Date() };
    this.kanbanColumns.set(id, updatedColumn);
    return updatedColumn;
  }

  async deleteKanbanColumn(id: number): Promise<boolean> {
    return this.kanbanColumns.delete(id);
  }

  async createKanbanCard(data: Omit<KanbanCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<KanbanCard> {
    const id = this.nextId++;
    const now = new Date();

    const card: KanbanCard = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.kanbanCards.set(id, card);
    return card;
  }

  async getKanbanCards(): Promise<KanbanCard[]> {
    return Array.from(this.kanbanCards.values());
  }

  async getKanbanCardsByColumn(columnId: number): Promise<KanbanCard[]> {
    return Array.from(this.kanbanCards.values()).filter(card => card.columnId === columnId);
  }

  async getKanbanCard(id: number): Promise<KanbanCard | undefined> {
    return this.kanbanCards.get(id);
  }

  async updateKanbanCard(id: number, cardData: Partial<KanbanCard>): Promise<KanbanCard | undefined> {
    const card = this.kanbanCards.get(id);
    if (!card) return undefined;

    const updatedCard = { ...card, ...cardData, updatedAt: new Date() };
    this.kanbanCards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteKanbanCard(id: number): Promise<boolean> {
    return this.kanbanCards.delete(id);
  }

  // Matrix operations
  async getCustomMarkers(): Promise<CustomMarker[]> {
    return Array.from(this.customMarkers.values());
  }

  async getCustomMarkersByProject(projectId: number): Promise<CustomMarker[]> {
    return Array.from(this.customMarkers.values()).filter(marker => marker.projectId === projectId);
  }

  async getCustomMarker(id: number): Promise<CustomMarker | undefined> {
    return this.customMarkers.get(id);
  }

  async createCustomMarker(marker: InsertCustomMarker): Promise<CustomMarker> {
    const id = this.nextId++;
    const now = new Date();

    const customMarker: CustomMarker = {
      ...marker,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.customMarkers.set(id, customMarker);
    return customMarker;
  }

  async updateCustomMarker(id: number, markerData: Partial<CustomMarker>): Promise<CustomMarker | undefined> {
    const marker = this.customMarkers.get(id);
    if (!marker) return undefined;

    const updatedMarker = { ...marker, ...markerData, updatedAt: new Date() };
    this.customMarkers.set(id, updatedMarker);
    return updatedMarker;
  }

  async deleteCustomMarker(id: number): Promise<boolean> {
    return this.customMarkers.delete(id);
  }

  async getMatrixCells(): Promise<MatrixCell[]> {
    return Array.from(this.matrixCells.values());
  }

  async getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]> {
    return Array.from(this.matrixCells.values()).filter(cell => cell.projectId === projectId);
  }

  async getMatrixCell(id: number): Promise<MatrixCell | undefined> {
    return this.matrixCells.get(id);
  }

  async getMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<MatrixCell | undefined> {
    const key = `${rowModuleId}-${colModuleId}-${projectId}`;
    return this.matrixCells.get(key);
  }

  async createMatrixCell(cell: InsertMatrixCell): Promise<MatrixCell> {
    const id = this.nextId++;
    const now = new Date();

    const matrixCell: MatrixCell = {
      ...cell,
      id,
      createdAt: now,
      updatedAt: now
    };

    const key = `${cell.rowModuleId}-${cell.colModuleId}-${cell.projectId}`;
    this.matrixCells.set(key, matrixCell);
    return matrixCell;
  }

  async updateMatrixCell(id: number, cellData: Partial<MatrixCell>): Promise<MatrixCell | undefined> {
    const cell = this.matrixCells.get(id);
    if (!cell) return undefined;

    const updatedCell = { ...cell, ...cellData, updatedAt: new Date() };
    this.matrixCells.set(id, updatedCell);
    return updatedCell;
  }

  async deleteMatrixCell(id: number): Promise<boolean> {
    return this.matrixCells.delete(id);
  }

  async deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<boolean> {
    const key = `${rowModuleId}-${colModuleId}-${projectId}`;
    return this.matrixCells.delete(key);
  }

  // Test Sheet operations
  async getTestSheets(projectId?: number): Promise<TestSheet[]> {
    let sheets = Array.from(this.testSheets.values());
    if (projectId) {
      sheets = sheets.filter(sheet => sheet.projectId === projectId);
    }
    return sheets;
  }

  async getTestSheet(id: number): Promise<TestSheet | undefined> {
    return this.testSheets.get(id);
  }

  async createTestSheet(sheet: InsertTestSheet): Promise<TestSheet> {
    const id = this.testSheetIdCounter++;
    const now = new Date();
    const testSheet: TestSheet = {
      ...sheet,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.testSheets.set(id, testSheet);
    return testSheet;
  }

  async updateTestSheet(id: number, sheetData: Partial<TestSheet>): Promise<TestSheet | undefined> {
    const sheet = this.testSheets.get(id);
    if (!sheet) return undefined;

    const updatedSheet = { ...sheet, ...sheetData, updatedAt: new Date() };
    this.testSheets.set(id, updatedSheet);
    return updatedSheet;
  }

  async deleteTestSheet(id: number): Promise<boolean> {
    return this.testSheets.delete(id);
  }

  // GitHub Integration methods
  async getGitHubConfig(projectId: number): Promise<any | undefined> {
    return this.githubConfigs.find(config => config.projectId === projectId);
  }

  async createGitHubConfig(data: any): Promise<any> {
    const id = this.nextId++;
    const config = { ...data, id };
    this.githubConfigs.push(config);
    return config;
  }

  async updateGitHubConfig(id: number, data: any): Promise<any | null> {
    const configIndex = this.githubConfigs.findIndex(config => config.id === id);
    if (configIndex === -1) {
      return null;
    }
    this.githubConfigs[configIndex] = { ...this.githubConfigs[configIndex], ...data };
    return this.githubConfigs[configIndex];
  }

  async createGitHubIssue(data: any): Promise<any> {
    const id = this.nextId++;
    const issue = { ...data, id };
    this.githubIssues.push(issue);
    return issue;
  }

  async getGitHubIssue(id: number): Promise<any | undefined> {
    return this.githubIssues.find(issue => issue.id === id);
  }

  async getGitHubIssueByBugId(bugId: number): Promise<any | undefined> {
    return this.githubIssues.find(issue => issue.bugId === bugId);
  }

  async getGitHubIssueByGitHubId(githubId: number): Promise<any | undefined> {
    return this.githubIssues.find(issue => issue.githubId === githubId);
  }

  async updateGitHubIssue(id: number, data: any): Promise<any | null> {
    const issueIndex = this.githubIssues.findIndex(issue => issue.id === id);
    if (issueIndex === -1) {
      return null;
    }
    this.githubIssues[issueIndex] = { ...this.githubIssues[issueIndex], ...data };
    return this.githubIssues[issueIndex];
  }

    // Notebook operations
    async getNotebooks(userId: number): Promise<Notebook[]> {
        return this.notebooksData.notebooks.filter(notebook => notebook.userId === userId);
    }

    async getNotebook(id: number, userId: number): Promise<Notebook | null> {
        const notebook = this.notebooksData.notebooks.find(notebook => notebook.id === id && notebook.userId === userId);
        return notebook || null;
    }

    async createNotebook(notebookData: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notebook> {
        const newNotebook: Notebook = {
            ...notebookData,
            id: this.getNextId(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.notebooksData.notebooks.push(newNotebook);
        return newNotebook;
    }

    async updateNotebook(id: number, userId: number, updates: Partial<Notebook>): Promise<Notebook | null> {
        const notebookIndex = this.notebooksData.notebooks.findIndex(notebook => notebook.id === id && notebook.userId === userId);
        if (notebookIndex === -1) {
            return null;
        }
        this.notebooksData.notebooks[notebookIndex] = {
            ...this.notebooksData.notebooks[notebookIndex],
            ...updates,
            updatedAt: new Date()
        };
        return this.notebooksData.notebooks[notebookIndex];
    }

    async deleteNotebook(id: number, userId: number): Promise<boolean> {
        const initialLength = this.notebooksData.notebooks.length;
        this.notebooksData.notebooks = this.notebooksData.notebooks.filter(notebook => !(notebook.id === id && notebook.userId === userId));
        return this.notebooksData.notebooks.length !== initialLength;
    }

  // Chat operations
  async createChatMessage(message: any): Promise<any> {
    const id = this.nextId++;
    const now = new Date();
    const chatMessage = { ...message, id, createdAt: now };
    this.messages.push(chatMessage);
    return chatMessage;
  }

  async getChatMessages(projectId: number, limit?: number): Promise<any[]> {
    let messages = this.messages.filter(message => message.projectId === projectId);
    if (limit) {
      messages = messages.slice(0, limit);
    }
    return messages;
  }

  async updateChatMessage(messageId: number, userId: number, updates: any): Promise<any | null> {
    const messageIndex = this.messages.findIndex(message => message.id === messageId && message.userId === userId);
    if (messageIndex === -1) {
      return null;
    }
    this.messages[messageIndex] = { ...this.messages[messageIndex], ...updates };
    return this.messages[messageIndex];
  }

  // Comment operations
  async getBugComment(commentId: number): Promise<any> {
      return this.messages.find(message => message.id === commentId);
  }
  async updateComment(commentId: number, updates: any): Promise<any> {
      const messageIndex = this.messages.findIndex(message => message.id === commentId);
      if (messageIndex === -1) {
          return null;
      }
      this.messages[messageIndex] = { ...this.messages[messageIndex], ...updates };
      return this.messages[messageIndex];
  }

    // Traceability Matrix operations
  async getTraceabilityMatrix(projectId: number): Promise<any> {
    return this.traceabilityMatrixes.get(projectId);
  }

  async saveTraceabilityMatrix(projectId: number, matrixData: any[]): Promise<any> {
    this.traceabilityMatrixes.set(projectId, matrixData);
    return matrixData;
  }

  // Enhanced Chat and Messaging methods
    async getUserConversations(userId: number): Promise<any[]> {
        return Array.from(this.conversations.values())
            .filter(conversation => conversation.participants.includes(userId));
    }

    async getDirectConversation(userId1: number, userId2: number): Promise<any | null> {
        for (const conversation of this.conversations.values()) {
            if (conversation.type === 'direct' &&
                conversation.participants.includes(userId1) &&
                conversation.participants.includes(userId2) &&
                conversation.participants.length === 2) {
                return conversation;
            }
        }
        return null;
    }

    async createConversation(conversationData: any): Promise<any> {
        const id = this.getNextId();
        const now = new Date();

        const conversation = {
            ...conversationData,
            id,
            createdAt: now,
            updatedAt: now,
            participants: conversationData.participants || []
        };

        this.conversations.set(id, conversation);
        return conversation;
    }

    async getConversation(id: string): Promise<any | null> {
        const conversationId = parseInt(id, 10);
        return this.conversations.get(conversationId) || null;
    }

    async getMessagesByChat(chatId: number): Promise<any[]> {
        return Array.from(this.chatMessages.values())
            .filter(message => message.chatId === chatId);
    }

    async addParticipantToConversation(conversationId: string, userId: number): Promise<boolean> {
        const conversationIdNum = parseInt(conversationId, 10);
        const conversation = this.conversations.get(conversationIdNum);
        if (!conversation) return false;

        if (!conversation.participants.includes(userId)) {
            conversation.participants.push(userId);
            conversation.updatedAt = new Date();
            this.conversations.set(conversationIdNum, conversation);
            return true;
        }
        return false;
    }

    async removeParticipantFromConversation(conversationId: string, userId: number): Promise<boolean> {
        const conversationIdNum = parseInt(conversationId, 10);
        const conversation = this.conversations.get(conversationIdNum);
        if (!conversation) return false;

        conversation.participants = conversation.participants.filter(uid => uid !== userId);
        conversation.updatedAt = new Date();
        this.conversations.set(conversationIdNum, conversation);
        return true;
    }

    async updateConversation(id: string, updates: any): Promise<any | null> {
        const conversationId = parseInt(id, 10);
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return null;

        const updatedConversation = { ...conversation, ...updates, updatedAt: new Date() };
        this.conversations.set(conversationId, updatedConversation);
        return updatedConversation;
    }

    async deleteConversation(id: string): Promise<boolean> {
        const conversationId = parseInt(id, 10);
        return this.conversations.delete(conversationId);
    }

    async addConversationMember(conversationId: string, userId: number): Promise<boolean> {
        const conversationIdNum = parseInt(conversationId, 10);
        let members = this.conversationMembers.get(conversationIdNum) || new Set<number>();
        members.add(userId);
        this.conversationMembers.set(conversationIdNum, members);
        return true;
    }

    async removeConversationMember(conversationId: string, userId: number): Promise<boolean> {
        const conversationIdNum = parseInt(conversationId, 10);
        let members = this.conversationMembers.get(conversationIdNum);
        if (!members) return false;
        members.delete(userId);
        this.conversationMembers.set(conversationIdNum, members);
        return true;
    }

    async getConversationMembers(conversationId: string): Promise<any[]> {
        const conversationIdNum = parseInt(conversationId, 10);
        const members = this.conversationMembers.get(conversationIdNum) || new Set<number>();
        return Array.from(members);
    }

    async createChatMessage(messageData: any): Promise<any> {
        const id = this.getNextId();
        const now = new Date();

        const message = {
            ...messageData,
            id,
            createdAt: now,
            updatedAt: now
        };

        this.chatMessages.set(id, message);
        return message;
    }

    async getChatMessages(conversationId: number, limit?: number, offset?: number): Promise<any[]> {
        let messages = Array.from(this.chatMessages.values())
            .filter(message => message.conversationId === conversationId);

        if (offset) {
            messages = messages.slice(offset);
        }
        if (limit) {
            messages = messages.slice(0, limit);
        }

        return messages;
    }

    async getChatMessage(id: string): Promise<any | null> {
        const messageId = parseInt(id, 10);
        return this.chatMessages.get(messageId) || null;
    }

    async updateChatMessage(id: string, userId: number, updates: any): Promise<any | null> {
        const messageId = parseInt(id, 10);
        const message = this.chatMessages.get(messageId);

        if (!message || message.userId !== userId) {
            return null;
        }

        const updatedMessage = { ...message, ...updates, updatedAt: new Date() };
        this.chatMessages.set(messageId, updatedMessage);
        return updatedMessage;
    }

    async deleteChatMessage(id: string, userId: number): Promise<boolean> {
        const messageId = parseInt(id, 10);
        const message = this.chatMessages.get(messageId);

        if (!message || message.userId !== userId) {
            return false;
        }

        return this.chatMessages.delete(messageId);
    }

    async addMessageReaction(messageId: string, userId: number, emoji: string): Promise<any | null> {
        const messageIdNum = parseInt(messageId, 10);
        let reactions = this.messageReactions.get(messageIdNum) || [];

        // Check if the user has already reacted with the same emoji
        const existingReaction = reactions.find(reaction => reaction.userId === userId && reaction.emoji === emoji);
        if (existingReaction) {
            return null; // User has already reacted with this emoji
        }

        reactions.push({ userId, emoji });
        this.messageReactions.set(messageIdNum, reactions);
        return { userId, emoji };
    }

    async getMessageThread(parentMessageId: string): Promise<any[]> {
        const parentMessageIdNum = parseInt(parentMessageId, 10);
        const threadIds = this.messageThreads.get(parentMessageIdNum) || [];
        return Array.from(this.chatMessages.values())
            .filter(message => threadIds.includes(message.id));
    }

    async markMessageAsRead(messageId: string, userId: number): Promise<void> {
        const messageIdStr = messageId;
        let readStatus = this.messageReadStatus.get(`${messageIdStr}-${userId}`) || new Set<number>();
        readStatus.add(userId);
        this.messageReadStatus.set(`${messageIdStr}-${userId}`, readStatus);
    }

    async markConversationAsRead(conversationId: string, userId: number): Promise<void> {
        const conversationIdNum = parseInt(conversationId, 10);
        for (const message of this.chatMessages.values()) {
            if (message.conversationId === conversationIdNum) {
                this.markMessageAsRead(message.id.toString(), userId);
            }
        }
    }

    async getUnreadCountForUser(conversationId: string, userId: number): Promise<number> {
        const conversationIdNum = parseInt(conversationId, 10);
        let unreadCount = 0;
        for (const message of this.chatMessages.values()) {
            if (message.conversationId === conversationIdNum) {
                const readStatus = this.messageReadStatus.get(`${message.id}-${userId}`);
                if (!readStatus || !readStatus.has(userId)) {
                    unreadCount++;
                }
            }
        }
        return unreadCount;
    }

  // OnlyOffice Documents
  async getOnlyOfficeDocuments(projectId?: number): Promise<any[]> {
        let documents = Array.from(this.documents.values());
        if (projectId) {
            documents = documents.filter(doc => doc.projectId === projectId);
        }
        return documents;
  }
  async getOnlyOfficeDocument(id: string): Promise<any | null> {
        const documentId = parseInt(id, 10);
        return this.documents.get(documentId) || null;
  }
  async createOnlyOfficeDocument(data: any): Promise<any> {
        const id = this.getNextId();
        const now = new Date();
        const document = { ...data, id, createdAt: now };
        this.documents.set(id, document);
        return document;
  }
  async updateOnlyOfficeDocument(id: string, updates: any): Promise<any | null> {
        const documentId = parseInt(id, 10);
        const document = this.documents.get(documentId);
        if (!document) return null;
        const updatedDocument = { ...document, ...updates };
        this.documents.set(documentId, updatedDocument);
        return updatedDocument;
  }
  async deleteOnlyOfficeDocument(id: string): Promise<boolean> {
        const documentId = parseInt(id, 10);
        return this.documents.delete(documentId);
  }
    
    async searchMessages(query: string, conversationId?: number, userId?: number): Promise<any[]> {
        let results = Array.from(this.chatMessages.values())
            .filter(message => message.content.includes(query));
        
        if (conversationId) {
            results = results.filter(message => message.conversationId === conversationId);
        }
        
        if (userId) {
            results = results.filter(message => message.userId === userId);
        }
        
        return results;
    }
  
    async getUserConversations(userId: number): Promise<any[]> {
        return Array.from(this.conversations.values())
            .filter(conversation => conversation.participants.includes(userId));
    }

    async getMessagesByChat(chatId: number): Promise<any[]> {
        return Array.from(this.chatMessages.values())
            .filter(message => message.chatId === chatId);
    }

    async createMessage(messageData: any): Promise<any> {
        const id = this.getNextId();
        const now = new Date();
        const message = { ...messageData, id, createdAt: now };
        this.chatMessages.set(id, message);
        return message;
    }

    async createConversation(conversationData: any): Promise<any> {
        const id = this.getNextId();
        const now = new Date();

        const conversation = {
            ...conversationData,
            id,
            createdAt: now,
            updatedAt: now,
            participants: conversationData.participants || []
        };

        this.conversations.set(id, conversation);
        return conversation;
    }
}

export { MemStorage };

// Singleton instance for convenience.  Can still create multiple if desired.
export const memStorage = new MemStorage();