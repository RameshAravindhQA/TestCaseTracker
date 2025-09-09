// Add BRD-specific storage methods to the existing MemStorage class

// Add these properties to the MemStorage class constructor:
// private brdDocuments: any[] = [];
// private brdVersions: any[] = [];
// private brdTestCases: any[] = [];
// private nextBrdId = 1;
// private nextBrdVersionId = 1;
// private nextBrdTestCaseId = 1;

// BRD Document operations
async getBrdDocuments(projectId?: number): Promise<any[]> {
  let results = [...this.data.brdDocuments];
  if (projectId) {
    results = results.filter(doc => doc.projectId === projectId);
  }
  return results;
}

async getBrdDocument(id: number): Promise<any | null> {
  return this.data.brdDocuments.find(doc => doc.id === id) || null;
}

async createBrdDocument(data: any): Promise<any> {
  const id = this.generateId(); // Use generateId()
  const now = new Date();

  const document = {
    id,
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
    data: { ...document }, // Store the initial document data
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
      data: { ...currentDoc }, // Store the complete current document data
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

async revertBrdDocumentToVersion(brdId: number, versionId: number): Promise<any | null> {
  try {
    // Get the version data
    const version = this.data.brdVersions?.find((v: any) => v.id === versionId && v.brdId === brdId);
    if (!version) {
      return null;
    }

    // Get the current document
    const currentDoc = this.data.brdDocuments?.find((doc: any) => doc.id === brdId);
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
      updatedAt: new Date().toISOString(),
      updatedById: version.createdById
    };

    // Update the document
    const docIndex = this.data.brdDocuments.findIndex((doc: any) => doc.id === brdId);
    if (docIndex !== -1) {
      this.data.brdDocuments[docIndex] = updatedDoc;
      this.saveToFile();
      return updatedDoc;
    }

    return null;
  } catch (error) {
    console.error('Error reverting BRD document:', error);
    return null;
  }
}

async deleteBrdDocument(id: number): Promise<boolean> {
  const initialLength = this.data.brdDocuments.length;
  this.data.brdDocuments = this.data.brdDocuments.filter(doc => doc.id !== id);
  // Also delete related versions and test cases
  this.data.brdVersions = this.data.brdVersions.filter(version => version.brdId !== id);
  this.data.brdTestCases = this.data.brdTestCases.filter(testCase => testCase.brdId !== id);
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

// BRD Test Case operations
async getBrdTestCases(brdId: number): Promise<any[]> {
  return this.data.brdTestCases
    .filter(testCase => testCase.brdId === brdId)
    .sort((a, b) => a.testCaseId.localeCompare(b.testCaseId));
}

async getBrdTestCase(id: number): Promise<any | null> {
  return this.data.brdTestCases.find(testCase => testCase.id === id) || null;
}

async createBrdTestCase(data: any): Promise<any> {
  const id = this.generateId(); // Use generateId()
  const now = new Date();

  const testCase = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  };

  if (!this.data.brdTestCases) {
    this.data.brdTestCases = [];
  }
  this.data.brdTestCases.push(testCase);
  this.saveToFile();
  return testCase;
}

async updateBrdTestCase(id: number, data: any): Promise<any | null> {
  const index = this.data.brdTestCases.findIndex(testCase => testCase.id === id);
  if (index === -1) return null;

  const updatedTestCase = {
    ...this.data.brdTestCases[index],
    ...data,
    updatedAt: new Date()
  };

  this.data.brdTestCases[index] = updatedTestCase;
  this.saveToFile();
  return updatedTestCase;
}

async deleteBrdTestCase(id: number): Promise<boolean> {
  const initialLength = this.data.brdTestCases.length;
  this.data.brdTestCases = this.data.brdTestCases.filter(testCase => testCase.id !== id);
  this.saveToFile();
  return this.data.brdTestCases.length < initialLength;
}

// Employee import logic would be here, assuming a similar structure for operations
// For example:
async importEmployees(employees: any[]): Promise<any[]> {
  const importedEmployees = [];
  if (!this.data.employees) {
    this.data.employees = [];
  }
  for (const empData of employees) {
    const id = this.generateId();
    const newEmployee = {
      id,
      ...empData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.employees.push(newEmployee);
    importedEmployees.push(newEmployee);
  }
  this.saveToFile();
  return importedEmployees;
}

// Placeholder for PDF generation logic using jsPDF (assuming other modules use this)
async generateBrdPdf(brdId: number): Promise<Buffer | null> {
  const brd = await this.getBrdDocument(brdId);
  if (!brd) {
    return null;
  }

  // Dynamically import jsPDF
  let jsPDF;
  try {
    jsPDF = (await import('jspdf')).default;
  } catch (error) {
    console.error("jsPDF not found. Please install it: npm install jspdf");
    return null;
  }

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(`BRD: ${brd.title || 'Untitled'}`, 10, 10);

  doc.setFontSize(12);
  doc.text(`Version: ${brd.version || 'N/A'}`, 10, 20);
  doc.text(`Status: ${brd.status || 'N/A'}`, 10, 30);

  let y = 40;
  const addLine = (text: string, indent = 0) => {
    if (y > 280) { // New page if near bottom
      doc.addPage();
      y = 10;
    }
    doc.text(text, 10 + indent * 5, y);
    y += 7;
  };

  addLine("Overview:");
  if (brd.overview) {
    brd.overview.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Problem Statement:");
  if (brd.problemStatement) {
    brd.problemStatement.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Objectives:");
  if (brd.objectives) {
    brd.objectives.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Scope:");
  if (brd.scope) {
    brd.scope.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("User Stories:");
  if (brd.userStories) {
    brd.userStories.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Functional Requirements:");
  if (brd.functionalRequirements) {
    brd.functionalRequirements.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Non-Functional Requirements:");
  if (brd.nonFunctionalRequirements) {
    brd.nonFunctionalRequirements.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Design Notes:");
  if (brd.designNotes) {
    brd.designNotes.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Dependencies:");
  if (brd.dependencies) {
    brd.dependencies.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Assumptions:");
  if (brd.assumptions) {
    brd.assumptions.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Acceptance Criteria:");
  if (brd.acceptanceCriteria) {
    brd.acceptanceCriteria.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Risks:");
  if (brd.risks) {
    brd.risks.split('\n').forEach((line: string) => addLine(line, 1));
  }

  addLine("Supporting Documents:");
  if (brd.supportingDocuments) {
    brd.supportingDocuments.split('\n').forEach((line: string) => addLine(line, 1));
  }

  // Return as a Buffer (Node.js environment)
  const pdfDataUri = doc.output('datauristring');
  // Remove the 'data:application/pdf;base64,' prefix
  const base64Data = pdfDataUri.split(',')[1];
  return Buffer.from(base64Data, 'base64');
}

// Assume generateId and saveToFile are defined elsewhere in the MemStorage class
// Example placeholders:
private generateId(): number {
  // This should be a more robust ID generation mechanism in a real app
  // For this example, we'll use a simple counter or a more complex method
  // if available in the base class. Let's assume 'nextId' is managed.
  // If this is a MemStorage that persists to a file, it should load the last ID.
  if (!this.data.nextId) {
    this.data.nextId = 1;
  }
  return this.data.nextId++;
}

private saveToFile(): void {
  // This method should be implemented in the actual storage class
  // to persist the 'this.data' object to a file.
  // console.log('Saving data...');
  // Example: require('fs').writeFileSync('memstorage.json', JSON.stringify(this.data, null, 2));
}

// Placeholder for the 'employees' data if not already in MemStorage
// Ensure this.data.employees is initialized if it's part of the storage structure
// constructor() {
//   this.data = {
//     brdDocuments: [],
//     brdVersions: [],
//     brdTestCases: [],
//     employees: [], // Initialize employees array
//     nextId: 1
//   };
// }