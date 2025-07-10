
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryStorage } from '../storage';
import { TestSheet, InsertTestSheet } from '../../shared/schema';

describe('Test Sheets API', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  afterEach(() => {
    // Clean up if needed
  });

  describe('Test Sheet CRUD Operations', () => {
    it('should create a test sheet', async () => {
      const sheetData: InsertTestSheet = {
        name: 'Test Sheet 1',
        projectId: 1,
        data: {
          cells: {
            'A1': { value: 'Hello', type: 'text' },
            'B1': { value: 123, type: 'number' },
          },
          rows: 100,
          cols: 26,
        },
        metadata: {
          version: 1,
          lastModifiedBy: 1,
          collaborators: [1],
          chartConfigs: [],
          namedRanges: [],
        },
        createdById: 1,
      };

      const sheet = await storage.createTestSheet(sheetData);

      expect(sheet.id).toBeDefined();
      expect(sheet.name).toBe('Test Sheet 1');
      expect(sheet.projectId).toBe(1);
      expect(sheet.data.cells['A1'].value).toBe('Hello');
      expect(sheet.data.cells['B1'].value).toBe(123);
    });

    it('should get test sheets by project', async () => {
      // Create test sheets for different projects
      const sheet1Data: InsertTestSheet = {
        name: 'Project 1 Sheet',
        projectId: 1,
        data: { cells: {}, rows: 10, cols: 10 },
        metadata: {
          version: 1,
          lastModifiedBy: 1,
          collaborators: [],
          chartConfigs: [],
          namedRanges: [],
        },
        createdById: 1,
      };

      const sheet2Data: InsertTestSheet = {
        name: 'Project 2 Sheet',
        projectId: 2,
        data: { cells: {}, rows: 10, cols: 10 },
        metadata: {
          version: 1,
          lastModifiedBy: 1,
          collaborators: [],
          chartConfigs: [],
          namedRanges: [],
        },
        createdById: 1,
      };

      await storage.createTestSheet(sheet1Data);
      await storage.createTestSheet(sheet2Data);

      const project1Sheets = await storage.getTestSheets(1);
      const project2Sheets = await storage.getTestSheets(2);

      expect(project1Sheets).toHaveLength(1);
      expect(project2Sheets).toHaveLength(1);
      expect(project1Sheets[0].name).toBe('Project 1 Sheet');
      expect(project2Sheets[0].name).toBe('Project 2 Sheet');
    });

    it('should update a test sheet', async () => {
      const sheetData: InsertTestSheet = {
        name: 'Original Sheet',
        projectId: 1,
        data: {
          cells: { 'A1': { value: 'Original', type: 'text' } },
          rows: 10,
          cols: 10,
        },
        metadata: {
          version: 1,
          lastModifiedBy: 1,
          collaborators: [],
          chartConfigs: [],
          namedRanges: [],
        },
        createdById: 1,
      };

      const sheet = await storage.createTestSheet(sheetData);

      const updatedData = {
        name: 'Updated Sheet',
        data: {
          cells: { 'A1': { value: 'Updated', type: 'text' } },
          rows: 20,
          cols: 20,
        },
        metadata: {
          version: 2,
          lastModifiedBy: 2,
          collaborators: [1, 2],
          chartConfigs: [],
          namedRanges: [],
        },
      };

      const updatedSheet = await storage.updateTestSheet(sheet.id, updatedData);

      expect(updatedSheet.name).toBe('Updated Sheet');
      expect(updatedSheet.data.cells['A1'].value).toBe('Updated');
      expect(updatedSheet.data.rows).toBe(20);
      expect(updatedSheet.metadata.version).toBe(2);
      expect(updatedSheet.metadata.collaborators).toHaveLength(2);
    });

    it('should delete a test sheet', async () => {
      const sheetData: InsertTestSheet = {
        name: 'Sheet to Delete',
        projectId: 1,
        data: { cells: {}, rows: 10, cols: 10 },
        metadata: {
          version: 1,
          lastModifiedBy: 1,
          collaborators: [],
          chartConfigs: [],
          namedRanges: [],
        },
        createdById: 1,
      };

      const sheet = await storage.createTestSheet(sheetData);
      
      const deleteResult = await storage.deleteTestSheet(sheet.id);
      expect(deleteResult).toBe(true);

      const deletedSheet = await storage.getTestSheet(sheet.id);
      expect(deletedSheet).toBeNull();
    });

    it('should duplicate a test sheet', async () => {
      const originalData: InsertTestSheet = {
        name: 'Original Sheet',
        projectId: 1,
        data: {
          cells: {
            'A1': { value: 'Data', type: 'text' },
            'B1': { value: 123, type: 'number' },
          },
          rows: 50,
          cols: 20,
        },
        metadata: {
          version: 5,
          lastModifiedBy: 1,
          collaborators: [1, 2],
          chartConfigs: [
            {
              id: 'chart1',
              type: 'bar',
              title: 'Test Chart',
              dataRange: 'A1:B10',
              position: { x: 0, y: 0, width: 400, height: 300 },
            },
          ],
          namedRanges: [
            { name: 'DataRange', range: 'A1:B10' },
          ],
        },
        createdById: 1,
      };

      const originalSheet = await storage.createTestSheet(originalData);
      const duplicatedSheet = await storage.duplicateTestSheet(
        originalSheet.id,
        'Duplicated Sheet',
        2
      );

      expect(duplicatedSheet.name).toBe('Duplicated Sheet');
      expect(duplicatedSheet.projectId).toBe(originalSheet.projectId);
      expect(duplicatedSheet.data.cells['A1'].value).toBe('Data');
      expect(duplicatedSheet.data.cells['B1'].value).toBe(123);
      expect(duplicatedSheet.metadata.version).toBe(1); // Reset for new sheet
      expect(duplicatedSheet.metadata.lastModifiedBy).toBe(2);
      expect(duplicatedSheet.metadata.chartConfigs).toHaveLength(1);
      expect(duplicatedSheet.metadata.namedRanges).toHaveLength(1);
      expect(duplicatedSheet.createdById).toBe(2);
    });
  });

  describe('Test Sheet Data Validation', () => {
    it('should validate sheet data structure', () => {
      const validSheetData = {
        cells: {
          'A1': { value: 'test', type: 'text' },
          'B1': { value: 123, type: 'number' },
        },
        rows: 100,
        cols: 26,
      };

      expect(validSheetData.cells).toBeDefined();
      expect(validSheetData.rows).toBeGreaterThan(0);
      expect(validSheetData.cols).toBeGreaterThan(0);
      expect(typeof validSheetData.cells['A1'].value).toBe('string');
      expect(typeof validSheetData.cells['B1'].value).toBe('number');
    });

    it('should validate cell data types', () => {
      const textCell = { value: 'Hello', type: 'text' };
      const numberCell = { value: 123, type: 'number' };
      const formulaCell = { value: 60, type: 'formula', formula: '=SUM(A1:A3)' };
      const booleanCell = { value: true, type: 'boolean' };
      const dateCell = { value: '2023-12-25', type: 'date' };

      expect(textCell.type).toBe('text');
      expect(numberCell.type).toBe('number');
      expect(formulaCell.type).toBe('formula');
      expect(formulaCell.formula).toBe('=SUM(A1:A3)');
      expect(booleanCell.type).toBe('boolean');
      expect(dateCell.type).toBe('date');
    });

    it('should validate metadata structure', () => {
      const validMetadata = {
        version: 1,
        lastModifiedBy: 1,
        collaborators: [1, 2, 3],
        chartConfigs: [
          {
            id: 'chart1',
            type: 'bar',
            title: 'Sales Chart',
            dataRange: 'A1:C10',
            position: { x: 100, y: 50, width: 400, height: 300 },
          },
        ],
        namedRanges: [
          { name: 'SalesData', range: 'A1:C10', description: 'Sales data range' },
        ],
      };

      expect(validMetadata.version).toBeGreaterThan(0);
      expect(Array.isArray(validMetadata.collaborators)).toBe(true);
      expect(Array.isArray(validMetadata.chartConfigs)).toBe(true);
      expect(Array.isArray(validMetadata.namedRanges)).toBe(true);
      expect(validMetadata.chartConfigs[0].type).toBe('bar');
      expect(validMetadata.namedRanges[0].name).toBe('SalesData');
    });
  });

  describe('Test Sheet Complex Operations', () => {
    it('should handle large sheets efficiently', async () => {
      const largeCells: Record<string, any> = {};
      
      // Generate 1000 cells with data
      for (let row = 0; row < 50; row++) {
        for (let col = 0; col < 20; col++) {
          const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
          largeCells[cellId] = {
            value: `Cell ${cellId}`,
            type: 'text',
          };
        }
      }

      const largeSheetData: InsertTestSheet = {
        name: 'Large Sheet',
        projectId: 1,
        data: {
          cells: largeCells,
          rows: 100,
          cols: 26,
        },
        metadata: {
          version: 1,
          lastModifiedBy: 1,
          collaborators: [],
          chartConfigs: [],
          namedRanges: [],
        },
        createdById: 1,
      };

      const startTime = Date.now();
      const sheet = await storage.createTestSheet(largeSheetData);
      const endTime = Date.now();

      expect(sheet.id).toBeDefined();
      expect(Object.keys(sheet.data.cells)).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle chart configurations', async () => {
      const sheetWithCharts: InsertTestSheet = {
        name: 'Chart Sheet',
        projectId: 1,
        data: {
          cells: {
            'A1': { value: 'Jan', type: 'text' },
            'A2': { value: 'Feb', type: 'text' },
            'B1': { value: 100, type: 'number' },
            'B2': { value: 150, type: 'number' },
          },
          rows: 10,
          cols: 10,
        },
        metadata: {
          version: 1,
          lastModifiedBy: 1,
          collaborators: [],
          chartConfigs: [
            {
              id: 'chart1',
              type: 'line',
              title: 'Monthly Sales',
              dataRange: 'A1:B2',
              position: { x: 300, y: 100, width: 500, height: 300 },
            },
            {
              id: 'chart2',
              type: 'pie',
              title: 'Sales Distribution',
              dataRange: 'A1:B2',
              position: { x: 300, y: 450, width: 400, height: 300 },
            },
          ],
          namedRanges: [],
        },
        createdById: 1,
      };

      const sheet = await storage.createTestSheet(sheetWithCharts);

      expect(sheet.metadata.chartConfigs).toHaveLength(2);
      expect(sheet.metadata.chartConfigs[0].type).toBe('line');
      expect(sheet.metadata.chartConfigs[1].type).toBe('pie');
      expect(sheet.metadata.chartConfigs[0].dataRange).toBe('A1:B2');
    });

    it('should handle named ranges', async () => {
      const sheetWithRanges: InsertTestSheet = {
        name: 'Named Ranges Sheet',
        projectId: 1,
        data: {
          cells: {},
          rows: 100,
          cols: 26,
        },
        metadata: {
          version: 1,
          lastModifiedBy: 1,
          collaborators: [],
          chartConfigs: [],
          namedRanges: [
            { name: 'SalesData', range: 'A1:C10', description: 'Monthly sales data' },
            { name: 'TotalRow', range: 'A11:C11', description: 'Total calculations' },
            { name: 'HeaderRow', range: 'A1:C1', description: 'Column headers' },
          ],
        },
        createdById: 1,
      };

      const sheet = await storage.createTestSheet(sheetWithRanges);

      expect(sheet.metadata.namedRanges).toHaveLength(3);
      expect(sheet.metadata.namedRanges[0].name).toBe('SalesData');
      expect(sheet.metadata.namedRanges[0].range).toBe('A1:C10');
      expect(sheet.metadata.namedRanges[0].description).toBe('Monthly sales data');
    });
  });
});
