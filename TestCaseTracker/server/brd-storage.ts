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

async updateBrdDocument(id: number, data: any): Promise<any> {
    const existingDoc = this.brdDocuments.find(doc => doc.id === id);
    if (!existingDoc) return null;

    // If version is being updated, create a version entry for the current state before updating
    if (data.version && data.version !== existingDoc.version) {
      // Store the complete current document state as a version
      const versionEntry = {
        id: this.nextBrdVersionId++,
        brdId: id,
        version: existingDoc.version || "1.0",
        changes: data.changes || `Updated to version ${data.version}`,
        createdAt: new Date().toISOString(),
        createdById: data.updatedById || existingDoc.createdById,
        // Store complete document data for this version
        documentData: {
          title: existingDoc.title,
          author: existingDoc.author,
          overview: existingDoc.overview,
          problemStatement: existingDoc.problemStatement,
          objectives: existingDoc.objectives,
          scope: existingDoc.scope,
          userStories: existingDoc.userStories,
          functionalRequirements: existingDoc.functionalRequirements,
          nonFunctionalRequirements: existingDoc.nonFunctionalRequirements,
          designNotes: existingDoc.designNotes,
          dependencies: existingDoc.dependencies,
          assumptions: existingDoc.assumptions,
          acceptanceCriteria: existingDoc.acceptanceCriteria,
          risks: existingDoc.risks,
          supportingDocuments: existingDoc.supportingDocuments,
          status: existingDoc.status
        }
      };
      this.brdVersions.push(versionEntry);
    }

    const updatedDoc = {
      ...existingDoc,
      ...data,
      updatedAt: new Date().toISOString()
    };

    const index = this.brdDocuments.findIndex(doc => doc.id === id);
    this.brdDocuments[index] = updatedDoc;

    return updatedDoc;
  }

async revertBrdDocumentToVersion(brdId: number, versionId: number): Promise<any | null> {
    const document = this.brdDocuments.find(doc => doc.id === brdId);
    const version = this.brdVersions.find(v => v.id === versionId && v.brdId === brdId);
    
    if (!document || !version || !version.documentData) return null;

    // Before reverting, save current state as a new version
    const currentVersionEntry = {
      id: this.nextBrdVersionId++,
      brdId: brdId,
      version: document.version,
      changes: `Pre-revert state before reverting to version ${version.version}`,
      createdAt: new Date().toISOString(),
      createdById: document.createdById,
      documentData: {
        title: document.title,
        author: document.author,
        overview: document.overview,
        problemStatement: document.problemStatement,
        objectives: document.objectives,
        scope: document.scope,
        userStories: document.userStories,
        functionalRequirements: document.functionalRequirements,
        nonFunctionalRequirements: document.nonFunctionalRequirements,
        designNotes: document.designNotes,
        dependencies: document.dependencies,
        assumptions: document.assumptions,
        acceptanceCriteria: document.acceptanceCriteria,
        risks: document.risks,
        supportingDocuments: document.supportingDocuments,
        status: document.status
      }
    };
    this.brdVersions.push(currentVersionEntry);

    // Revert to the selected version
    const revertedDoc = {
      ...document,
      ...version.documentData,
      version: `${version.version}-reverted`,
      updatedAt: new Date().toISOString()
    };

    const index = this.brdDocuments.findIndex(doc => doc.id === brdId);
    this.brdDocuments[index] = revertedDoc;

    return revertedDoc;
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
      .sort((a, b) => {
        // Sort by version number (semantic versioning)
        const aVersion = a.version.split('.').map(Number);
        const bVersion = b.version.split('.').map(Number);

        for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
          const aNum = aVersion[i] || 0;
          const bNum = bVersion[i] || 0;
          if (aNum !== bNum) {
            return bNum - aNum; // Descending order (newest first)
          }
        }
        return 0;
      });
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

  this.brdTestCases[index] = {
    ...this.brdTestCases[index],
    ...data,
    updatedAt: new Date()
  };

  return this.brdTestCases[index];
}

async deleteBrdTestCase(id: number): Promise<boolean> {
  const initialLength = this.brdTestCases.length;
  this.brdTestCases = this.brdTestCases.filter(testCase => testCase.id !== id);
  return this.brdTestCases.length < initialLength;
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