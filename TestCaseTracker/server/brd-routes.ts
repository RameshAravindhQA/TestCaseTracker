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
    const pdfContent = await generatePDFContent(document);
    
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
async function generatePDFContent(document: any): Promise<Buffer> {
  const puppeteer = require('puppeteer');
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>BRD Document - ${document.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              border-bottom: 2px solid #007bff;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 10px;
            }
            .meta-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .meta-item {
              padding: 5px 0;
            }
            .meta-label {
              font-weight: bold;
              color: #666;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .section-content {
              padding-left: 10px;
              white-space: pre-wrap;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              color: white;
              background-color: #007bff;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${document.title || 'Untitled BRD'}</div>
            <div class="meta-info">
              <div class="meta-item">
                <span class="meta-label">Author:</span> ${document.author || 'N/A'}
              </div>
              <div class="meta-item">
                <span class="meta-label">Version:</span> ${document.version || '1.0'}
              </div>
              <div class="meta-item">
                <span class="meta-label">Status:</span> 
                <span class="status-badge">${document.status || 'Draft'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Created:</span> ${document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          ${document.overview ? `
            <div class="section">
              <div class="section-title">Overview</div>
              <div class="section-content">${document.overview}</div>
            </div>
          ` : ''}

          ${document.problemStatement ? `
            <div class="section">
              <div class="section-title">Problem Statement</div>
              <div class="section-content">${document.problemStatement}</div>
            </div>
          ` : ''}

          ${document.objectives ? `
            <div class="section">
              <div class="section-title">Objectives</div>
              <div class="section-content">${document.objectives}</div>
            </div>
          ` : ''}

          ${document.scope ? `
            <div class="section">
              <div class="section-title">Scope</div>
              <div class="section-content">${document.scope}</div>
            </div>
          ` : ''}

          ${document.userStories ? `
            <div class="section">
              <div class="section-title">User Stories</div>
              <div class="section-content">${document.userStories}</div>
            </div>
          ` : ''}

          ${document.functionalRequirements ? `
            <div class="section">
              <div class="section-title">Functional Requirements</div>
              <div class="section-content">${document.functionalRequirements}</div>
            </div>
          ` : ''}

          ${document.nonFunctionalRequirements ? `
            <div class="section">
              <div class="section-title">Non-Functional Requirements</div>
              <div class="section-content">${document.nonFunctionalRequirements}</div>
            </div>
          ` : ''}

          ${document.designNotes ? `
            <div class="section">
              <div class="section-title">Design Notes</div>
              <div class="section-content">${document.designNotes}</div>
            </div>
          ` : ''}

          ${document.dependencies ? `
            <div class="section">
              <div class="section-title">Dependencies</div>
              <div class="section-content">${document.dependencies}</div>
            </div>
          ` : ''}

          ${document.assumptions ? `
            <div class="section">
              <div class="section-title">Assumptions</div>
              <div class="section-content">${document.assumptions}</div>
            </div>
          ` : ''}

          ${document.acceptanceCriteria ? `
            <div class="section">
              <div class="section-title">Acceptance Criteria</div>
              <div class="section-content">${document.acceptanceCriteria}</div>
            </div>
          ` : ''}

          ${document.risks ? `
            <div class="section">
              <div class="section-title">Risks</div>
              <div class="section-content">${document.risks}</div>
            </div>
          ` : ''}

          ${document.supportingDocuments ? `
            <div class="section">
              <div class="section-title">Supporting Documents</div>
              <div class="section-content">${document.supportingDocuments}</div>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

// Helper function to generate ZIP with PDFs
async function generateZipWithPDFs(documents: any[]): Promise<Buffer> {
  const archiver = require('archiver');
  const { Readable } = require('stream');
  
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
        const pdfContent = await generatePDFContent(doc);
        const stream = Readable.from(pdfContent);
        archive.append(stream, { name: `${doc.title}_v${doc.version}.pdf` });
      }

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

export default router;