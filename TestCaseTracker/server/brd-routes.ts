import { Router } from "express";
import { storage } from "./storage";

const router = Router();

// Get all BRD documents
router.get("/", async (req, res) => {
  try {
    const { projectId } = req.query;
    const documents = await storage.getBrdDocuments(
      projectId ? parseInt(projectId as string) : undefined
    );

    // Include test cases for each document
    const documentsWithTestCases = await Promise.all(
      documents.map(async (doc: any) => {
        const testCases = await storage.getBrdTestCases(doc.id);
        return { ...doc, testCases };
      })
    );

    res.json(documentsWithTestCases);
  } catch (error) {
    console.error("Error fetching BRD documents:", error);
    res.status(500).json({ error: "Failed to fetch BRD documents" });
  }
});

// Get single BRD document
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const document = await storage.getBrdDocument(id);

    if (!document) {
      return res.status(404).json({ error: "BRD document not found" });
    }

    // Include test cases and versions
    const testCases = await storage.getBrdTestCases(id);
    const versions = await storage.getBrdVersions(id);

    res.json({
      ...document,
      testCases,
      versions
    });
  } catch (error) {
    console.error("Error fetching BRD document:", error);
    res.status(500).json({ error: "Failed to fetch BRD document" });
  }
});

// Create new BRD document
router.post("/", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const documentData = {
      ...req.body,
      createdById: session.userId
    };

    const document = await storage.createBrdDocument(documentData);
    res.status(201).json(document);
  } catch (error) {
    console.error("Error creating BRD document:", error);
    res.status(500).json({ error: "Failed to create BRD document" });
  }
});

// Update BRD document
router.put("/:id", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = parseInt(req.params.id);
    const updateData = {
      ...req.body,
      updatedById: session.userId
    };

    const document = await storage.updateBrdDocument(id, updateData);

    if (!document) {
      return res.status(404).json({ error: "BRD document not found" });
    }

    res.json(document);
  } catch (error) {
    console.error("Error updating BRD document:", error);
    res.status(500).json({ error: "Failed to update BRD document" });
  }
});

// Delete BRD document
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteBrdDocument(id);

    if (!success) {
      return res.status(404).json({ error: "BRD document not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting BRD document:", error);
    res.status(500).json({ error: "Failed to delete BRD document" });
  }
});

// Get BRD test cases
router.get("/:id/test-cases", async (req, res) => {
  try {
    const brdId = parseInt(req.params.id);
    const testCases = await storage.getBrdTestCases(brdId);
    res.json(testCases);
  } catch (error) {
    console.error("Error fetching BRD test cases:", error);
    res.status(500).json({ error: "Failed to fetch test cases" });
  }
});

// Create BRD test case
router.post("/:id/test-cases", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const brdId = parseInt(req.params.id);
    const testCaseData = {
      ...req.body,
      brdId,
      createdById: session.userId
    };

    const testCase = await storage.createBrdTestCase(testCaseData);
    res.status(201).json(testCase);
  } catch (error) {
    console.error("Error creating BRD test case:", error);
    res.status(500).json({ error: "Failed to create test case" });
  }
});

// Update BRD test case
router.put("/test-cases/:testCaseId", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const testCaseId = parseInt(req.params.testCaseId);
    const updateData = {
      ...req.body,
      testedById: session.userId,
      testedAt: new Date().toISOString()
    };

    const testCase = await storage.updateBrdTestCase(testCaseId, updateData);

    if (!testCase) {
      return res.status(404).json({ error: "Test case not found" });
    }

    res.json(testCase);
  } catch (error) {
    console.error("Error updating BRD test case:", error);
    res.status(500).json({ error: "Failed to update test case" });
  }
});

// Delete BRD test case
router.delete("/test-cases/:testCaseId", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const testCaseId = parseInt(req.params.testCaseId);
    const success = await storage.deleteBrdTestCase(testCaseId);

    if (!success) {
      return res.status(404).json({ error: "Test case not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting BRD test case:", error);
    res.status(500).json({ error: "Failed to delete test case" });
  }
});

// Export single BRD document as PDF
router.get("/:id/export-pdf", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const document = await storage.getBrdDocument(id);

    if (!document) {
      return res.status(404).json({ error: "BRD document not found" });
    }

    // Generate PDF content
    const pdfContent = generatePDFContent(document);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.title}_v${document.version}.pdf"`);
    res.send(pdfContent);
  } catch (error) {
    console.error("Error exporting BRD document to PDF:", error);
    res.status(500).json({ error: "Failed to export PDF" });
  }
});

// Export all BRD documents for a project as ZIP
router.get("/export-all-pdf", async (req, res) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const documents = await storage.getBrdDocuments(parseInt(projectId as string));
    
    if (documents.length === 0) {
      return res.status(404).json({ error: "No BRD documents found for this project" });
    }

    // Generate ZIP file with all PDFs
    const zipContent = await generateZipWithPDFs(documents);
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="BRD_Documents_Project_${projectId}.zip"`);
    res.send(zipContent);
  } catch (error) {
    console.error("Error exporting all BRD documents to PDF:", error);
    res.status(500).json({ error: "Failed to export all PDFs" });
  }
});

// Helper function to generate PDF content
function generatePDFContent(document: any): Buffer {
  // Simple PDF generation - in a real implementation, you'd use a library like puppeteer or jsPDF
  const content = `
    Business Requirements Document
    
    Title: ${document.title}
    Author: ${document.author}
    Version: ${document.version}
    Status: ${document.status}
    Created: ${new Date(document.createdAt).toLocaleDateString()}
    
    Overview:
    ${document.overview || 'N/A'}
    
    Problem Statement:
    ${document.problemStatement || 'N/A'}
    
    Objectives:
    ${document.objectives || 'N/A'}
    
    Scope:
    ${document.scope || 'N/A'}
    
    User Stories:
    ${document.userStories || 'N/A'}
    
    Functional Requirements:
    ${document.functionalRequirements || 'N/A'}
    
    Non-Functional Requirements:
    ${document.nonFunctionalRequirements || 'N/A'}
    
    Design Notes:
    ${document.designNotes || 'N/A'}
    
    Dependencies:
    ${document.dependencies || 'N/A'}
    
    Assumptions:
    ${document.assumptions || 'N/A'}
    
    Acceptance Criteria:
    ${document.acceptanceCriteria || 'N/A'}
    
    Risks:
    ${document.risks || 'N/A'}
    
    Supporting Documents:
    ${document.supportingDocuments || 'N/A'}
  `;
  
  // This is a placeholder - in production, use a proper PDF library
  return Buffer.from(content, 'utf-8');
}

// Helper function to generate ZIP with PDFs
async function generateZipWithPDFs(documents: any[]): Promise<Buffer> {
  // This is a placeholder - in production, use a library like archiver
  const zipContent = documents.map(doc => 
    `File: ${doc.title}_v${doc.version}.pdf\n${generatePDFContent(doc).toString()}\n\n`
  ).join('');
  
  return Buffer.from(zipContent, 'utf-8');
}

export default router;