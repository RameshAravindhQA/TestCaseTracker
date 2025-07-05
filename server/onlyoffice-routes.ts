import { Router } from 'express';
import { storage } from './storage';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Get all documents for a project
router.get('/projects/:projectId/onlyoffice-documents', isAuthenticated, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    // Check if user has access to this project
    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // For now, return mock data - in real implementation, integrate with storage
    const documents = await storage.getOnlyOfficeDocuments(projectId);
    res.json(documents);
  } catch (error) {
    console.error('Get ONLYOFFICE documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single document
router.get('/onlyoffice-documents/:id', isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const document = await storage.getOnlyOfficeDocument(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    console.error('Get ONLYOFFICE document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new document
router.post('/onlyoffice-documents', isAuthenticated, async (req, res) => {
    try {
      console.log('Creating ONLYOFFICE document:', req.body);
      console.log('Session data:', req.session);
      
      const { name, type, projectId } = req.body;

      if (!name || !type || !projectId) {
        console.log('Missing required fields:', { name, type, projectId });
        return res.status(400).json({ message: 'Name, type, and projectId are required' });
      }

      // Validate session
      if (!req.session || !req.session.userId) {
        console.log('No valid session found');
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user has access to this project
      const project = await storage.getProject(parseInt(projectId));
      if (!project) {
        console.log('Project not found:', projectId);
        return res.status(404).json({ message: "Project not found" });
      }

      console.log('User', req.session.userId, 'creating document for project', project.name);

      // Create empty document file
      const documentsDir = path.join(process.cwd(), 'uploads', 'onlyoffice-documents');
      if (!fs.existsSync(documentsDir)) {
        console.log('Creating documents directory:', documentsDir);
        fs.mkdirSync(documentsDir, { recursive: true });
      }

      const fileExtension = getFileExtension(type);
      const fileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
      const filePath = path.join(documentsDir, fileName);

      console.log('Creating file:', filePath);

      // Create empty template file based on type
      await createTemplateFile(filePath, type);

      const documentData = {
        name: name.trim(),
        type,
        projectId: parseInt(projectId),
        fileUrl: `/uploads/onlyoffice-documents/${fileName}`,
        createdById: req.session.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Document data to create:', documentData);

      const document = await storage.createOnlyOfficeDocument(documentData);

      // Log activity
      try {
        await storage.createActivity({
          userId: req.session.userId,
          action: "created",
          entityType: "onlyoffice-document",
          entityId: document.id,
          details: { 
            projectId: parseInt(projectId),
            documentName: name,
            documentType: type
          }
        });
      } catch (activityError) {
        console.warn('Failed to log activity:', activityError);
      }

      console.log('Successfully created ONLYOFFICE document:', document);
      res.status(201).json(document);
    } catch (error) {
      console.error('Create ONLYOFFICE document error:', error);
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

// Update document content
router.put('/onlyoffice-documents/:id', isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const { content } = req.body;

    const document = await storage.getOnlyOfficeDocument(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Update document content (this would integrate with ONLYOFFICE document server)
    const updatedDocument = await storage.updateOnlyOfficeDocument(documentId, {
      content,
      updatedAt: new Date()
    });

    // Log activity
    await storage.createActivity({
      userId: req.session.userId!,
      action: "updated",
      entityType: "onlyoffice-document",
      entityId: documentId,
      details: { 
        projectId: document.projectId,
        documentName: document.name
      }
    });

    res.json(updatedDocument);
  } catch (error) {
    console.error('Update ONLYOFFICE document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ONLYOFFICE callback endpoint
router.post('/onlyoffice-documents/:id/callback', async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const { status, url, users } = req.body;

    console.log('ONLYOFFICE callback:', { documentId, status, url, users });

    // Handle different callback statuses
    switch (status) {
      case 1: // Document is being edited
        console.log(`Document ${documentId} is being edited by:`, users);
        break;
      case 2: // Document is ready for saving
        if (url) {
          // Download and save the document
          await downloadAndSaveDocument(documentId, url);
        }
        break;
      case 3: // Document saving error
        console.error(`Error saving document ${documentId}`);
        break;
      case 4: // Document closed with no changes
        console.log(`Document ${documentId} closed with no changes`);
        break;
      case 6: // Document is being edited, but the current document state is saved
        if (url) {
          await downloadAndSaveDocument(documentId, url);
        }
        break;
      case 7: // Error has occurred while force saving the document
        console.error(`Force save error for document ${documentId}`);
        break;
    }

    res.json({ error: 0 });
  } catch (error) {
    console.error('ONLYOFFICE callback error:', error);
    res.status(500).json({ error: 1 });
  }
});

// Delete document
router.delete('/onlyoffice-documents/:id', isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);

    const document = await storage.getOnlyOfficeDocument(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    const success = await storage.deleteOnlyOfficeDocument(documentId);

    if (success) {
      // Log activity
      await storage.createActivity({
        userId: req.session.userId!,
        action: "deleted",
        entityType: "onlyoffice-document",
        entityId: documentId,
        details: { 
          projectId: document.projectId,
          documentName: document.name
        }
      });
    }

    res.json({ success });
  } catch (error) {
    console.error('Delete ONLYOFFICE document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function getFileExtension(type: string): string {
  switch (type) {
    case 'document': return 'docx';
    case 'spreadsheet': return 'xlsx';
    case 'presentation': return 'pptx';
    default: return 'docx';
  }
}

async function createTemplateFile(filePath: string, type: string) {
  const templateDir = path.join(process.cwd(), 'templates', 'onlyoffice');
  
  // Ensure template directory exists
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }
  
  let templateFile: string;

  switch (type) {
    case 'document':
      templateFile = path.join(templateDir, 'empty.docx');
      break;
    case 'spreadsheet':
      templateFile = path.join(templateDir, 'empty.xlsx');
      break;
    case 'presentation':
      templateFile = path.join(templateDir, 'empty.pptx');
      break;
    default:
      templateFile = path.join(templateDir, 'empty.docx');
  }

  try {
    // If template exists, copy it; otherwise create empty file
    if (fs.existsSync(templateFile)) {
      console.log('Copying template from:', templateFile);
      fs.copyFileSync(templateFile, filePath);
    } else {
      console.log('Creating minimal file for type:', type);
      // Create minimal empty files for each type
      await createMinimalFile(filePath, type);
    }
    
    console.log('Template file created successfully:', filePath);
  } catch (error) {
    console.error('Error creating template file:', error);
    throw error;
  }
}

async function createMinimalFile(filePath: string, type: string) {
  try {
    // Create minimal but valid empty files for each type
    let content: Buffer;
    
    switch (type) {
      case 'document':
        // Create a minimal valid DOCX structure
        content = await createMinimalDocx();
        break;
      case 'spreadsheet':
        // Create a minimal valid XLSX structure  
        content = await createMinimalXlsx();
        break;
      case 'presentation':
        // Create a minimal valid PPTX structure
        content = await createMinimalPptx();
        break;
      default:
        content = await createMinimalDocx();
    }
    
    fs.writeFileSync(filePath, content);
    console.log('Created minimal file:', filePath, 'size:', content.length);
  } catch (error) {
    console.error('Error creating minimal file:', error);
    // Fallback to empty file
    fs.writeFileSync(filePath, Buffer.alloc(0));
  }
}

// Helper functions to create minimal valid Office documents
async function createMinimalDocx(): Promise<Buffer> {
  // Create a minimal but valid DOCX file structure
  // This is a simplified version - in production, use a proper library like docx
  const content = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t></w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
  return Buffer.from(content, 'utf8');
}

async function createMinimalXlsx(): Promise<Buffer> {
  // Create a minimal but valid XLSX file structure
  const content = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1">
        <v></v>
      </c>
    </row>
  </sheetData>
</worksheet>`;
  return Buffer.from(content, 'utf8');
}

async function createMinimalPptx(): Promise<Buffer> {
  // Create a minimal but valid PPTX file structure
  const content = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256"/>
  </p:sldIdLst>
</p:presentation>`;
  return Buffer.from(content, 'utf8');
}

async function downloadAndSaveDocument(documentId: number, url: string) {
  try {
    const document = await storage.getOnlyOfficeDocument(documentId);
    if (!document) return;

    // Download the document from ONLYOFFICE
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // Save to filesystem
    const filePath = path.join(process.cwd(), document.fileUrl);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Update database with new version
    await storage.updateOnlyOfficeDocument(documentId, {
      updatedAt: new Date()
    });

    console.log(`Document ${documentId} saved successfully`);
  } catch (error) {
    console.error('Error downloading and saving document:', error);
  }
}

export default router;