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
  createMessage(message: any): Promise<any>;
  getChatMessages(projectId: number, limit?: number): Promise<any[]>;
  updateChatMessage(messageId: number, userId: number, updates: any): Promise<any | null>;

  // Comment operations
  getBugComment(commentId: number): Promise<any>;
  updateComment(commentId: number, updates: any): Promise<any>;

    // Traceability Matrix operations
  getTraceabilityMatrix(projectId: number): Promise<any>;
  saveTraceabilityMatrix(projectId: number, matrixData: any[]): Promise<any>;

  // Enhanced Chat and Messaging methods
  getChatsByUser(userId: number): Promise<any[]>;
  getDirectConversation(userId1: number, userId2: number): Promise<any | null>;
  addParticipantToConversation(conversationId: number, userId: number): Promise<boolean>;
  removeParticipantFromConversation(conversationId: number, userId: number): Promise<boolean>;
  updateConversation(id: number, updates: any): Promise<any | null>;
  deleteConversation(id: number): Promise<boolean>;
  addConversationMember(conversationId: number, userId: number): Promise<boolean>;
  removeConversationMember(conversationId: number, userId: number): Promise<boolean>;
  getConversationMembers(conversationId: number): Promise<any[]>;
  createChatMessage(messageData: any): Promise<any>;
  getChatMessages(conversationId: number, limit?: number, offset?: number): Promise<any[]>;
  getChatMessage(id: number): Promise<any | null>;
  updateChatMessage(id: number, userId: number, updates: any): Promise<any | null>;
  deleteChatMessage(id: number, userId: number): Promise<boolean>;
  addMessageReaction(messageId: number, userId: number, emoji: string): Promise<any | null>;
  getMessageThread(parentMessageId: number): Promise<any[]>;
  markMessageAsRead(messageId: number, userId: number): Promise<void>;
  markConversationAsRead(conversationId: number, userId: number): Promise<void>;
  getUnreadCountForUser(conversationId: number, userId: number): Promise<number>;
  searchMessages(query: string, conversationId?: number, userId?: number): Promise<any[]>;
  getUserConversations(userId: number): Promise<any[]>;
  async getMessagesByChat(chatId: number): Promise<any[]>;
  createMessage(messageData: any): Promise<any>;
  createConversation(conversationData: any): Promise<any>;
  getUserById(userId: number): Promise<User | undefined>;
  createDirectConversation(userId1: number, userId2: number): Promise<any>;
  async getProjectUsers(projectId: number): Promise<Array<{ id: number; name: string; email: string }>>;

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

  // Add getEmployeeProjectAllocation method for extension functionality
  getEmployeeProjectAllocation(allocationId: number): Promise<any | null>;

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

  // Todo Management Methods  
  getTodos(userId: number): Promise<any[]>;
  getTodo(id: number): Promise<any | undefined>;
  createTodo(data: any): Promise<any>;
  updateTodo(id: number, data: any): Promise<any | null>;
  deleteTodo(id: number): Promise<boolean>;
  getTodoLists(userId: number): Promise<any[]>;
  getTodoList(id: number): Promise<any | undefined>;
  createTodoList(data: any): Promise<any>;
  updateTodoList(id: number, data: any): Promise<any | null>;
  deleteTodoList(id: number): Promise<boolean>;
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
  private projectMembers = new Map<number, any>();
  private sprints = new Map<number, any>();
  private kanbanColumns: Map<number, any> = new Map();
  private kanbanCards: Map<number, any> = new Map();
  private traceabilityMatrixes: Map<number, any> = new Map();

  // Initialize data property for compatibility
  private data: any = {
    todoLists: []
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
  private employees = new Map<number, any>();
  private employeeProjects = new Map<number, any>();
  private technologyOptions = new Map<number, any>();
  private departmentOptions = new Map<number, any>();
  private navadhitiProjects = new Map<number, any>();
  private statusReviews = new Map<number, any>();
  private employeeProjectHistory: any[] = []; // Added for storing history

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

    defaultTechOptions.forEach(tech => this.technologyOptions.set(tech.id, tech));

    // Add default department options
    const defaultDeptOptions = [
      { id: 1, name: 'Development', createdAt: new Date() },
      { id: 2, name: 'Quality Assurance', createdAt: new Date() },
      { id: 3, name: 'DevOps', createdAt: new Date() },
      { id: 4, name: 'UI/UX Design', createdAt: new Date() },
      { id: 5, name: 'Project Management', createdAt: new Date() },
    ];

    defaultDeptOptions.forEach(dept => this.departmentOptions.set(dept.id, dept));
  }

  private nextId = 1;
  private testSheetIdCounter = 1;

  private getNextId(entityType?: string): number {
    let id = this.nextId++;
    // For specific entities like 'employee', 'navadhiti_project', you can add more specific ID generation logic if needed.
    // For example:
    // if (entityType === 'employee') {
    //   id = this.employeeIdCounter++;
    // }
    return id;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  // Get all users
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
        .filter(id => id && id.match(/^BUG-(\d+)$/))
        .map(id => parseInt(id.replace('BUG-', ''), 10))
        .filter(num => !isNaN(num));

      const nextNumber = existingBugs.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      bugId = `BUG-${String(nextNumber).padStart(3, '0')}`;
    }

    const bug: Bug = {
      ...insertBug,
      id,
      bugId,
      createdAt: new Date(),
      updatedAt: new Date()
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
  async createDocumentFolder(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentFolder> {
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

  async getCustomers(): Promise<Customer[]>{    return Array.from(this.customers.values());
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return this.customers.get(id) || null;
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer | null> {
    const customer = this.customers.get(id);
    if (!customer) return null;

    const updatedCustomer = { ...customer, ...data, updatedAt: new Date() };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Tag operations
  async createTag(data: Omit<Tag, 'id'>): Promise<Tag> {
    const id = this.nextId++;

    const tag: Tag = {
      ...data,
      id
    };

    this.tags.set(id, tag);
    return tag;
  }

  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTagById(id: number): Promise<Tag | null> {
    return this.tags.get(id) || null;
  }

  async updateTag(id: number, data: Partial<Tag>): Promise<Tag | null> {
    const tag = this.tags.get(id);
    if (!tag) return null;

    const updatedTag = { ...tag, ...data };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }

  async deleteTag(id: number): Promise<boolean> {
    return this.tags.delete(id);
  }

  // Kanban operations
  async createKanbanColumn(data: Omit<KanbanColumn, 'id'>): Promise<KanbanColumn> {
    const id = this.nextId++;

    const column: KanbanColumn = {
      ...data,
      id
    };

    this.kanbanColumns.set(id, column);
    return column;
  }

  async getKanbanColumns(projectId: number): Promise<KanbanColumn[]> {
    return Array.from(this.kanbanColumns.values())
      .filter(col => col.projectId === projectId)
      .sort((a, b) => a.position - b.position);
  }

  async updateKanbanColumn(id: number, data: Partial<KanbanColumn>): Promise<KanbanColumn | null> {
    const column = this.kanbanColumns.get(id);
    if (!column) return null;

    const updatedColumn = { ...column, ...data };
    this.kanbanColumns.set(id, updatedColumn);
    return updatedColumn;
  }

  async deleteKanbanColumn(id: number): Promise<boolean> {
    // Also delete all cards in this column
    const cardsInColumn = Array.from(this.kanbanCards.values()).filter(card => card.columnId === id);
    cardsInColumn.forEach(card => this.kanbanCards.delete(card.id));

    return this.kanbanColumns.delete(id);
  }

  async createKanbanCard(data: Omit<KanbanCard, 'id'>): Promise<KanbanCard> {
    const id = this.nextId++;

    const card: KanbanCard = {
      ...data,
      id
    };

    this.kanbanCards.set(id, card);
    return card;
  }

  async getKanbanCards(columnId: number): Promise<KanbanCard[]> {
    return Array.from(this.kanbanCards.values())
      .filter(card => card.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  }

  async updateKanbanCard(id: number, cardData: any): Promise<any> {
    const card = this.kanbanCards.get(id);
    if (!card) return null;

    const updatedCard = { ...card, ...cardData };
    this.kanbanCards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteKanbanCard(id: number): Promise<boolean> {
    // Also delete all cards in this column
    const cardsInColumn = Array.from(this.kanbanCards.values()).filter(card => card.columnId === id);
    cardsInColumn.forEach(card => this.kanbanCards.delete(card.id));

    return this.kanbanCards.delete(id);
  }

  // Custom marker operations
  async createCustomMarker(data: any): Promise<CustomMarker> {
    const id = this.getNextId();

    const marker: CustomMarker = {
      ...data,
      id
    };

    this.customMarkers.set(id, marker);
    return marker;
  }

  async getCustomMarkers(): Promise<CustomMarker[]> {
    return Array.from(this.customMarkers.values());
  }

  async updateCustomMarker(id: number, data: Partial<CustomMarker>): Promise<CustomMarker | null> {
    const marker = this.customMarkers.get(id);
    if (!marker) return null;

    const updatedMarker = { ...marker, ...data };
    this.customMarkers.set(id, updatedMarker);
    return updatedMarker;
  }

  async deleteCustomMarker(id: number): Promise<boolean> {
    return this.customMarkers.delete(id);
  }

  // Matrix operations
  async createMatrixCell(data: Omit<MatrixCell, 'id'>): Promise<MatrixCell> {
    const id = this.getNextId();

    const cell: MatrixCell = {
      ...data,
      id
    };

    this.matrixCells.set(id, cell);
    return cell;
  }

  async getMatrixCells(): Promise<MatrixCell[]> {
    return Array.from(this.matrixCells.values());
  }

  async updateMatrixCell(id: number, data: Partial<MatrixCell>): Promise<MatrixCell | null> {
    const cell = this.matrixCells.get(id);
    if (!cell) return null;

    const updatedCell = { ...cell, ...data };
    this.matrixCells.set(id, updatedCell);
    return updatedCell;
  }

  async deleteMatrixCell(id: number): Promise<boolean> {
    return this.matrixCells.delete(id);
  }

  // Project member operations
  async addProjectMember(data: Omit<any, 'id'>): Promise<any> {
    const id = this.getNextId();

    const member: any = {
      ...data,
      id
    };

    this.projectMembers.set(id, member);
    return member;
  }

  async getProjectMembers(projectId: number): Promise<any[]> {
    return Array.from(this.projectMembers.values()).filter(member => member.projectId === projectId);
  }

  // Get project memberships for a specific user
  async getUserProjectMemberships(userId: number): Promise<any[]> {
    return Array.from(this.projectMembers.values()).filter(member => member.userId === userId);
  }

  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    const member = Array.from(this.projectMembers.values())
      .find(m => m.projectId === projectId && m.userId === userId);

    if (member) {
      return this.projectMembers.delete(member.id);
    }
    return false;
  }

  // Activity operations
  async getActivities(limit = 10): Promise<any[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => (b.timestamp || b.createdAt).getTime() - (a.timestamp || a.createdAt).getTime())
      .slice(0, limit);
  }

  async getProjectActivities(projectId: number, limit: number = 10): Promise<any[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.details?.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createActivity(activity: any): Promise<any> {
    const newActivity = {
      id: this.getNextId(),
      ...activity,
      timestamp: new Date(),
    };
    this.activities.set(newActivity.id, newActivity);
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
    let results = Array.from(this.testSheets.values());

    if (projectId) {
      results = results.filter(sheet => sheet.projectId === projectId);
    }

    console.log(`Storage: getTestSheets(${projectId}) returning ${results.length} sheets`);
    return results;
  }

  async getTestSheet(id: number): Promise<any | null> {
    return this.testSheets.get(id) || null;
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

    this.testSheets.set(id, newSheet);
    console.log('Created test sheet:', newSheet);
    return newSheet;
  }

  async updateTestSheet(id: number, data: any): Promise<any> {
    const sheet = this.testSheets.get(id);
    if (!sheet) return null;

    const updatedSheet = { 
      ...sheet, 
      ...data, 
      updatedAt: new Date().toISOString() 
    };

    this.testSheets.set(id, updatedSheet);
    return updatedSheet;
  }

  async deleteTestSheet(id: number): Promise<boolean> {
    return this.testSheets.delete(id);
  }

  async duplicateTestSheet(id: number, name: string, userId: number): Promise<any> {
    const originalSheet = this.testSheets.get(id);
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

    this.testSheets.set(newId, duplicatedSheet);
    return duplicatedSheet;
  }

  // Flow Diagrams methods (placeholder)
  async getFlowDiagrams(projectId?: number): Promise<any[]> {
    return [];
  }

  async getFlowDiagram(id: number): Promise<any | null> {
    return null;
  }

  async createFlowDiagram(data: any): Promise<any> {
    return {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async updateFlowDiagram(id: number, data: any): Promise<any> {
    return {
      id,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteFlowDiagram(id: number): Promise<boolean> {
    return true;
  }

  // Dashboard Stats
  async getDashboardStats(userId?: number): Promise<{
    totalProjects: number;
    totalTestCases: number;
    openBugs: number;
    passRate: number;
    testCaseStatusCounts?: any;
    bugStatusCounts?: any;
  }> {
    const totalProjects = this.projects.size;
    const totalTestCases = this.testCases.size;
    const totalUsers = this.users.size;

    // Real-time test case status counts
    const testCases = Array.from(this.testCases.values());
    const testCaseStatusCounts = {
      passed: testCases.filter(tc => tc.status === 'Pass').length,
      failed: testCases.filter(tc => tc.status === 'Fail').length,
      blocked: testCases.filter(tc => tc.status === 'Blocked').length,
      notExecuted: testCases.filter(tc => tc.status === 'Not Executed' || !tc.status).length    };

    // Real-time bug status counts
    const bugs = Array.from(this.bugs.values());
    const bugStatusCounts = {
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

  // Document operations  
  async getDocuments(projectId: number, folderId?: number): Promise<Document[]> {
    let results = Array.from(this.documents.values()).filter(doc => doc.projectId === projectId);
    if (folderId !== undefined) {
      results = results.filter(doc => doc.folderId === folderId);
    }
    return results;
  }

  async getDocumentFolders(projectId: number): Promise<DocumentFolder[]> {
    return Array.from(this.documentFolders.values()).filter(folder => folder.projectId === projectId);
  }

  async getDocumentFolder(id: number): Promise<DocumentFolder | undefined> {
    return this.documentFolders.get(id);
  }

  async createDocumentFolder(folder: any): Promise<DocumentFolder> {
    const newFolder = {
      id: this.getNextId(),
      ...folder,
      createdAt: new Date(),
    };
    this.documentFolders.set(newFolder.id, newFolder);
    return newFolder;
  }

  async updateDocumentFolder(id: number, folderData: Partial<DocumentFolder>): Promise<DocumentFolder | undefined> {
    const folder = this.documentFolders.get(id);
    if (!folder) return undefined;

    const updatedFolder = { ...folder, ...folderData };
    this.documentFolders.set(newFolder.id, updatedFolder);
    return updatedFolder;
  }

  async deleteDocumentFolder(id: number): Promise<boolean> {
    return this.documentFolders.delete(id);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(document: any): Promise<Document> {
    const newDocument = {
      id: this.getNextId(),
      ...document,
      uploadedAt: new Date(),
    };
    this.documents.set(newDocument.id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...documentData };
    this.documents.set(newDocument.id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Project operations for user access
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    // Get projects created by this user
    const createdProjects = Array.from(this.projects.values())
      .filter(project => project.createdById === userId);

    // Get projects where user is a member
    const membershipProjects = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId)
      .map(member => this.projects.get(member.projectId))
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

  // Module operations
  async getModules(projectId: number): Promise<Module[]> {
    return this.getModulesByProject(projectId);
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomersByStatus(status: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => customer.status === status);
  }

  async createCustomer(customer: any): Promise<Customer> {
    const newCustomer = {
      id: this.getNextId(),
      ...customer,
      createdAt: new Date(),
    };
    this.customers.set(newCustomer.id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Customer Projects operations
  async getCustomerProjects(): Promise<any[]> {
    return Array.from(this.customerProjects.values());
  }

  async getProjectsByCustomerId(customerId: number): Promise<Project[]> {
    const customerProjectIds = Array.from(this.customerProjects.values())
      .filter(cp => cp.customerId === customerId)
      .map(cp => cp.projectId);

    return Array.from(this.projects.values())
      .filter(project => customerProjectIds.includes(project.id));
  }

  async getCustomersByProjectId(projectId: number): Promise<Customer[]> {
    const customerIds = Array.from(this.customerProjects.values())
      .filter(cp => cp.projectId === projectId)
      .map(cp => cp.customerId);

    return Array.from(this.customers.values())
      .filter(customer => customerIds.includes(customer.id));
  }

  async createCustomerProject(customerProject: any): Promise<any> {
    const newCustomerProject = {
      id: this.getNextId(),
      ...customerProject,
      createdAt: new Date(),
    };
    this.customerProjects.set(newCustomerProject.id, newCustomerProject);
    return newCustomerProject;
  }

  async deleteCustomerProject(id: number): Promise<boolean> {
    return this.customerProjects.delete(id);
  }

  // TimeSheet operations
  async getTimeSheets(projectId?: number, userId?: number): Promise<any[]> {
    let results = Array.from(this.timeSheets.values());

    if (projectId && userId) {
      results = results.filter(ts => ts.projectId === projectId && ts.userId === userId);
    } else if (projectId) {
      results = results.filter(ts => ts.projectId === projectId);
    } else if (userId) {
      results = results.filter(ts => ts.userId === userId);
    }

    return results;
  }

  async getUserTimeSheets(userId: number): Promise<any[]> {
    return Array.from(this.timeSheets.values()).filter(ts => ts.userId === userId);
  }

  async getProjectTimeSheets(projectId: number): Promise<any[]> {
    return Array.from(this.timeSheets.values()).filter(ts => ts.projectId === projectId);
  }

  async getTimeSheet(id: number): Promise<any | undefined> {
    return this.timeSheets.get(id);
  }

  async createTimeSheet(timeSheet: any): Promise<any> {
    const newTimeSheet = {
      id: this.getNextId(),
      ...timeSheet,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.timeSheets.set(newTimeSheet.id, newTimeSheet);
    return newTimeSheet;
  }

  async updateTimeSheet(id: number, timeSheetData: any): Promise<any | undefined> {
    const timeSheet = this.timeSheets.get(id);
    if (!timeSheet) return undefined;

    const updatedTimeSheet = { ...timeSheet, ...timeSheetData, updatedAt: new Date() };
    this.timeSheets.set(id, updatedTimeSheet);
    return updatedTimeSheet;
  }

  async deleteTimeSheet(id: number): Promise<boolean> {
    return this.timeSheets.delete(id);
  }

  async approveTimeSheet(id: number, approverId: number): Promise<any | undefined> {
    const timeSheet = this.timeSheets.get(id);
    if (!timeSheet) return undefined;

    const approvedTimeSheet = {
      ...timeSheet,
      status: "Approved",
      approvedById: approverId,
      approvalDate: new Date(),
      updatedAt: new Date()
    };
    this.timeSheets.set(id, approvedTimeSheet);
    return approvedTimeSheet;
  }

  async rejectTimeSheet(id: number, approverId: number, reason: string): Promise<any | undefined> {
    const timeSheet = this.timeSheets.get(id);
    if (!timeSheet) return undefined;

    const rejectedTimeSheet = {
      ...timeSheet,
      status: "Rejected",
      approvedById: approverId,
      approvalDate: new Date(),
      comments: reason,
      updatedAt: new Date()
    };
    this.timeSheets.set(id, rejectedTimeSheet);
    return rejectedTimeSheet;
  }

  // TimeSheet Folder operations
  async getTimeSheetFolders(userId: number): Promise<any[]> {
    return Array.from(this.timeSheetFolders.values()).filter(folder => folder.userId === userId);
  }

  async getTimeSheetFolder(id: number): Promise<any | undefined> {
    return this.timeSheetFolders.get(id);
  }

  async createTimeSheetFolder(folder: any): Promise<any> {
    const newFolder = {
      id: this.getNextId(),
      ...folder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.timeSheetFolders.set(newFolder.id, newFolder);
    return newFolder;
  }

  async updateTimeSheetFolder(id: number, folderData: any): Promise<any | undefined> {
    const folder = this.timeSheetFolders.get(id);
    if (!folder) return undefined;

    const updatedFolder = { ...folder, ...folderData, updatedAt: new Date() };
    this.timeSheetFolders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteTimeSheetFolder(id: number): Promise<boolean> {
    return this.timeSheetFolders.delete(id);
  }

  async getTimeSheetsByFolder(folderId: number): Promise<any[]> {
    return Array.from(this.timeSheets.values()).filter(ts => ts.folderId === folderId);
  }

  // Sprint operations
  async getSprints(projectId?: number): Promise<any[]> {
    let results = Array.from(this.sprints.values());
    if (projectId) {
      results = results.filter(sprint => sprint.projectId === projectId);
    }
    return results;
  }

  async getSprint(id: number): Promise<any | undefined> {
    return this.sprints.get(id);
  }

  async createSprint(sprint: any): Promise<any> {
    const newSprint = {
      id: this.getNextId(),
      ...sprint,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sprints.set(newSprint.id, newSprint);
    return newSprint;
  }

  async updateSprint(id: number, sprintData: any): Promise<any> {
    const sprint = this.sprints.get(id);
    if (!sprint) throw new Error("Sprint not found");

    const updatedSprint = { ...sprint, ...sprintData, updatedAt: new Date() };
    this.sprints.set(id, updatedSprint);
    return updatedSprint;
  }

  async deleteSprint(id: number): Promise<boolean> {
    return this.sprints.delete(id);
  }

  // Kanban operations
  async getKanbanColumns(projectId?: number, sprintId?: number): Promise<any[]> {
    let results = Array.from(this.kanbanColumns.values());

    if (projectId && sprintId) {
      results = results.filter(col => col.projectId === projectId && col.sprintId === sprintId);
    } else if (projectId) {
      results = results.filter(col => col.projectId === projectId);
    } else if (sprintId) {
      results = results.filter(col => col.sprintId === sprintId);
    }

    return results.sort((a, b) => a.order - b.order);
  }

  async getKanbanColumn(id: number): Promise<any | undefined> {
    return this.kanbanColumns.get(id);
  }

  async createKanbanColumn(column: any): Promise<any> {
    const newColumn = {
      id: this.getNextId(),
      ...column,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.kanbanColumns.set(newColumn.id, newColumn);
    return newColumn;
  }

  async updateKanbanColumn(id: number, columnData: any): Promise<any> {
    const column = this.kanbanColumns.get(id);
    if (!column) throw new Error("Column not found");

    const updatedColumn = { ...column, ...columnData, updatedAt: new Date() };
    this.kanbanColumns.set(id, updatedColumn);
    return updatedColumn;
  }

  async deleteKanbanColumn(id: number): Promise<boolean> {
    return this.kanbanColumns.delete(id);
  }

  async getKanbanCards(columnId?: number, sprintId?: number, projectId?: number): Promise<any[]> {
    let results = Array.from(this.kanbanCards.values());

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

  async getKanbanSubCards(parentId: number): Promise<any[]> {
    return Array.from(this.kanbanCards.values())
      .filter(card => card.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  async getKanbanCard(id: number): Promise<any | undefined> {
    return this.kanbanCards.get(id);
  }

  async createKanbanCard(card: any): Promise<any> {
    const newCard = {
      id: this.getNextId(),
      ...card,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.kanbanCards.set(newCard.id, newCard);
    return newCard;
  }

  async updateKanbanCard(id: number, cardData: any): Promise<any> {
    const card = this.kanbanCards.get(id);
    if (!card) throw new Error("Card not found");

    const updatedCard = { ...card, ...cardData, updatedAt: new Date() };
    this.kanbanCards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteKanbanCard(id: number): Promise<boolean> {
    return this.kanbanCards.delete(id);
  }

// Matrix operations
  async upsertMatrixCell(cell: any): Promise<any> {
    const key = `${cell.rowModuleId}-${cell.colModuleId}-${cell.projectId}`;
    const existingCell = this.matrixCells.get(key);

    if (existingCell) {
      const updatedCell = { 
        ...existingCell, 
        ...cell, 
        updatedAt: new Date().toISOString() 
      };
      this.matrixCells.set(key, updatedCell);
      return updatedCell;
    } else {
      const newCell = {
        id: this.getNextId(),
        ...cell,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      };
      this.matrixCells.set(key, newCell);
      return newCell;
    }
  }

  async getMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<any | undefined> {
    const key = `${rowModuleId}-${colModuleId}-${projectId}`;
    return this.matrixCells.get(key);
  }

  async deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<boolean> {
    const key = `${rowModuleId}-${colModuleId}-${projectId}`;
    return this.matrixCells.delete(key);
  }

  // Custom marker operations with proper ID handling
  async createCustomMarker(data: any): Promise<CustomMarker> {
    const id = this.getNextId();

    const marker: CustomMarker = {
      ...data,
      id
    };

    this.customMarkers.set(id, marker);
    return marker;
  }

  async getCustomMarkers(): Promise<CustomMarker[]> {
    return Array.from(this.customMarkers.values());
  }

  async getCustomMarkersByProject(projectId: number): Promise<CustomMarker[]> {
    return Array.from(this.customMarkers.values()).filter(marker => marker.projectId === projectId);
  }

  async updateCustomMarker(id: number, data: Partial<CustomMarker>): Promise<CustomMarker | null> {
    const marker = this.customMarkers.get(id);
    if (!marker) return null;

    const updatedMarker = { 
      ...marker, 
      ...data
    };
    this.customMarkers.set(id, updatedMarker);
    return updatedMarker;
  }

  async deleteCustomMarker(id: number): Promise<boolean> {
    return this.customMarkers.delete(id);
  }

  // Matrix cell operations with proper storage
  async createMatrixCell(data: any): Promise<MatrixCell> {
    const key = `${data.rowModuleId}-${data.colModuleId}-${data.projectId}`;

    // Check if cell already exists, if so update it
    const existingCell = this.matrixCells.get(key);

    if (existingCell) {
      const updatedCell: MatrixCell = {
        ...existingCell,
        ...data,
        updatedAt: new Date().toISOString()
      };
      this.matrixCells.set(key, updatedCell);
      console.log(`Storage: Updated matrix cell ${key} with value ${data.value}`);
      return updatedCell;
    } else {
      const id = this.getNextId();
      const cell: MatrixCell = {
        ...data,
        id: id.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.matrixCells.set(key, cell);
      console.log(`Storage: Created matrix cell ${key} with value ${data.value}`);
      return cell;
    }
  }

  async getMatrixCells(): Promise<MatrixCell[]> {
    return Array.from(this.matrixCells.values());
  }

  async getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]> {
    return Array.from(this.matrixCells.values()).filter(cell => cell.projectId === projectId);
  }

  async updateMatrixCell(id: number, data: Partial<MatrixCell>): Promise<MatrixCell | null> {
    // Find cell by ID across all keys
    for (const [key, cell] of this.matrixCells.entries()) {
      if (cell.id === id.toString()) {
        const updatedCell = { 
          ...cell, 
          ...data, 
          updatedAt: new Date().toISOString() 
        };
        this.matrixCells.set(key, updatedCell);
        return updatedCell;
      }
    }
    return null;
  }

  // Additional missing methods for traceability
  async getTraceabilityMatrix(projectId: number): Promise<any> {
    // For now, return emptymatrix data
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
        this.traceabilityMatrixes = new Map();
      }

      this.traceabilityMatrixes.set(projectId, matrixMap);

      console.log(`Storage: saveTraceabilityMatrix(${projectId}) saved ${matrixData.length} relationships`);
      return matrixMap;
    } catch (error) {
      console.error("Error saving traceability matrix:", error);
      throw error;
    }
  }

  async getTraceabilityMatrixById(id: number): Promise<any | undefined> {
    return undefined; // Placeholder for now
  }

  async createTraceabilityMatrix(matrix: any): Promise<any> {
    return matrix; // Placeholder for now
  }

  async updateTraceabilityMatrix(id: number, matrix: any): Promise<any> {
    return matrix; // Placeholder for now
  }

  async deleteTraceabilityMatrix(id: number): Promise<boolean> {
    return true; // Placeholder for now
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

  // Helper method to record activities
  private recordActivity(entityType: string, action: string, entityId: number, userId: number) {
    const activity = {
      id: this.getNextId(),
      entityType,
      action,
      entityId,
      userId,
      timestamp: new Date(),
      details: {
        entityType,
        action,
        entityId
      }
    };
    this.activities.set(activity.id, activity);
  }

  // Initialize with default data
  constructor() {
    this.initializeDefaultData();
    this.initializeEmployeeDefaults();
  }

  private initializeDefaultData() {
    // Add default admin user only
    const defaultAdmin = {
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

    this.users.set(1, defaultAdmin);

    // Set counters to start fresh
    this.nextId = 2;

    console.log("✅ Initialized clean storage with admin user only:", {
      users: this.users.size,
      projects: this.projects.size,
      modules: this.modules.size,
      testCases: this.testCases.size,
      bugs: this.bugs.size
    });
  }

  async updateTestCaseStatus(id: number, status: string): Promise<TestCase | null> {
    console.log(`Storage: updateTestCaseStatus(${id}, ${status})`);
    return this.updateTestCase(id, { status });
  }

  async updateBugStatus(id: number, status: string): Promise<Bug | null> {
    console.log(`Storage: updateBugStatus(${id}, ${status})`);
    return this.updateBug(id, { status });
  }

  // Todo Management Implementation
  async getTodos(userId: number): Promise<any[]> {
    return Array.from(this.todosMap.values()).filter(todo => todo.userId === userId);
  }

  async getTodosByUserId(userId: number): Promise<any[]> {
    return Array.from(this.todosMap.values()).filter(todo => todo.userId === userId);
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
    return Array.from(this.todosMap.values()).filter(todo => todo.todoListId === listId);
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
    return Array.from(this.employees.values());
  }

  async getEmployee(id: number): Promise<any | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(data: any): Promise<any> {
    const id = this.getNextId();

    // Auto-generate employee ID if not provided
    let employeeId = data.employeeId;
    if (!employeeId || employeeId.trim() === '') {
      const existingEmployees = Array.from(this.employees.values());
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

    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, data: any): Promise<any | null> {
    const employee = this.employees.get(id);
    if (!employee) return null;

    const updatedEmployee = {
      ...employee,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Employee Project Mapping
  async getEmployeeProjects(employeeId?: number): Promise<any[]> {
    let results = Array.from(this.employeeProjects.values());
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
    this.employeeProjects.set(id, employeeProject);
    return employeeProject;
  }

  async deleteEmployeeProject(id: number): Promise<boolean> {
    try {
      const index = this.employeeProjects.findIndex(ep => ep.id === id);
      if (index !== -1) {
        this.employeeProjects.delete(id); // Use delete for Maps
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting employee project:', error);
      throw error;
    }
  }

  async updateEmployeeProject(id: number, data: Partial<any>): Promise<any> {
    const employeeProject = this.employeeProjects.get(id);
    if (!employeeProject) {
      console.error(`Employee project with ID ${id} not found.`);
      return null;
    }
    const updatedEmployeeProject = {
      ...employeeProject,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.employeeProjects.set(id, updatedEmployeeProject);
    return updatedEmployeeProject;
  }

  // Modified getEmployeeProjectHistory to use the project name from the correct source
  async getEmployeeProjectHistory(employeeId: number): Promise<any[]> {
    // Get all employee projects for this specific employee
    const employeeProjects = Array.from(this.employeeProjects.values())
      .filter(ep => ep.employeeId === employeeId);

    // Enrich with project names
    const enrichedHistory = employeeProjects.map(ep => {
      let projectName = 'Unknown Project';

      if (ep.projectType === 'navadhiti') {
        const navadhitiProject = this.navadhitiProjects.get(ep.projectId);
        projectName = navadhitiProject?.projectName || navadhitiProject?.name || 'Unknown Navadhiti Project';
      } else {
        const regularProject = this.projects.get(ep.projectId);
        projectName = regularProject?.name || 'Unknown Regular Project';
      }

      return {
        ...ep,
        projectName
      };
    });

    // Sort by updatedAt descending
    return enrichedHistory.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  }

  // Modified getAllEmployeeProjectHistory to use the project name from the correct source
  async getAllEmployeeProjectHistory(): Promise<any[]> {
    // Get all employee projects
    const allEmployeeProjects = Array.from(this.employeeProjects.values());

    // Enrich with project names
    const enrichedHistory = allEmployeeProjects.map(ep => {
      let projectName = 'Unknown Project';

      if (ep.projectType === 'navadhiti') {
        const navadhitiProject = this.navadhitiProjects.get(ep.projectId);
        projectName = navadhitiProject?.projectName || navadhitiProject?.name || 'Unknown Navadhiti Project';
      } else {
        const regularProject = this.projects.get(ep.projectId);
        projectName = regularProject?.name || 'Unknown Regular Project';
      }

      return {
        ...ep,
        projectName
      };
    });

    // Sort by updatedAt descending
    return enrichedHistory.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
  }

  // Add getEmployeeProjectAllocation method for extension functionality
  async getEmployeeProjectAllocation(allocationId: number): Promise<any | null> {
    try {
      const allocation = this.employeeProjects.get(allocationId);
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
    return Array.from(this.technologyOptions.values());
  }

  async createTechnologyOption(data: any): Promise<any> {
    const id = this.getNextId();
    const tech = {
      id,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.technologyOptions.set(id, tech);
    return tech;
  }

  // Department Options
  async getDepartmentOptions(): Promise<any[]> {
    return Array.from(this.departmentOptions.values());
  }

  async createDepartmentOption(data: any): Promise<any> {
    const id = this.getNextId();
    const dept = {
      id,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.departmentOptions.set(id, dept);
    return dept;
  }

  // Navadhiti Projects implementation
  async getNavadhitiProjects(): Promise<any[]> {
    return Array.from(this.navadhitiProjects.values());
  }

  async getNavadhitiProject(id: number): Promise<any | undefined> {
    return this.navadhitiProjects.get(id);
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
    this.navadhitiProjects.set(id, project);
    return project;
  }

  async updateNavadhitiProject(id: number, data: any): Promise<any | null> {
    const project = this.navadhitiProjects.get(id);
    if (!project) {
      return null;
    }

    const updatedProject = {
      ...project,
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

    this.navadhitiProjects.set(id, updatedProject);
    console.log(`Updated Navadhiti project ${id}:`, updatedProject);
    return updatedProject;
  }

  async deleteNavadhitiProject(id: number): Promise<boolean> {
    return this.navadhitiProjects.delete(id);
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
      const project = this.navadhitiProjects.get(data.projectId);
      if (project) {
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
          lastReviewDate: data.reviewDate,
          notes: data.notes,
          updatedAt: new Date().toISOString()
        };
        this.navadhitiProjects.set(data.projectId, updatedProject);
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
        timesheets: this.timesheets,
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
      const allocation = this.employeeProjects.get(allocationId);
      if (!allocation) {
        throw new Error('Project allocation not found');
      }

      const previousEndDate = allocation.endDate;

      // Update the allocation with new end date
      const updatedAllocation = {
        ...allocation,
        endDate: newEndDate,
        updatedAt: new Date().toISOString()
      };

      this.employeeProjects.set(allocationId, updatedAllocation);

      // Create history record for the extension
      const historyRecord = {
        id: Date.now() + Math.random(),
        employeeProjectId: allocationId,
        employeeId: allocation.employeeId,
        projectId: allocation.projectId,
        projectType: allocation.projectType || 'navadhiti',
        role: allocation.role,
        startDate: allocation.startDate,
        endDate: previousEndDate,
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
      this.employeeProjectHistory.push(historyRecord);

      console.log('Created history record for extension:', historyRecord);

      return {
        success: true,
        message: "Project duration extended successfully",
        allocation: updatedAllocation
      };
    } catch (error) {
      console.error('Error extending employee project:', error);
      throw error;
    }
  }
}

// Export storage and class
export const storage = new MemStorage();

export { MemStorage };