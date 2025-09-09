
// Add BRD-specific storage methods to the existing MemStorage class

// Add these properties to the MemStorage class constructor:
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
