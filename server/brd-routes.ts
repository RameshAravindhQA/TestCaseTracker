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

    // Include test cases, versions, and functional requirements
    const testCases = await storage.getBrdTestCases(id);
    const versions = await storage.getBrdVersions(id);
    const functionalRequirements = await storage.getFunctionalRequirements(id);

    res.json({
      ...document,
      testCases,
      versions,
      functionalRequirements
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

// Revert BRD document to a specific version
router.post("/:id/revert/:versionId", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const brdId = parseInt(req.params.id);
    const versionId = parseInt(req.params.versionId);

    const document = await storage.revertBrdDocumentToVersion(brdId, versionId);

    if (!document) {
      return res.status(404).json({ error: "BRD document or version not found" });
    }

    res.json(document);
  } catch (error) {
    console.error("Error reverting BRD document:", error);
    res.status(500).json({ error: "Failed to revert BRD document" });
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

    // Get project information
    const project = await storage.getProject(document.projectId);
    
    // Generate PDF content with project info
    const pdfContent = await generatePDFContent(document, project);

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

    // Get project information
    const project = await storage.getProject(parseInt(projectId as string));

    // Generate ZIP file with all PDFs
    const zipContent = await generateZipWithPDFs(documents, project);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="BRD_Documents_${project?.name || 'Project_' + projectId}.zip"`);
    res.send(zipContent);
  } catch (error) {
    console.error("Error exporting all BRD documents to PDF:", error);
    res.status(500).json({ error: "Failed to export all PDFs" });
  }
});

// Get BRD document by ID with versions
router.get("/brd-documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = await storage.getBrdDocument(parseInt(id));

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Get versions for this document
    const versions = await storage.getBrdDocumentVersions(parseInt(id));

    // Add versions to document response
    const documentWithVersions = {
      ...document,
      versions: versions || []
    };

    res.json(documentWithVersions);
  } catch (error) {
    console.error("Error fetching BRD document:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// Get BRD versions 
router.get("/:id/versions", async (req, res) => {
  try {
    const brdId = parseInt(req.params.id);
    const versions = await storage.getBrdVersions(brdId);
    res.json(versions);
  } catch (error) {
    console.error("Error fetching BRD versions:", error);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
});

// Helper function to generate PDF content using jsPDF
async function generatePDFContent(document: any, project?: any): Promise<Buffer> {
  try {
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF();

    // Set up fonts and colors
    const primaryColor = [0, 123, 255]; // Blue color
    const textColor = [51, 51, 51]; // Dark gray

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Header with project name
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    if (project?.name) {
      doc.text(`Project: ${project.name}`, margin, yPosition);
      yPosition += 12;
    }

    // Document title
    doc.setFontSize(20);
    doc.text(document.title || 'Untitled BRD', margin, yPosition);
    yPosition += 15;

    // Draw header line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 20;

    // Meta information
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");

    const metaInfo = [
      `Author: ${document.author || 'N/A'}`,
      `Version: ${document.version || '1.0'}`,
      `Status: ${document.status || 'Draft'}`,
      `Created: ${document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'N/A'}`
    ];

    metaInfo.forEach((info, index) => {
      if (index % 2 === 0) {
        doc.text(info, margin, yPosition);
      } else {
        doc.text(info, margin + contentWidth/2, yPosition);
        yPosition += 8;
      }
    });

    yPosition += 15;

    // Helper function to add section
    const addSection = (title: string, content: string) => {
      if (!content) return;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Section title
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, yPosition);
      yPosition += 2;

      // Section underline
      doc.setDrawColor(238, 238, 238);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Section content
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "normal");

      const lines = doc.splitTextToSize(content, contentWidth);
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      yPosition += 8;
    };

    // Add all sections
    addSection('Overview', document.overview);
    addSection('Problem Statement', document.problemStatement);
    addSection('Objectives', document.objectives);
    addSection('Scope', document.scope);
    addSection('User Stories', document.userStories);
    addSection('Functional Requirements', document.functionalRequirements);
    addSection('Non-Functional Requirements', document.nonFunctionalRequirements);
    addSection('Design Notes', document.designNotes);
    addSection('Dependencies', document.dependencies);
    addSection('Assumptions', document.assumptions);
    addSection('Acceptance Criteria', document.acceptanceCriteria);
    addSection('Risks', document.risks);
    addSection('Supporting Documents', document.supportingDocuments);

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, doc.internal.pageSize.height - 10);
    }

    // Convert to buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfArrayBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

// Helper function to generate ZIP with PDFs
async function generateZipWithPDFs(documents: any[], project?: any): Promise<Buffer> {
  const archiver = (await import('archiver')).default;
  const { Readable } = await import('stream');

  return new Promise(async (resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    const chunks: Buffer[] = [];
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    try {
      for (const doc of documents) {
        const pdfContent = await generatePDFContent(doc, project);
        const stream = Readable.from(pdfContent);
        const safeTitle = doc.title.replace(/[^a-zA-Z0-9]/g, '_');
        archive.append(stream, { name: `${safeTitle}_v${doc.version}.pdf` });
      }

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

export default router;