// Enhanced BRD-specific storage methods for the MemStorage class

// Add these properties to the MemStorage class constructor:
// private brdDocuments: any[] = [];
// private brdVersions: any[] = [];
// private functionalRequirements: any[] = [];
// private requirementTestCaseMappings: any[] = [];

// BRD Document operations with auto-generated IDs
async getBrdDocuments(projectId?: number): Promise<any[]> {
  let results = [...this.data.brdDocuments];
  if (projectId) {
    results = results.filter(doc => doc.projectId === projectId);
  }
  return results.sort((a, b) => a.documentId.localeCompare(b.documentId));
}

async getBrdDocument(id: number): Promise<any | null> {
  return this.data.brdDocuments.find(doc => doc.id === id) || null;
}

async createBrdDocument(data: any): Promise<any> {
  const id = this.generateId();
  const now = new Date();

  // Get project to generate document ID
  const project = await this.getProject(data.projectId);
  if (!project) {
    throw new Error(`Project with ID ${data.projectId} not found`);
  }

  // Generate document ID: BEG-REQ-001
  const projectPrefix = project.prefix || project.name.substring(0, 3).toUpperCase();
  const existingDocs = await this.getBrdDocuments(data.projectId);
  const nextNumber = existingDocs.length + 1;
  const documentId = `${projectPrefix}-REQ-${String(nextNumber).padStart(3, '0')}`;

  const document = {
    id,
    documentId,
    ...data,
    version: "1.0",
    status: "Draft",
    createdAt: now,
    updatedAt: now
  };

  if (!this.data.brdDocuments) {
    this.data.brdDocuments = [];
  }
  this.data.brdDocuments.push(document);

  // Create initial version record
  await this.createBrdVersion({
    brdId: id,
    version: "1.0",
    data: JSON.stringify(document),
    createdById: data.createdById,
    comment: "Initial version"
  });

  this.saveToFile();
  return document;
}

async updateBrdDocument(id: number, updateData: any): Promise<any | null> {
  try {
    const index = this.data.brdDocuments?.findIndex((doc: any) => doc.id === id);
    if (index === undefined || index === -1) {
      return null;
    }

    const currentDoc = this.data.brdDocuments[index];

    // Create version history before updating
    await this.createBrdVersion({
      brdId: id,
      version: currentDoc.version || '1.0',
      data: JSON.stringify(currentDoc),
      createdById: updateData.updatedById || currentDoc.createdById,
      comment: updateData.versionComment || 'Document updated'
    });

    // Increment version number
    let newVersion = '1.0';
    if (currentDoc.version) {
      const versionParts = currentDoc.version.split('.');
      const major = parseInt(versionParts[0]) || 1;
      const minor = parseInt(versionParts[1]) || 0;
      newVersion = `${major}.${minor + 1}`;
    }

    const updatedDoc = {
      ...currentDoc,
      ...updateData,
      version: newVersion,
      updatedAt: new Date().toISOString()
    };

    this.data.brdDocuments[index] = updatedDoc;
    this.saveToFile();
    return updatedDoc;
  } catch (error) {
    console.error('Error updating BRD document:', error);
    return null;
  }
}

async deleteBrdDocument(id: number): Promise<boolean> {
  const initialLength = this.data.brdDocuments.length;
  this.data.brdDocuments = this.data.brdDocuments.filter(doc => doc.id !== id);

  // Also delete related versions and functional requirements
  this.data.brdVersions = this.data.brdVersions.filter(version => version.brdId !== id);
  this.data.functionalRequirements = this.data.functionalRequirements.filter(req => req.brdId !== id);
  this.data.requirementTestCaseMappings = this.data.requirementTestCaseMappings.filter(mapping => {
    const requirement = this.data.functionalRequirements.find(req => req.id === mapping.functionalRequirementId);
    return !requirement || requirement.brdId !== id;
  });

  this.saveToFile();
  return this.data.brdDocuments.length < initialLength;
}

