
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Tester' | 'Developer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestCase {
  id: number;
  testCaseId?: string;
  title: string;
  description?: string;
  preConditions?: string;
  testSteps: string;
  expectedResult: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Executed' | 'Passed' | 'Failed' | 'Blocked' | 'Skipped';
  projectId: number;
  moduleId?: number;
  assignedToId?: number;
  createdById: number;
  tags?: any[];
  attachments?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bug {
  id: number;
  bugId?: string;
  title: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Trivial';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  environment?: string;
  preConditions?: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  comments?: string;
  projectId: number;
  moduleId?: number;
  testCaseId?: number;
  assignedToId?: number;
  createdById: number;
  tags?: any[];
  attachments?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: 'Admin' | 'Manager' | 'Tester' | 'Developer';
  addedAt: Date;
}

export interface Document {
  id: number;
  name: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  projectId: number;
  folderId?: number;
  uploadedById: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFolder {
  id: number;
  name: string;
  projectId: number;
  parentId?: number;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubConfig {
  id: number;
  projectId: number;
  repoOwner: string;
  repoName: string;
  accessToken: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubIssue {
  id: number;
  bugId: number;
  githubIssueNumber: number;
  githubUrl: string;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSheet {
  id: number;
  name: string;
  projectId: number;
  data: any;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomMarker {
  id: number;
  label: string;
  projectId: number;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TraceabilityLink {
  id: number;
  testCaseId: number;
  targetId: number;
  targetType: string;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestExecution {
  id: number;
  testCaseId: number;
  status: 'Passed' | 'Failed' | 'Blocked' | 'Skipped';
  executedById: number;
  executedAt: Date;
  comments?: string;
  attachments?: any[];
}

class InMemoryStorage {
  private users: Map<number, User> = new Map();
  private projects: Map<number, Project> = new Map();
  private modules: Map<number, Module> = new Map();
  private testCases: Map<number, TestCase> = new Map();
  private bugs: Map<number, Bug> = new Map();
  private projectMembers: Map<number, ProjectMember> = new Map();
  private documents: Map<number, Document> = new Map();
  private documentFolders: Map<number, DocumentFolder> = new Map();
  private githubConfigs: Map<number, GitHubConfig> = new Map();
  private githubIssues: Map<number, GitHubIssue> = new Map();
  private testSheets: Map<number, TestSheet> = new Map();
  private customMarkers: Map<number, CustomMarker> = new Map();
  private traceabilityLinks: Map<number, TraceabilityLink> = new Map();
  private testExecutions: Map<number, TestExecution> = new Map();

  private nextUserId = 1;
  private nextProjectId = 1;
  private nextModuleId = 1;
  private nextTestCaseId = 1;
  private nextBugId = 1;
  private nextProjectMemberId = 1;
  private nextDocumentId = 1;
  private nextDocumentFolderId = 1;
  private nextGitHubConfigId = 1;
  private nextGitHubIssueId = 1;
  private nextTestSheetId = 1;
  private nextCustomMarkerId = 1;
  private nextTraceabilityLinkId = 1;
  private nextTestExecutionId = 1;

  async clear(): Promise<void> {
    this.users.clear();
    this.projects.clear();
    this.modules.clear();
    this.testCases.clear();
    this.bugs.clear();
    this.projectMembers.clear();
    this.documents.clear();
    this.documentFolders.clear();
    this.githubConfigs.clear();
    this.githubIssues.clear();
    this.testSheets.clear();
    this.customMarkers.clear();
    this.traceabilityLinks.clear();
    this.testExecutions.clear();

    this.nextUserId = 1;
    this.nextProjectId = 1;
    this.nextModuleId = 1;
    this.nextTestCaseId = 1;
    this.nextBugId = 1;
    this.nextProjectMemberId = 1;
    this.nextDocumentId = 1;
    this.nextDocumentFolderId = 1;
    this.nextGitHubConfigId = 1;
    this.nextGitHubIssueId = 1;
    this.nextTestSheetId = 1;
    this.nextCustomMarkerId = 1;
    this.nextTraceabilityLinkId = 1;
    this.nextTestExecutionId = 1;
  }

  // User methods
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const user: User = {
      id: this.nextUserId++,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Project methods
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: this.nextProjectId++,
      ...projectData,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(project.id, project);
    return project;
  }

  async getProject(id: number): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    const userProjects = [];

    // Get projects created by user
    for (const project of this.projects.values()) {
      if (project.createdById === userId) {
        userProjects.push(project);
      }
    }

    // Get projects where user is a member
    for (const member of this.projectMembers.values()) {
      if (member.userId === userId) {
        const project = this.projects.get(member.projectId);
        if (project && !userProjects.some(p => p.id === project.id)) {
          userProjects.push(project);
        }
      }
    }

    return userProjects;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | null> {
    const project = this.projects.get(id);
    if (!project) return null;

    const updatedProject = {
      ...project,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    // Delete related data
    for (const [moduleId, module] of this.modules.entries()) {
      if (module.projectId === id) {
        this.modules.delete(moduleId);
      }
    }

    for (const [testCaseId, testCase] of this.testCases.entries()) {
      if (testCase.projectId === id) {
        this.testCases.delete(testCaseId);
      }
    }

    for (const [bugId, bug] of this.bugs.entries()) {
      if (bug.projectId === id) {
        this.bugs.delete(bugId);
      }
    }

    for (const [memberId, member] of this.projectMembers.entries()) {
      if (member.projectId === id) {
        this.projectMembers.delete(memberId);
      }
    }

    return this.projects.delete(id);
  }

  // Module methods
  async createModule(moduleData: Omit<Module, 'id' | 'createdAt' | 'updatedAt'>): Promise<Module> {
    const now = new Date();
    const module: Module = {
      id: this.nextModuleId++,
      ...moduleData,
      createdAt: now,
      updatedAt: now,
    };
    this.modules.set(module.id, module);
    return module;
  }

  async getModule(id: number): Promise<Module | null> {
    return this.modules.get(id) || null;
  }

  async getModulesByProjectId(projectId: number): Promise<Module[]> {
    const modules = [];
    for (const module of this.modules.values()) {
      if (module.projectId === projectId) {
        modules.push(module);
      }
    }
    return modules;
  }

  async updateModule(id: number, updates: Partial<Module>): Promise<Module | null> {
    const module = this.modules.get(id);
    if (!module) return null;

    const updatedModule = {
      ...module,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }

  async deleteModule(id: number): Promise<boolean> {
    return this.modules.delete(id);
  }

  // Test Case methods
  async createTestCase(testCaseData: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestCase> {
    const now = new Date();
    const testCase: TestCase = {
      id: this.nextTestCaseId++,
      ...testCaseData,
      createdAt: now,
      updatedAt: now,
    };
    this.testCases.set(testCase.id, testCase);
    return testCase;
  }

  async getTestCase(id: number): Promise<TestCase | null> {
    return this.testCases.get(id) || null;
  }

  async getTestCasesByProjectId(projectId: number): Promise<TestCase[]> {
    const testCases = [];
    for (const testCase of this.testCases.values()) {
      if (testCase.projectId === projectId) {
        testCases.push(testCase);
      }
    }
    return testCases;
  }

  async updateTestCase(id: number, updates: Partial<TestCase>): Promise<TestCase | null> {
    const testCase = this.testCases.get(id);
    if (!testCase) return null;

    const updatedTestCase = {
      ...testCase,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.testCases.set(id, updatedTestCase);
    return updatedTestCase;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    return this.testCases.delete(id);
  }

  // Bug methods
  async createBug(bugData: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bug> {
    const now = new Date();
    const bug: Bug = {
      id: this.nextBugId++,
      ...bugData,
      createdAt: now,
      updatedAt: now,
    };
    this.bugs.set(bug.id, bug);
    return bug;
  }

  async getBug(id: number): Promise<Bug | null> {
    return this.bugs.get(id) || null;
  }

  async getBugsByProjectId(projectId: number): Promise<Bug[]> {
    const bugs = [];
    for (const bug of this.bugs.values()) {
      if (bug.projectId === projectId) {
        bugs.push(bug);
      }
    }
    return bugs;
  }

  async updateBug(id: number, updates: Partial<Bug>): Promise<Bug | null> {
    const bug = this.bugs.get(id);
    if (!bug) return null;

    const updatedBug = {
      ...bug,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.bugs.set(id, updatedBug);
    return updatedBug;
  }

  async deleteBug(id: number): Promise<boolean> {
    return this.bugs.delete(id);
  }

  // Project Member methods
  async addProjectMember(memberData: Omit<ProjectMember, 'id' | 'addedAt'>): Promise<ProjectMember> {
    const member: ProjectMember = {
      id: this.nextProjectMemberId++,
      ...memberData,
      addedAt: new Date(),
    };
    this.projectMembers.set(member.id, member);
    return member;
  }

  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    const members = [];
    for (const member of this.projectMembers.values()) {
      if (member.projectId === projectId) {
        members.push(member);
      }
    }
    return members;
  }

  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    for (const [id, member] of this.projectMembers.entries()) {
      if (member.projectId === projectId && member.userId === userId) {
        return this.projectMembers.delete(id);
      }
    }
    return false;
  }

  // Document methods
  async createDocument(documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    const now = new Date();
    const document: Document = {
      id: this.nextDocumentId++,
      ...documentData,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(document.id, document);
    return document;
  }

  async getDocument(id: number): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async getDocumentsByProjectId(projectId: number, folderId?: number): Promise<Document[]> {
    const documents = [];
    for (const document of this.documents.values()) {
      if (document.projectId === projectId && document.folderId === folderId) {
        documents.push(document);
      }
    }
    return documents;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Document Folder methods
  async createDocumentFolder(folderData: Omit<DocumentFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentFolder> {
    const now = new Date();
    const folder: DocumentFolder = {
      id: this.nextDocumentFolderId++,
      ...folderData,
      createdAt: now,
      updatedAt: now,
    };
    this.documentFolders.set(folder.id, folder);
    return folder;
  }

  async getDocumentFolder(id: number): Promise<DocumentFolder | null> {
    return this.documentFolders.get(id) || null;
  }

  async getDocumentFoldersByProjectId(projectId: number, parentId?: number): Promise<DocumentFolder[]> {
    const folders = [];
    for (const folder of this.documentFolders.values()) {
      if (folder.projectId === projectId && folder.parentId === parentId) {
        folders.push(folder);
      }
    }
    return folders;
  }

  async updateDocumentFolder(id: number, updates: Partial<DocumentFolder>): Promise<DocumentFolder | null> {
    const folder = this.documentFolders.get(id);
    if (!folder) return null;

    const updatedFolder = {
      ...folder,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    this.documentFolders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteDocumentFolder(id: number): Promise<boolean> {
    return this.documentFolders.delete(id);
  }

  // GitHub Config methods
  async createGitHubConfig(configData: Omit<GitHubConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<GitHubConfig> {
    const now = new Date();
    const config: GitHubConfig = {
      id: this.nextGitHubConfigId++,
      ...configData,
      createdAt: now,
      updatedAt: now,
    };
    this.githubConfigs.set(config.id, config);
    return config;
  }

  async getGitHubConfig(projectId: number): Promise<GitHubConfig | null> {
    for (const config of this.githubConfigs.values()) {
      if (config.projectId === projectId) {
        return config;
      }
    }
    return null;
  }

  async updateGitHubConfig(projectId: number, updates: Partial<GitHubConfig>): Promise<GitHubConfig | null> {
    for (const [id, config] of this.githubConfigs.entries()) {
      if (config.projectId === projectId) {
        const updatedConfig = {
          ...config,
          ...updates,
          updatedAt: new Date(),
        };
        this.githubConfigs.set(id, updatedConfig);
        return updatedConfig;
      }
    }
    return null;
  }

  async deleteGitHubConfig(projectId: number): Promise<boolean> {
    for (const [id, config] of this.githubConfigs.entries()) {
      if (config.projectId === projectId) {
        return this.githubConfigs.delete(id);
      }
    }
    return false;
  }

  // GitHub Issue methods
  async createGitHubIssue(issueData: Omit<GitHubIssue, 'id' | 'createdAt' | 'updatedAt'>): Promise<GitHubIssue> {
    const now = new Date();
    const issue: GitHubIssue = {
      id: this.nextGitHubIssueId++,
      ...issueData,
      createdAt: now,
      updatedAt: now,
    };
    this.githubIssues.set(issue.id, issue);
    return issue;
  }

  async getGitHubIssue(id: number): Promise<GitHubIssue | null> {
    return this.githubIssues.get(id) || null;
  }

  async getGitHubIssueByBugId(bugId: number): Promise<GitHubIssue | null> {
    for (const issue of this.githubIssues.values()) {
      if (issue.bugId === bugId) {
        return issue;
      }
    }
    return null;
  }

  async updateGitHubIssue(id: number, updates: Partial<GitHubIssue>): Promise<GitHubIssue | null> {
    const issue = this.githubIssues.get(id);
    if (!issue) return null;

    const updatedIssue = {
      ...issue,
      ...updates,
      updatedAt: new Date(),
    };
    this.githubIssues.set(id, updatedIssue);
    return updatedIssue;
  }

  // Test Sheet methods
  async createTestSheet(sheetData: Omit<TestSheet, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestSheet> {
    const now = new Date();
    const sheet: TestSheet = {
      id: this.nextTestSheetId++,
      ...sheetData,
      createdAt: now,
      updatedAt: now,
    };
    this.testSheets.set(sheet.id, sheet);
    return sheet;
  }

  async getTestSheet(id: number): Promise<TestSheet | null> {
    return this.testSheets.get(id) || null;
  }

  async getTestSheetsByProjectId(projectId: number): Promise<TestSheet[]> {
    const sheets = [];
    for (const sheet of this.testSheets.values()) {
      if (sheet.projectId === projectId) {
        sheets.push(sheet);
      }
    }
    return sheets;
  }

  async updateTestSheet(id: number, updates: Partial<TestSheet>): Promise<TestSheet | null> {
    const sheet = this.testSheets.get(id);
    if (!sheet) return null;

    const updatedSheet = {
      ...sheet,
      ...updates,
      updatedAt: new Date(),
    };
    this.testSheets.set(id, updatedSheet);
    return updatedSheet;
  }

  async deleteTestSheet(id: number): Promise<boolean> {
    return this.testSheets.delete(id);
  }

  // Custom Marker methods
  async createCustomMarker(markerData: Omit<CustomMarker, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomMarker> {
    const now = new Date();
    const marker: CustomMarker = {
      id: this.nextCustomMarkerId++,
      ...markerData,
      createdAt: now,
      updatedAt: now,
    };
    this.customMarkers.set(marker.id, marker);
    return marker;
  }

  async getCustomMarker(id: number): Promise<CustomMarker | null> {
    return this.customMarkers.get(id) || null;
  }

  async getCustomMarkersByProjectId(projectId: number): Promise<CustomMarker[]> {
    const markers = [];
    for (const marker of this.customMarkers.values()) {
      if (marker.projectId === projectId) {
        markers.push(marker);
      }
    }
    return markers;
  }

  async updateCustomMarker(id: number, updates: Partial<CustomMarker>): Promise<CustomMarker | null> {
    const marker = this.customMarkers.get(id);
    if (!marker) return null;

    const updatedMarker = {
      ...marker,
      ...updates,
      updatedAt: new Date(),
    };
    this.customMarkers.set(id, updatedMarker);
    return updatedMarker;
  }

  async deleteCustomMarker(id: number): Promise<boolean> {
    return this.customMarkers.delete(id);
  }

  // Traceability Link methods
  async createTraceabilityLink(linkData: Omit<TraceabilityLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<TraceabilityLink> {
    const now = new Date();
    const link: TraceabilityLink = {
      id: this.nextTraceabilityLinkId++,
      ...linkData,
      createdAt: now,
      updatedAt: now,
    };
    this.traceabilityLinks.set(link.id, link);
    return link;
  }

  async getTraceabilityLinksByProjectId(projectId: number): Promise<TraceabilityLink[]> {
    const links = [];
    for (const link of this.traceabilityLinks.values()) {
      if (link.projectId === projectId) {
        links.push(link);
      }
    }
    return links;
  }

  async deleteTraceabilityLink(id: number): Promise<boolean> {
    return this.traceabilityLinks.delete(id);
  }

  // Test Execution methods
  async createTestExecution(executionData: Omit<TestExecution, 'id'>): Promise<TestExecution> {
    const execution: TestExecution = {
      id: this.nextTestExecutionId++,
      ...executionData,
    };
    this.testExecutions.set(execution.id, execution);
    return execution;
  }

  async getTestExecutionsByTestCaseId(testCaseId: number): Promise<TestExecution[]> {
    const executions = [];
    for (const execution of this.testExecutions.values()) {
      if (execution.testCaseId === testCaseId) {
        executions.push(execution);
      }
    }
    return executions;
  }
}

export const storage = new InMemoryStorage();
