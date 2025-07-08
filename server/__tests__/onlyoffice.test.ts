import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('OnlyOffice Document Editor', () => {
  beforeEach(async () => {
    // Initialize with clean storage
  });

  it('should create a new OnlyOffice document', async () => {
    const documentData = {
      title: 'Test Spreadsheet',
      type: 'spreadsheet',
      fileType: 'xlsx',
      projectId: 1,
      createdBy: 1,
      key: `test_${Date.now()}`,
      url: '/uploads/documents/test.xlsx',
      content: 'Initial spreadsheet content'
    };

    const document = await storage.createOnlyOfficeDocument(documentData);

    expect(document).toBeDefined();
    expect(document.id).toBeDefined();
    expect(document.title).toBe('Test Spreadsheet');
    expect(document.type).toBe('spreadsheet');
    expect(document.createdAt).toBeDefined();
  });

  it('should retrieve OnlyOffice document by ID', async () => {
    const documentData = {
      title: 'Test Document',
      type: 'text',
      fileType: 'docx',
      projectId: 1,
      createdBy: 1,
      key: `test_${Date.now()}`,
      url: '/uploads/documents/test.docx'
    };

    const created = await storage.createOnlyOfficeDocument(documentData);
    const retrieved = await storage.getOnlyOfficeDocument(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.title).toBe('Test Document');
  });

  it('should list OnlyOffice documents by project', async () => {
    const doc1 = await storage.createOnlyOfficeDocument({
      title: 'Project 1 Doc',
      type: 'text',
      fileType: 'docx',
      projectId: 1,
      createdBy: 1,
      key: `test1_${Date.now()}`,
      url: '/uploads/documents/test1.docx'
    });

    const doc2 = await storage.createOnlyOfficeDocument({
      title: 'Project 2 Doc',
      type: 'spreadsheet',
      fileType: 'xlsx',
      projectId: 2,
      createdBy: 1,
      key: `test2_${Date.now()}`,
      url: '/uploads/documents/test2.xlsx'
    });

    const project1Docs = await storage.getOnlyOfficeDocuments(1);
    const allDocs = await storage.getOnlyOfficeDocuments();

    expect(project1Docs).toBeDefined();
    expect(project1Docs.length).toBeGreaterThan(0);
    expect(allDocs.length).toBeGreaterThanOrEqual(2);
  });

  it('should update OnlyOffice document', async () => {
    const documentData = {
      title: 'Update Test',
      type: 'text',
      fileType: 'docx',
      projectId: 1,
      createdBy: 1,
      key: `update_${Date.now()}`,
      url: '/uploads/documents/update.docx'
    };

    const document = await storage.createOnlyOfficeDocument(documentData);
    
    const updates = {
      title: 'Updated Document Title',
      content: 'Updated content'
    };

    const updated = await storage.updateOnlyOfficeDocument(document.id, updates);

    expect(updated).toBeDefined();
    expect(updated.title).toBe('Updated Document Title');
    expect(updated.content).toBe('Updated content');
    expect(updated.updatedAt).toBeDefined();
  });

  it('should handle document configuration for OnlyOffice editor', async () => {
    const documentData = {
      title: 'Editor Config Test',
      type: 'spreadsheet',
      fileType: 'xlsx',
      projectId: 1,
      createdBy: 1,
      key: `config_${Date.now()}`,
      url: '/uploads/documents/config.xlsx'
    };

    const document = await storage.createOnlyOfficeDocument(documentData);

    // Test that document can be configured for OnlyOffice
    expect(document.key).toBeDefined();
    expect(document.url).toBeDefined();
    expect(document.type).toBe('spreadsheet');
    expect(document.fileType).toBe('xlsx');
  });
});