// BRD Version operations
async getBrdVersions(brdId: number): Promise<any[]> {
  if (!this.data.brdVersions) {
    this.data.brdVersions = [];
  }

  return this.data.brdVersions
    .filter((version: any) => version.brdId === brdId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async createBrdVersion(versionData: any): Promise<any> {
  const version = {
    id: this.generateId(),
    brdId: versionData.brdId,
    version: versionData.version,
    data: versionData.data,
    createdById: versionData.createdById,
    createdAt: new Date().toISOString(),
    comment: versionData.comment || 'Version created',
    ...versionData
  };

  if (!this.data.brdVersions) {
    this.data.brdVersions = [];
  }

  this.data.brdVersions.push(version);
  this.saveToFile();
  return version;
}

// Functional Requirements operations
async getFunctionalRequirements(brdId?: number, projectId?: number): Promise<any[]> {
  if (!this.data.functionalRequirements) {
    this.data.functionalRequirements = [];
  }

  let results = [...this.data.functionalRequirements];

  if (brdId) {
    results = results.filter(req => req.brdId === brdId || req.brdDocumentId === brdId);
  }

  // Get BRD document IDs for the project if projectId is provided
  if (projectId && !brdId) {
    const brdDocuments = await this.getBrdDocuments(projectId);
    const brdIds = brdDocuments.map(doc => doc.id);
    console.log(`Storage: BRD IDs for project ${projectId}:`, brdIds);

    // Filter by project's BRD documents
    results = results.filter(req => brdIds.includes(req.brdDocumentId || req.brdId));
    console.log(`Storage: After filtering by projectId ${projectId}: ${results.length} requirements`);
  }

  console.log(`Storage: getFunctionalRequirements(${brdId}, ${projectId}) returning ${results.length} requirements:`, results.map(r => ({ id: r.id, requirementId: r.requirementId, brdId: r.brdId || r.brdDocumentId })));
  return results.sort((a, b) => (a.requirementId || '').localeCompare(b.requirementId || ''));
}

async getFunctionalRequirement(id: number): Promise<any | null> {
  return this.data.functionalRequirements.find(req => req.id === id) || null;
}

async createFunctionalRequirement(data: any): Promise<any> {
  const id = this.generateId();
  const now = new Date();

  // Get BRD document to generate requirement ID
  const brdDocument = await this.getBrdDocument(data.brdId);
  if (!brdDocument) {
    throw new Error(`BRD Document with ID ${data.brdId} not found`);
  }

  // Generate requirement ID: BEG-REQ-001-FR-001
  const existingRequirements = await this.getFunctionalRequirements(data.brdId);
  const nextNumber = existingRequirements.length + 1;
  const requirementId = `${brdDocument.documentId}-FR-${String(nextNumber).padStart(3, '0')}`;

  const requirement = {
    id,
    requirementId,
    brdId: data.brdId,
    brdDocumentId: data.brdId, // Keep both for compatibility
    ...data,
    status: data.status || "Not Executed",
    priority: data.priority || "Medium",
    createdAt: now,
    updatedAt: now
  };

  if (!this.data.functionalRequirements) {
    this.data.functionalRequirements = [];
  }
  this.data.functionalRequirements.push(requirement);
  
  console.log(`Storage: Created functional requirement with ID ${id}:`, requirement);
  this.saveToFile();
  return requirement;
}

async updateFunctionalRequirement(id: number, data: any): Promise<any | null> {
  const index = this.data.functionalRequirements.findIndex(req => req.id === id);
  if (index === -1) return null;

  const updatedRequirement = {
    ...this.data.functionalRequirements[index],
    ...data,
    updatedAt: new Date()
  };

  this.data.functionalRequirements[index] = updatedRequirement;
  this.saveToFile();
  return updatedRequirement;
}

async deleteFunctionalRequirement(id: number): Promise<boolean> {
  const initialLength = this.data.functionalRequirements.length;
  this.data.functionalRequirements = this.data.functionalRequirements.filter(req => req.id !== id);

  // Also delete related mappings
  this.data.requirementTestCaseMappings = this.data.requirementTestCaseMappings.filter(mapping => mapping.functionalRequirementId !== id);

  this.saveToFile();
  return this.data.functionalRequirements.length < initialLength;
}

// Requirements Test Case Mapping operations for RTM
async getRequirementTestCaseMappings(functionalRequirementId?: number, testCaseId?: number, projectId?: number): Promise<any[]> {
  if (!this.data.requirementTestCaseMappings) {
    this.data.requirementTestCaseMappings = [];
  }

  let mappings = this.data.requirementTestCaseMappings;

  if (functionalRequirementId) {
    mappings = mappings.filter(mapping => mapping.functionalRequirementId === functionalRequirementId);
  }

  if (testCaseId) {
    mappings = mappings.filter(mapping => mapping.testCaseId === testCaseId);
  }

  if (projectId) {
    mappings = mappings.filter(mapping => mapping.projectId === projectId);
  }

  return mappings;
}

async createRequirementTestCaseMapping(data: any): Promise<any> {
  const id = this.generateId();
  const now = new Date();

  const mapping = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  };

  if (!this.data.requirementTestCaseMappings) {
    this.data.requirementTestCaseMappings = [];
  }

  this.data.requirementTestCaseMappings.push(mapping);
  this.saveToFile();
  return mapping;
}

async updateRequirementTestCaseMapping(id: number, data: any): Promise<any | null> {
  const index = this.data.requirementTestCaseMappings.findIndex(mapping => mapping.id === id);
  if (index === -1) return null;

  const updatedMapping = {
    ...this.data.requirementTestCaseMappings[index],
    ...data,
    updatedAt: new Date()
  };

  this.data.requirementTestCaseMappings[index] = updatedMapping;
  this.saveToFile();
  return updatedMapping;
}

async deleteRequirementTestCaseMapping(id: number): Promise<boolean> {
  const initialLength = this.data.requirementTestCaseMappings.length;
  this.data.requirementTestCaseMappings = this.data.requirementTestCaseMappings.filter(mapping => mapping.id !== id);
  this.saveToFile();
  return this.data.requirementTestCaseMappings.length < initialLength;
}

// RTM Status Synchronization
async syncRequirementStatusWithTestCases(functionalRequirementId: number): Promise<void> {
  const mappings = await this.getRequirementTestCaseMappings(functionalRequirementId);

  if (mappings.length === 0) return;

  // Get all mapped test cases
  const testCaseIds = mappings.map(m => m.testCaseId);
  const testCases = this.data.testCases.filter(tc => testCaseIds.includes(tc.id));

  // Determine the overall status
  let overallStatus = "Not Executed";

  if (testCases.length > 0) {
    const passCount = testCases.filter(tc => tc.status === "Pass").length;
    const failCount = testCases.filter(tc => tc.status === "Fail").length;
    const totalCount = testCases.length;

    if (failCount > 0) {
      overallStatus = "Fail";
    } else if (passCount === totalCount) {
      overallStatus = "Pass";
    } else if (passCount > 0) {
      overallStatus = "Pass"; // Partial pass
    }
  }

  // Update functional requirement status
  await this.updateFunctionalRequirement(functionalRequirementId, { status: overallStatus });
}

// Generate ID method (assumed to be available in base class)
private generateId(): number {
  if (!this.data.nextId) {
    this.data.nextId = 1;
  }
  return this.data.nextId++;
}

// Save method (assumed to be available in base class)
private saveToFile(): void {
  // Implementation depends on the base storage class
  console.log('Saving BRD data...');
}

// Get BRD document versions method
async getBrdDocumentVersions(brdId: number): Promise<any[]> {
  return this.getBrdVersions(brdId);
}