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
  AutomationScript,
  AutomationRun,
  AutomationSchedule,
  AutomationEnvironment,
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
  InsertAutomationScript,
  InsertAutomationRun,
  InsertAutomationSchedule,
  InsertAutomationEnvironment,
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
  createMatrixCell(cell: InsertMatrixCell): Promise<MatrixCell>;
  updateMatrixCell(id: number, cellData: Partial<MatrixCell>): Promise<MatrixCell | undefined>;
  deleteMatrixCell(id: number): Promise<boolean>;

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
}

/**
 * In-memory storage implementation for development and testing
 */
class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private projects = new Map<number, Project>();
  private projectMembers = new Map<number, any>();
  private modules = new Map<number, Module>();
  private testCases = new Map<number, TestCase>();
  private bugs = new Map<number, Bug>();
  private documents = new Map<number, Document>();
  private documentFolders = new Map<number, DocumentFolder>();
  private customers = new Map<number, Customer>();
  private tags = new Map<number, Tag>();
  private kanbanColumns = new Map<number, KanbanColumn>();
  private kanbanCards = new Map<number, KanbanCard>();
  private customMarkers = new Map<number, CustomMarker>();
  private matrixCells = new Map<number, MatrixCell>();
  private testSheets = new Map<number, any>();
  private flowDiagrams: any[] = [];
  private githubConfigs: any[] = [];
  private githubIssues: any[] = [];

  private nextId = 1;
  private moduleCounter = 1;
  private testCaseCounter = 1;
  private bugCounter = 1;
  private projectMembers = new Map<number, any>();
  private activities = new Map<number, any>();
  private timeSheets = new Map<number, any>();
  private timeSheetFolders = new Map<number, any>();
  private customerProjects = new Map<number, any>();
  private sprints = new Map<number, any>();
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
    const existingIds = Array.from(this.users.values()).map(u => u.id);
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
    const existingIds = Array.from(this.projects.values()).map(p => p.id);
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
    const id = this.modules.size + 1;

    // Auto-generate module ID if not provided
    let moduleId = moduleData.moduleId;
    if (!moduleId || moduleId.trim() === '') {
      // Get existing modules for this specific project only
      const projectModules = Array.from(this.modules.values())
        .filter(module => module.projectId === moduleData.projectId);

      // Find the highest module number for this project
      let maxNumber = 0;
      projectModules.forEach(module => {
        const match = module.moduleId.match(/^MOD-(\d+)$/);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      });

      // Generate next sequential number starting from 1
      const nextNumber = maxNumber + 1;
      moduleId = `MOD-${nextNumber}`;
    }

    const module: Module = {
      id,
      ...moduleData,
      moduleId,
      createdAt: new Date(),
    };

    this.modules.set(id, module);
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
  async getTestCases(projectId?: number, moduleId?: number): Promise<TestCase[]> {
    let results = Array.from(this.testCases.values());

    if (projectId) {
      results = results.filter(tc => tc.projectId === projectId);
    }

    if (moduleId) {
      results = results.filter(tc => tc.moduleId === moduleId);
    }

    console.log(`Storage: getTestCases(${projectId}, ${moduleId}) returning ${results.length} test cases`);
    return results;
  }

  async getTestCasesByProject(projectId: number): Promise<TestCase[]> {
    const results = Array.from(this.testCases.values()).filter(tc => tc.projectId === projectId);
    console.log(`Storage: getTestCasesByProject(${projectId}) returning ${results.length} test cases`);
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
      // Get the module to extract the first 3 letters of its name
      const module = this.modules.get(insertTestCase.moduleId);
      let modulePrefix = 'TC';

      if (module && module.name) {
        // Extract first 3 letters from module name and convert to uppercase
        const cleanModuleName = module.name.replace(/[^a-zA-Z]/g, ''); // Remove non-alphabetic characters
        modulePrefix = cleanModuleName.substring(0, 3).toUpperCase();

        // If module name has less than 3 letters, pad with 'X'
        if (modulePrefix.length < 3) {
          modulePrefix = modulePrefix.padEnd(3, 'X');
        }
      }

      // Find the highest existing test case number for this module with the same prefix
      const prefixPattern = new RegExp(`^${modulePrefix}-TC-(\\d+)$`);
      const existingTestCases = Array.from(this.testCases.values())
        .filter(tc => tc.moduleId === insertTestCase.moduleId)
        .map(tc => tc.testCaseId)
        .filter(id => id && prefixPattern.test(id))
        .map(id => {
          const match = id.match(prefixPattern);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      const nextNumber = existingTestCases.length > 0 ? Math.max(...existingTestCases) + 1 : 1;
      testCaseId = `${modulePrefix}-TC-${String(nextNumber).padStart(3, '0')}`;
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

    const updatedTestCase = { ...testCase, ...data, updatedAt: new Date() };
    this.testCases.set(id, updatedTestCase);
    this.recordActivity('test_case', 'updated', id, data.assignedTo || testCase.assignedTo || 1);
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

  async getBugs(filters?: { projectId?: number; status?: string; severity?: string }): Promise<Bug[]> {
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

    const updatedBug = { ...bug, ...data, updatedAt: new Date() };
    this.bugs.set(id, updatedBug);
    this.recordActivity('bug', 'updated', id, data.assignedTo || bug.assignedTo);
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

  async updateKanbanCard(id: number, data: Partial<KanbanCard>): Promise<KanbanCard | null> {
    const card = this.kanbanCards.get(id);
    if (!card) return null;

    const updatedCard = { ...card, ...data };
    this.kanbanCards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteKanbanCard(id: number): Promise<boolean> {
    return this.kanbanCards.delete(id);
  }

  // Custom marker operations
  async createCustomMarker(data: Omit<CustomMarker, 'id'>): Promise<CustomMarker> {
    const id = this.nextId++;

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
    const id = this.nextId++;

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
    const id = this.nextId++;

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
      const modules = await this.getModules(project.id);
      const testCases = await this.getTestCases(project.id);
      const bugs = await this.getBugs(project.id);

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
        bugs: bugs.map(b => `${b.bugId}:${b.title}`).join(';')      });
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

  async getDocumentFolders(projectId: number): Promise<DocumentFolder[]>{
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
    this.documentFolders.set(id, updatedFolder);
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
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Project operations for user access
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    // Return projects where user is a member or creator
    const userProjects = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId)
      .map(member => this.projects.get(member.projectId))
      .filter(project => project !== undefined);

    // Also include projects created by the user
    const createdProjects = Array.from(this.projects.values())
      .filter(project => project.createdById === userId);

    // Combine and remove duplicates
    const allProjects = [...userProjects, ...createdProjects];
    const uniqueProjects = allProjects.filter((project, index, self) => 
      index === self.findIndex(p => p.id === project.id)
    );

    return uniqueProjects;
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
      const updatedCell = { ...existingCell, ...cell, updatedAt: new Date() };
      this.matrixCells.set(key, updatedCell);
      return updatedCell;
    } else {
      const newCell = {
        id: this.getNextId(),
        ...cell,
        createdAt: new Date(),
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

  // Additional missing methods for traceability
  async getTraceabilityMatrix(projectId: number): Promise<any[]> {
    return []; // Placeholder for now
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

  // Initialize with some default data
  private initializeDefaultData() {
    // Add default admin user
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

    // Add a sample project
    const sampleProject = {
      id: 1,
      name: "Sample Test Project",
      description: "A sample project for testing consolidated reports",
      status: "Active",
      createdById: 1,
      createdAt: new Date(),
    };
    this.projects.set(1, sampleProject);

    // Add sample modules
    const authModule = {
      id: 1,
      moduleId: "MOD-001",
      name: "Authentication",
      projectId: 1,
      description: "User authentication and authorization",
      status: "Active",
      createdAt: new Date(),
    };
    const dashboardModule = {
      id: 2,
      moduleId: "MOD-002", 
      name: "Dashboard",
      projectId: 1,
      description: "Main dashboard functionality",
      status: "Active",
      createdAt: new Date(),
    };
    this.modules.set(1, authModule);
    this.modules.set(2, dashboardModule);

    // Add sample test cases
    const testCase1 = {
      id: 1,
      testCaseId: "AUTH-TC-001",
      moduleId: 1,
      projectId: 1,
      feature: "User Login",
      scenario: "Valid user credentials",
      title: "Login with valid credentials",
      description: "Test login functionality with valid username and password",
      steps: "1. Navigate to login page\n2. Enter valid credentials\n3. Click login",
      expectedResult: "User should be logged in successfully",
      status: "Pass",
      priority: "High",
      assignedTo: 1,
      createdById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const testCase2 = {
      id: 2,
      testCaseId: "AUTH-TC-002",
      moduleId: 1,
      projectId: 1,
      feature: "User Login",
      scenario: "Invalid user credentials",
      title: "Login with invalid credentials",
      description: "Test login functionality with invalid credentials",
      steps: "1. Navigate to login page\n2. Enter invalid credentials\n3. Click login",
      expectedResult: "Should show error message",
      status: "Fail",
      priority: "High",
      assignedTo: 1,
      createdById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const testCase3 = {
      id: 3,
      testCaseId: "DASH-TC-001",
      moduleId: 2,
      projectId: 1,
      feature: "Dashboard",
      scenario: "Load dashboard data",
      title: "Dashboard data loading",
      description: "Test dashboard loads with proper data",
      steps: "1. Login to application\n2. Navigate to dashboard\n3. Verify data loads",
      expectedResult: "Dashboard should display all data correctly",
      status: "Blocked",
      priority: "Medium",
      assignedTo: 1,
      createdById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.testCases.set(1, testCase1);
    this.testCases.set(2, testCase2);
    this.testCases.set(3, testCase3);

    // Add sample bugs
    const bug1 = {
      id: 1,
      bugId: "BUG-001",
      moduleId: 1,
      projectId: 1,
      title: "Login button not responsive",
      description: "Login button does not respond to clicks on mobile devices",
      severity: "Critical",
      priority: "High",
      status: "Open",
      assignedTo: 1,
      reportedById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bug2 = {
      id: 2,
      bugId: "BUG-002",
      moduleId: 2,
      projectId: 1,
      title: "Dashboard loading slowly",
      description: "Dashboard takes too long to load on first visit",
      severity: "Major",
      priority: "Medium",
      status: "In Progress",
      assignedTo: 1,
      reportedById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bug3 = {
      id: 3,
      bugId: "BUG-003",
      moduleId: 1,
      projectId: 1,
      title: "Password reset email format",
      description: "Password reset email has incorrect formatting",
      severity: "Minor",
      priority: "Low",
      status: "Resolved",
      assignedTo: 1,
      reportedById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bugs.set(1, bug1);
    this.bugs.set(2, bug2);
    this.bugs.set(3, bug3);

    // Add project member
    this.addProjectMember({
      projectId: 1,
      userId: 1,
      role: "Admin",
    });

    this.nextId = 10;
    this.moduleCounter = 3;

    console.log("✅ Initialized sample data:", {
      users: this.users.size,
      projects: this.projects.size,
      modules: this.modules.size,
      testCases: this.testCases.size,
      bugs: this.bugs.size
    });
  }

  async updateTestCase(id: number, data: Partial<TestCase>): Promise<TestCase | null> {
    const testCase = this.testCases.get(id);
    if (!testCase) return null;

    const updatedTestCase = { ...testCase, ...data, updatedAt: new Date() };
    this.testCases.set(id, updatedTestCase);
    this.recordActivity('test_case', 'updated', id, data.assignedTo || testCase.assignedTo || 1);
    return updatedTestCase;
  }

  async updateTestCaseStatus(id: number, status: string): Promise<TestCase | null> {
    console.log(`Storage: updateTestCaseStatus(${id}, ${status})`);
    return this.updateTestCase(id, { status });
  }

  async updateBug(id: number, data: Partial<Bug>): Promise<Bug | null> {
    const bug = this.bugs.get(id);
    if (!bug) return null;

    const updatedBug = { ...bug, ...data, updatedAt: new Date() };
    this.bugs.set(id, updatedBug);
    this.recordActivity('bug', 'updated', id, data.assignedTo || bug.assignedTo);
    return updatedBug;
  }

  async updateBugStatus(id: number, status: string): Promise<Bug | null> {
    console.log(`Storage: updateBugStatus(${id}, ${status})`);
    return this.updateBug(id, { status });
  }

  // Reset storage method for testing
  resetStorage() {
    this.users.clear();
    this.projects.clear();
    this.modules.clear();
    this.testCases.clear();
    this.bugs.clear();
    this.documents.clear();
    this.documentFolders.clear();
    this.customers.clear();
    this.tags.clear();
    this.kanbanColumns.clear();
    this.kanbanCards.clear();
    this.customMarkers.clear();
    this.matrixCells.clear();
    this.projectMembers.clear();
    this.activities.clear();
    this.timeSheets.clear();
    this.timeSheetFolders.clear();
    this.customerProjects.clear();
    this.sprints.clear();
    this.nextId = 1;
    this.moduleCounter = 1;
    this.testCaseCounter = 1;
    this.bugCounter = 1;
    this.testSheetIdCounter = 1;
    this.testSheets.clear(); // Clear test sheets during reset

    // Re-initialize default data
    this.initializeDefaultData();
  }

   // GitHub Integration methods
  async getAllGitHubConfigs(): Promise<any[]> {
    return this.githubConfigs;
  }

  async getAllGitHubConfigs(): Promise<any[]> {
    return this.githubConfigs;
  }

  async getGitHubConfig(projectId: number): Promise<any | undefined> {
    return this.githubConfigs.find(config => config.projectId === projectId);
  }

  async createGitHubConfig(data: any): Promise<any> {
    const config = {
      id: this.githubConfigs.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.githubConfigs.push(config);
    return config;
  }

  async updateGitHubConfig(id: number, data: any): Promise<any | null> {
    const index = this.githubConfigs.findIndex(config => config.id === id);
    if (index === -1) return null;

    this.githubConfigs[index] = {
      ...this.githubConfigs[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.githubConfigs[index];
  }

  async createGitHubIssue(data: any): Promise<any> {
    const issue = {
      id: this.githubIssues.length + 1,
      ...data,
      createdAt: new Date().toISOString(),
    };
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
    return this.githubIssues.find(issue => issue.githubIssueId === githubId);
  }

  async updateGitHubIssue(id: number, data: any): Promise<any | null> {
    const index = this.githubIssues.findIndex(issue => issue.id === id);
    if (index === -1) return null;

    this.githubIssues[index] = {
      ...this.githubIssues[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.githubIssues[index];
  }
}

// Create and export the storage instance
console.log("🔄 Initializing in-memory storage...");
const memStorage = new MemStorage();
// Initialize with default data
(memStorage as any).initializeDefaultData();
export const storage: IStorage = memStorage;
console.log("✅ In-memory storage initialized successfully");

export async function closeConnection() {
  console.log("In-memory storage - no connection to close");
}