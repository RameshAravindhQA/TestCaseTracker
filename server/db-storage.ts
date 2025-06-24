import { db } from './db';
import { 
  type User, type InsertUser,
  type Project, type InsertProject,
  type ProjectMember, type InsertProjectMember,
  type Module, type InsertModule,
  type TestCase, type InsertTestCase,
  type Bug, type InsertBug,
  type Activity, type InsertActivity,
  type DocumentFolder, type InsertDocumentFolder,
  type Document, type InsertDocument,
  type Tag, type InsertTag,
  type Customer, type InsertCustomer,
  type CustomerProject, type InsertCustomerProject,
  type TimeSheet, type InsertTimeSheet,
  type TimeSheetFolder, type InsertTimeSheetFolder,
  type AutomationScript, type InsertAutomationScript,
  type AutomationRun, type InsertAutomationRun,
  type AutomationSchedule, type InsertAutomationSchedule,
  type AutomationEnvironment, type InsertAutomationEnvironment,
  type Sprint, type InsertSprint,
  type KanbanColumn, type InsertKanbanColumn,
  type KanbanCard, type InsertKanbanCard,
  type CustomMarker, type InsertCustomMarker,
  type MatrixCell, type InsertMatrixCell,
  type TraceabilityMatrix, type InsertTraceabilityMatrix,
  type TraceabilityModule, type InsertTraceabilityModule,
  type TraceabilityMarker, type InsertTraceabilityMarker,
  type TraceabilityMatrixCell, type InsertTraceabilityMatrixCell,
  users, projects, projectMembers, modules, testCases, bugs, activities,
  documentFolders, documents, tags, customers, customerProjects,
  timeSheets, timeSheetFolders, 
  automationScripts, automationRuns, automationSchedules, automationEnvironments,
  sprints, kanbanColumns, kanbanCards,
  matrixCells, customMarkers,
  traceabilityMatrix, traceabilityModules, traceabilityMarkers, traceabilityMatrixCells
} from '@shared/schema';
import { type FlowDiagram, type InsertFlowDiagram } from "../shared/functional-flow-types";
import { IStorage } from './storage';
import { eq, and, desc, asc } from 'drizzle-orm';

/**
 * Complete PostgreSQL database storage implementation
 */
export class DatabaseStorage implements IStorage {

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...insertUser,
      createdAt: new Date()
    }).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    const userProjectIds = await db.select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    if (userProjectIds.length === 0) return [];

    return await db.select().from(projects)
      .where(eq(projects.id, userProjectIds[0].projectId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values({
      ...insertProject,
      createdAt: new Date()
    }).returning();
    return newProject;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db.update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    await db.delete(projects).where(eq(projects.id, id));
    return true;
  }

  // Project members operations
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
  }

  async addProjectMember(insertMember: InsertProjectMember): Promise<ProjectMember> {
    const [newMember] = await db.insert(projectMembers).values(insertMember).returning();
    return newMember;
  }

  async removeProjectMember(projectId: number, userId: number): Promise<boolean> {
    await db.delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
    return true;
  }

  // Module operations
  async getModules(projectId: number): Promise<Module[]> {
    return await db.select().from(modules).where(eq(modules.projectId, projectId));
  }

  async getModule(id: number): Promise<Module | undefined> {
    const result = await db.select().from(modules).where(eq(modules.id, id));
    return result[0];
  }

  async createModule(data: any): Promise<any> {
    // Get the project to access its prefix
    const [project] = await db.select().from(projects).where(eq(projects.id, data.projectId));
    if (!project) {
      throw new Error(`Project with ID ${data.projectId} not found`);
    }

    const projectPrefix = project.prefix || 'DEF'; // Default prefix if not set

    // Get existing modules for this specific project only
    const existingModules = await db
      .select()
      .from(modules)
      .where(eq(modules.projectId, data.projectId));

    console.log('DB: Project modules found:', existingModules.length, 'for project:', data.projectId);

    // Find the highest module number for this project to ensure proper sequencing
    const modulePattern = new RegExp(`^${projectPrefix}-MOD-(\\d+)$`);
    const existingNumbers = existingModules
      .map(module => {
        const match = module.moduleId?.match(modulePattern);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const moduleId = `${projectPrefix}-MOD-${String(nextNumber).padStart(2, '0')}`;

    console.log('DB: Generated module ID:', moduleId, 'for project:', data.projectId, 'with prefix:', projectPrefix, 'existing numbers:', existingNumbers);

    const [module] = await db
      .insert(modules)
      .values({
        moduleId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return module;
  }

  async updateModule(id: number, moduleData: Partial<Module>): Promise<Module | undefined> {
    const [updatedModule] = await db.update(modules)
      .set(moduleData)
      .where(eq(modules.id, id))
      .returning();
    return updatedModule;
  }

  async deleteModule(id: number): Promise<boolean> {
    await db.delete(modules).where(eq(modules.id, id));
    return true;
  }

  // Test case operations
  async getTestCases(projectId: number, moduleId?: number): Promise<TestCase[]> {
    if (moduleId) {
      return await db.select().from(testCases)
        .where(and(eq(testCases.projectId, projectId), eq(testCases.moduleId, moduleId)));
    }
    return await db.select().from(testCases).where(eq(testCases.projectId, projectId));
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    const result = await db.select().from(testCases).where(eq(testCases.id, id));
    return result[0];
  }

  async createTestCase(insertTestCase: InsertTestCase): Promise<TestCase> {
    const [newTestCase] = await db.insert(testCases).values({
      ...insertTestCase,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newTestCase;
  }

  async updateTestCase(id: number, testCaseData: Partial<TestCase>): Promise<TestCase | undefined> {
    const [updatedTestCase] = await db.update(testCases)
      .set({ ...testCaseData, updatedAt: new Date() })
      .where(eq(testCases.id, id))
      .returning();
    return updatedTestCase;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    await db.delete(testCases).where(eq(testCases.id, id));
    return true;
  }

  // Bug operations
  async getBugs(projectId: number, moduleId?: number): Promise<Bug[]> {
    if (moduleId) {
      return await db.select().from(bugs)
        .where(and(eq(bugs.projectId, projectId), eq(bugs.moduleId, moduleId)));
    }
    return await db.select().from(bugs).where(eq(bugs.projectId, projectId));
  }

  async getBug(id: number): Promise<Bug | undefined> {
    const result = await db.select().from(bugs).where(eq(bugs.id, id));
    return result[0];
  }

  async createBug(insertBug: InsertBug): Promise<Bug> {
    const [newBug] = await db.insert(bugs).values({
      ...insertBug,
      dateReported: new Date(),
      updatedAt: new Date()
    }).returning();
    return newBug;
  }

  async updateBug(id: number, bugData: Partial<Bug>): Promise<Bug | undefined> {
    const [updatedBug] = await db.update(bugs)
      .set({ ...bugData, updatedAt: new Date() })
      .where(eq(bugs.id, id))
      .returning();
    return updatedBug;
  }

  async deleteBug(id: number): Promise<boolean> {
    await db.delete(bugs).where(eq(bugs.id, id));
    return true;
  }

  // Document folder operations
  async getDocumentFolders(projectId: number): Promise<DocumentFolder[]> {
    return await db.select().from(documentFolders).where(eq(documentFolders.projectId, projectId));
  }

  async getDocumentFolder(id: number): Promise<DocumentFolder | undefined> {
    const result = await db.select().from(documentFolders).where(eq(documentFolders.id, id));
    return result[0];
  }

  async createDocumentFolder(insertFolder: InsertDocumentFolder): Promise<DocumentFolder> {
    const [newFolder] = await db.insert(documentFolders).values({
      ...insertFolder,
      createdAt: new Date()
    }).returning();
    return newFolder;
  }

  async updateDocumentFolder(id: number, folderData: Partial<DocumentFolder>): Promise<DocumentFolder | undefined> {
    const [updatedFolder] = await db.update(documentFolders)
      .set(folderData)
      .where(eq(documentFolders.id, id))
      .returning();
    return updatedFolder;
  }

  async deleteDocumentFolder(id: number): Promise<boolean> {
    await db.delete(documentFolders).where(eq(documentFolders.id, id));
    return true;
  }

  // Document operations
  async getDocuments(projectId: number, folderId?: number): Promise<Document[]> {
    if (folderId !== undefined) {
      return await db.select().from(documents)
        .where(and(eq(documents.projectId, projectId), eq(documents.folderId, folderId)));
    }
    return await db.select().from(documents).where(eq(documents.projectId, projectId));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values({
      ...insertDocument,
      uploadedAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newDocument;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db.update(documents)
      .set({ ...documentData, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    await db.delete(documents).where(eq(documents.id, id));
    return true;
  }

  // TimeSheet operations
  async getTimeSheets(projectId?: number, userId?: number): Promise<TimeSheet[]> {
    let query = db.select().from(timeSheets);

    if (projectId && userId) {
      return await query.where(and(eq(timeSheets.projectId, projectId), eq(timeSheets.userId, userId)));
    } else if (projectId) {
      return await query.where(eq(timeSheets.projectId, projectId));
    } else if (userId) {
      return await query.where(eq(timeSheets.userId, userId));
    }

    return await query;
  }

  async getUserTimeSheets(userId: number): Promise<TimeSheet[]> {
    return await db.select().from(timeSheets).where(eq(timeSheets.userId, userId));
  }

  async getProjectTimeSheets(projectId: number): Promise<TimeSheet[]> {
    return await db.select().from(timeSheets).where(eq(timeSheets.projectId, projectId));
  }

  async getTimeSheet(id: number): Promise<TimeSheet | undefined> {
    const result = await db.select().from(timeSheets).where(eq(timeSheets.id, id));
    return result[0];
  }

  async createTimeSheet(insertTimeSheet: InsertTimeSheet): Promise<TimeSheet> {
    const [newTimeSheet] = await db.insert(timeSheets).values({
      ...insertTimeSheet,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newTimeSheet;
  }

  async updateTimeSheet(id: number, timeSheetData: Partial<TimeSheet>): Promise<TimeSheet | undefined> {
    const [updatedTimeSheet] = await db.update(timeSheets)
      .set({ ...timeSheetData, updatedAt: new Date() })
      .where(eq(timeSheets.id, id))
      .returning();
    return updatedTimeSheet;
  }

  async deleteTimeSheet(id: number): Promise<boolean> {
    await db.delete(timeSheets).where(eq(timeSheets.id, id));
    return true;
  }

  async approveTimeSheet(id: number, approverId: number): Promise<TimeSheet | undefined> {
    const [approvedTimeSheet] = await db.update(timeSheets)
      .set({
        status: "Approved",
        approvedById: approverId,
        approvalDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(timeSheets.id, id))
      .returning();
    return approvedTimeSheet;
  }

  async rejectTimeSheet(id: number, approverId: number, reason: string): Promise<TimeSheet | undefined> {
    const [rejectedTimeSheet] = await db.update(timeSheets)
      .set({
        status: "Rejected",
        approvedById: approverId,
        approvalDate: new Date(),
        comments: reason,
        updatedAt: new Date()
      })
      .where(eq(timeSheets.id, id))
      .returning();
    return rejectedTimeSheet;
  }

  // Activity operations
  async getActivities(limit: number = 10): Promise<Activity[]> {
    return await db.select().from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async getProjectActivities(projectId: number, limit: number = 10): Promise<Activity[]> {
    return await db.select().from(activities)
      .where(eq(activities.entityId, projectId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values({
      ...insertActivity,
      timestamp: new Date()
    }).returning();
    return newActivity;
  }

  // Tag operations
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getTagsByProject(projectId: number): Promise<Tag[]> {
    return await db.select().from(tags).where(eq(tags.projectId, projectId));
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values({
      ...insertTag,
      createdAt: new Date()
    }).returning();
    return newTag;
  }

  // TimeSheet Folder operations
  async getTimeSheetFolders(userId: number): Promise<TimeSheetFolder[]> {
    return await db.select().from(timeSheetFolders).where(eq(timeSheetFolders.userId, userId));
  }

  async getTimeSheetFolder(id: number): Promise<TimeSheetFolder | undefined> {
    const result = await db.select().from(timeSheetFolders).where(eq(timeSheetFolders.id, id));
    return result[0];
  }

  async createTimeSheetFolder(insertFolder: InsertTimeSheetFolder): Promise<TimeSheetFolder> {
    const [newFolder] = await db.insert(timeSheetFolders).values({
      ...insertFolder,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newFolder;
  }

  async updateTimeSheetFolder(id: number, folderData: Partial<TimeSheetFolder>): Promise<TimeSheetFolder | undefined> {
    const [updatedFolder] = await db.update(timeSheetFolders)
      .set({ ...folderData, updatedAt: new Date() })
      .where(eq(timeSheetFolders.id, id))
      .returning();
    return updatedFolder;
  }

  async deleteTimeSheetFolder(id: number): Promise<boolean> {
    await db.delete(timeSheetFolders).where(eq(timeSheetFolders.id, id));
    return true;
  }

  async getTimeSheetsByFolder(folderId: number): Promise<TimeSheet[]> {
    return await db.select().from(timeSheets).where(eq(timeSheets.folderId, folderId));
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getCustomersByStatus(status: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.status, status));
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values({
      ...insertCustomer,
      createdAt: new Date()
    }).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db.update(customers)
      .set(customerData)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  // Customer Project operations
  async getCustomerProjects(): Promise<CustomerProject[]> {
    return await db.select().from(customerProjects);
  }

  async getProjectsByCustomerId(customerId: number): Promise<Project[]> {
    const projectIds = await db.select({ projectId: customerProjects.projectId })
      .from(customerProjects)
      .where(eq(customerProjects.customerId, customerId));

    if (projectIds.length === 0) return [];

    return await db.select().from(projects)
      .where(eq(projects.id, projectIds[0].projectId));
  }

  async getCustomersByProjectId(projectId: number): Promise<Customer[]> {
    const customerIds = await db.select({ customerId: customerProjects.customerId })
      .from(customerProjects)
      .where(eq(customerProjects.projectId, projectId));

    if (customerIds.length === 0) return [];

    return await db.select().from(customers)
      .where(eq(customers.id, customerIds[0].customerId));
  }

  async createCustomerProject(insertCustomerProject: InsertCustomerProject): Promise<CustomerProject> {
    const [newCustomerProject] = await db.insert(customerProjects).values({
      ...insertCustomerProject,
      createdAt: new Date()
    }).returning();
    return newCustomerProject;
  }

  async deleteCustomerProject(id: number): Promise<boolean> {
    await db.delete(customerProjects).where(eq(customerProjects.id, id));
    return true;
  }

  // Dashboard statistics
  async getDashboardStats(userId?: number): Promise<{
    totalProjects: number;
    totalTestCases: number;
    openBugs: number;
    passRate: number;
  }> {
    // Implementation for dashboard stats using database queries
    const projectsResult = await db.select().from(projects);
    const testCasesResult = await db.select().from(testCases);
    const bugsResult = await db.select().from(bugs);

    const totalProjects = projectsResult.length;
    const totalTestCases = testCasesResult.length;
    const passedTests = testCasesResult.filter(tc => tc.status === 'Pass').length;
    const openBugs = bugsResult.filter(bug => bug.status === 'Open' || bug.status === 'In Progress').length;
    const passRate = totalTestCases > 0 ? Math.round((passedTests / totalTestCases) * 100) : 0;

    return {
      totalProjects,
      totalTestCases,
      openBugs,
      passRate
    };
  }

  // Automation Scripts operations
  async getAutomationScripts(projectId?: number): Promise<AutomationScript[]> {
    if (projectId) {
      return await db.select().from(automationScripts).where(eq(automationScripts.projectId, projectId));
    }
    return await db.select().from(automationScripts);
  }

  async getAutomationScript(id: number): Promise<AutomationScript | undefined> {
    const result = await db.select().from(automationScripts).where(eq(automationScripts.id, id));
    return result[0];
  }

  async createAutomationScript(script: InsertAutomationScript): Promise<AutomationScript> {
    const [newScript] = await db.insert(automationScripts).values({
      ...script,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newScript;
  }

  async updateAutomationScript(id: number, scriptData: Partial<AutomationScript>): Promise<AutomationScript | undefined> {
    const [updatedScript] = await db.update(automationScripts)
      .set({ ...scriptData, updatedAt: new Date() })
      .where(eq(automationScripts.id, id))
      .returning();
    return updatedScript;
  }

  async deleteAutomationScript(id: number): Promise<boolean> {
    await db.delete(automationScripts).where(eq(automationScripts.id, id));
    return true;
  }

  // Automation Runs operations
  async getAutomationRuns(scriptId?: number): Promise<AutomationRun[]> {
    if (scriptId) {
      return await db.select().from(automationRuns).where(eq(automationRuns.scriptId, scriptId));
    }
    return await db.select().from(automationRuns);
  }

  async getAutomationRun(id: number): Promise<AutomationRun | undefined> {
    const result = await db.select().from(automationRuns).where(eq(automationRuns.id, id));
    return result[0];
  }

  async createAutomationRun(run: InsertAutomationRun): Promise<AutomationRun> {
    const [newRun] = await db.insert(automationRuns).values({
      ...run,
      createdAt: new Date()
    }).returning();
    return newRun;
  }

  async updateAutomationRun(id: number, runData: Partial<AutomationRun>): Promise<AutomationRun | undefined> {
    const [updatedRun] = await db.update(automationRuns)
      .set(runData)
      .where(eq(automationRuns.id, id))
      .returning();
    return updatedRun;
  }

  // Automation Schedules operations
  async getAutomationSchedules(): Promise<AutomationSchedule[]> {
    return await db.select().from(automationSchedules);
  }

  async getAutomationSchedule(id: number): Promise<AutomationSchedule | undefined> {
    const result = await db.select().from(automationSchedules).where(eq(automationSchedules.id, id));
    return result[0];
  }

  async createAutomationSchedule(schedule: InsertAutomationSchedule): Promise<AutomationSchedule> {
    const [newSchedule] = await db.insert(automationSchedules).values({
      ...schedule,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newSchedule;
  }

  async updateAutomationSchedule(id: number, scheduleData: Partial<AutomationSchedule>): Promise<AutomationSchedule | undefined> {
    const [updatedSchedule] = await db.update(automationSchedules)
      .set({ ...scheduleData, updatedAt: new Date() })
      .where(eq(automationSchedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteAutomationSchedule(id: number): Promise<boolean> {
    await db.delete(automationSchedules).where(eq(automationSchedules.id, id));
    return true;
  }

  // Automation Environments operations
  async getAutomationEnvironments(): Promise<AutomationEnvironment[]> {
    return await db.select().from(automationEnvironments);
  }

  async getAutomationEnvironment(id: number): Promise<AutomationEnvironment | undefined> {
    const result = await db.select().from(automationEnvironments).where(eq(automationEnvironments.id, id));
    return result[0];
  }

  async createAutomationEnvironment(environment: InsertAutomationEnvironment): Promise<AutomationEnvironment> {
    const [newEnvironment] = await db.insert(automationEnvironments).values({
      ...environment,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newEnvironment;
  }

  async updateAutomationEnvironment(id: number, environmentData: Partial<AutomationEnvironment>): Promise<AutomationEnvironment | undefined> {
    const [updatedEnvironment] = await db.update(automationEnvironments)
      .set({ ...environmentData, updatedAt: new Date() })
      .where(eq(automationEnvironments.id, id))
      .returning();
    return updatedEnvironment;
  }

  async deleteAutomationEnvironment(id: number): Promise<boolean> {
    await db.delete(automationEnvironments).where(eq(automationEnvironments.id, id));
    return true;
  }

  // Sprint operations
  async getSprints(projectId?: number): Promise<Sprint[]> {
    if (projectId) {
      return await db.select().from(sprints).where(eq(sprints.projectId, projectId));
    }
    return await db.select().from(sprints);
  }

  async getSprint(id: number): Promise<Sprint | undefined> {
    const result = await db.select().from(sprints).where(eq(sprints.id, id));
    return result[0];
  }

  async createSprint(insertSprint: InsertSprint): Promise<Sprint> {
    const [newSprint] = await db.insert(sprints).values({
      ...insertSprint,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newSprint;
  }

  async updateSprint(id: number, sprintData: Partial<Sprint>): Promise<Sprint> {
    const [updatedSprint] = await db.update(sprints)
      .set({ ...sprintData, updatedAt: new Date() })
      .where(eq(sprints.id, id))
      .returning();
    return updatedSprint;
  }

  async deleteSprint(id: number): Promise<boolean> {
    await db.delete(sprints).where(eq(sprints.id, id));
    return true;
  }

  // Kanban Column operations
  async getKanbanColumns(projectId?: number, sprintId?: number): Promise<KanbanColumn[]> {
    let query = db.select().from(kanbanColumns);

    if (projectId && sprintId) {
      return await query.where(and(eq(kanbanColumns.projectId, projectId), eq(kanbanColumns.sprintId, sprintId)));
    } else if (projectId) {
      return await query.where(eq(kanbanColumns.projectId, projectId));
    } else if (sprintId) {
      return await query.where(eq(kanbanColumns.sprintId, sprintId));
    }

    return await query;
  }

  async getKanbanColumn(id: number): Promise<KanbanColumn | undefined> {
    const result = await db.select().from(kanbanColumns).where(eq(kanbanColumns.id, id));
    return result[0];
  }

  async createKanbanColumn(insertColumn: InsertKanbanColumn): Promise<KanbanColumn> {
    const [newColumn] = await db.insert(kanbanColumns).values({
      ...insertColumn,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newColumn;
  }

  async updateKanbanColumn(id: number, columnData: Partial<KanbanColumn>): Promise<KanbanColumn> {
    const [updatedColumn] = await db.update(kanbanColumns)
      .set({ ...columnData, updatedAt: new Date() })
      .where(eq(kanbanColumns.id, id))
      .returning();
    return updatedColumn;
  }

  async deleteKanbanColumn(id: number): Promise<boolean> {
    await db.delete(kanbanColumns).where(eq(kanbanColumns.id, id));
    return true;
  }

  // Kanban Card operations
  async getKanbanCards(columnId?: number, sprintId?: number, projectId?: number): Promise<KanbanCard[]> {
    let query = db.select().from(kanbanCards);

    const conditions = [];
    if (columnId !== undefined) conditions.push(eq(kanbanCards.columnId, columnId));
    if (sprintId !== undefined) conditions.push(eq(kanbanCards.sprintId, sprintId));
    if (projectId !== undefined) conditions.push(eq(kanbanCards.projectId, projectId));

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  async getKanbanSubCards(parentId: number): Promise<KanbanCard[]> {
    return await db.select().from(kanbanCards)
      .where(eq(kanbanCards.parentId, parentId))
      .orderBy(asc(kanbanCards.order));
  }

  async getKanbanCard(id: number): Promise<KanbanCard | undefined> {
    const result = await db.select().from(kanbanCards).where(eq(kanbanCards.id, id));
    return result[0];
  }

  async createKanbanCard(insertCard: InsertKanbanCard): Promise<KanbanCard> {
    const [newCard] = await db.insert(kanbanCards).values({
      ...insertCard,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newCard;
  }

  async updateKanbanCard(id: number, cardData: Partial<KanbanCard>): Promise<KanbanCard> {
    const [updatedCard] = await db.update(kanbanCards)
      .set({ ...cardData, updatedAt: new Date() })
      .where(eq(kanbanCards.id, id))
      .returning();
    return updatedCard;
  }

  async deleteKanbanCard(id: number): Promise<boolean> {
    await db.delete(kanbanCards).where(eq(kanbanCards.id, id));
    return true;
  }

  // Matrix Cell operations
  async getMatrixCellsByProject(projectId: number): Promise<MatrixCell[]> {
    return await db.select().from(matrixCells).where(eq(matrixCells.projectId, projectId));
  }

  async getMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<MatrixCell | undefined> {
    const result = await db.select().from(matrixCells).where(
      and(
        eq(matrixCells.rowModuleId, rowModuleId),
        eq(matrixCells.colModuleId, colModuleId),
        eq(matrixCells.projectId, projectId)
      )
    );
    return result[0];
  }

  async upsertMatrixCell(cell: InsertMatrixCell): Promise<MatrixCell> {
    const existingCell = await this.getMatrixCell(cell.rowModuleId, cell.colModuleId, cell.projectId);

    if (existingCell) {
      const [updatedCell] = await db.update(matrixCells)
        .set({
          ...cell,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(matrixCells.rowModuleId, cell.rowModuleId),
            eq(matrixCells.colModuleId, cell.colModuleId),
            eq(matrixCells.projectId, cell.projectId)
          )
        )
        .returning();

      return updatedCell;
    } else {
      const [newCell] = await db.insert(matrixCells)
        .values({
          ...cell,
          createdAt: new Date()
        })
        .returning();

      return newCell;
    }
  }

  async deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number): Promise<boolean> {
    await db.delete(matrixCells)
      .where(
        and(
          eq(matrixCells.rowModuleId, rowModuleId),
          eq(matrixCells.colModuleId, colModuleId),
          eq(matrixCells.projectId, projectId)
        )
      );

    return true;
  }

  // Custom Marker operations
  async getCustomMarkersByProject(projectId: number): Promise<CustomMarker[]> {
    return await db.select().from(customMarkers).where(eq(customMarkers.projectId, projectId));
  }

  async getCustomMarker(id: number): Promise<CustomMarker | undefined> {
    const result = await db.select().from(customMarkers).where(eq(customMarkers.id, id));
    return result[0];
  }

  async getCustomMarkerByMarkerId(markerId: string): Promise<CustomMarker | undefined> {
    const result = await db.select().from(customMarkers).where(eq(customMarkers.markerId, markerId));
    return result[0];
  }

  async createCustomMarker(marker: InsertCustomMarker): Promise<CustomMarker> {
    const [newMarker] = await db.insert(customMarkers)
      .values({
        ...marker,
        createdAt: new Date()
      })
      .returning();

    return newMarker;
  }

  async updateCustomMarker(id: number, data: Partial<InsertCustomMarker>): Promise<CustomMarker> {
    const [updatedMarker] = await db.update(customMarkers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(customMarkers.id, id))
      .returning();

    return updatedMarker;
  }

  async deleteCustomMarker(id: number): Promise<boolean> {
    await db.delete(customMarkers).where(eq(customMarkers.id, id));
    return true;
  }

  // Flow Diagram operations (placeholder implementation)
  async getFlowDiagrams(projectId?: number): Promise<FlowDiagram[]> {
    // Implement when flow diagrams table is added to schema
    return [];
  }

  async getFlowDiagram(id: number): Promise<FlowDiagram | undefined> {
    // Implement when flow diagrams table is added to schema
    return undefined;
  }

  async createFlowDiagram(diagram: InsertFlowDiagram): Promise<FlowDiagram> {
    // Implement when flow diagrams table is added to schema
    throw new Error("Flow diagrams not implemented in database storage yet");
  }

  async updateFlowDiagram(id: number, diagramData: Partial<InsertFlowDiagram>): Promise<FlowDiagram | undefined> {
    // Implement when flow diagrams table is added to schema
    return undefined;
  }

  async deleteFlowDiagram(id: number): Promise<boolean> {
    // Implement when flow diagrams table is added to schema
    return false;
  }
}