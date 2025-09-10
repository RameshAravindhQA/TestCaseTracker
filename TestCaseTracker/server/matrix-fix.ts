
/**
 * Matrix Persistence Fix
 * 
 * This script provides a direct database interaction layer to solve
 * the disappearing markers issue in the traceability matrix.
 */

import { neon } from "@neondatabase/serverless";

// Create a PostgreSQL connection using Neon
const sql = neon(process.env.DATABASE_URL || '');

// Initialize database tables if they don't exist
export async function initializeDatabase() {
  try {
    // Create traceability_markers table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS traceability_markers (
        id SERIAL PRIMARY KEY,
        marker_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#007bff',
        icon TEXT,
        description TEXT,
        project_id INTEGER NOT NULL,
        created_by_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      )
    `;

    // Create matrix_cells table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS matrix_cells (
        id SERIAL PRIMARY KEY,
        row_module_id INTEGER NOT NULL,
        col_module_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        value TEXT NOT NULL,
        created_by_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        UNIQUE(row_module_id, col_module_id, project_id)
      )
    `;

    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return false;
  }
}

// Save matrix cell to database
export async function saveMatrixCell(cellData: {
  rowModuleId: number;
  colModuleId: number;
  projectId: number;
  value: string;
  userId: number;
}) {
  try {
    const result = await sql`
      INSERT INTO matrix_cells (row_module_id, col_module_id, project_id, value, created_by_id, updated_at)
      VALUES (${cellData.rowModuleId}, ${cellData.colModuleId}, ${cellData.projectId}, ${cellData.value}, ${cellData.userId}, NOW())
      ON CONFLICT (row_module_id, col_module_id, project_id)
      DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = NOW(),
        created_by_id = EXCLUDED.created_by_id
      RETURNING *
    `;
    
    console.log('✅ Matrix cell saved to database:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ Error saving matrix cell:', error);
    throw error;
  }
}

// Get matrix cells for a project
export async function getMatrixCellsByProject(projectId: number) {
  try {
    const result = await sql`
      SELECT * FROM matrix_cells 
      WHERE project_id = ${projectId}
      ORDER BY created_at ASC
    `;
    
    console.log(`✅ Retrieved ${result.length} matrix cells for project ${projectId}`);
    return result;
  } catch (error) {
    console.error('❌ Error getting matrix cells:', error);
    throw error;
  }
}

// Save traceability marker to database
export async function saveTraceabilityMarker(markerData: {
  markerId: string;
  name: string;
  color: string;
  type: string;
  projectId: number;
  userId: number;
  icon?: string;
  description?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO traceability_markers (marker_id, name, color, icon, description, project_id, created_by_id, updated_at)
      VALUES (${markerData.markerId}, ${markerData.name}, ${markerData.color}, ${markerData.icon || null}, ${markerData.description || null}, ${markerData.projectId}, ${markerData.userId}, NOW())
      RETURNING *
    `;
    
    console.log('✅ Traceability marker saved to database:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ Error saving traceability marker:', error);
    throw error;
  }
}

// Get traceability markers for a project
export async function getTraceabilityMarkersByProject(projectId: number) {
  try {
    const result = await sql`
      SELECT * FROM traceability_markers 
      WHERE project_id = ${projectId}
      ORDER BY created_at ASC
    `;
    
    console.log(`✅ Retrieved ${result.length} traceability markers for project ${projectId}`);
    return result;
  } catch (error) {
    console.error('❌ Error getting traceability markers:', error);
    throw error;
  }
}

// Delete matrix cell
export async function deleteMatrixCell(rowModuleId: number, colModuleId: number, projectId: number) {
  try {
    const result = await sql`
      DELETE FROM matrix_cells 
      WHERE row_module_id = ${rowModuleId} 
        AND col_module_id = ${colModuleId} 
        AND project_id = ${projectId}
      RETURNING *
    `;
    
    console.log('✅ Matrix cell deleted from database:', result[0]);
    return result[0];
  } catch (error) {
    console.error('❌ Error deleting matrix cell:', error);
    throw error;
  }
}
let sql: any = null;

try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL);
    console.log('✅ Database connection established for matrix operations');
  }
} catch (error) {
  console.log('Database connection not available, running in memory mode');
}

// Initialize the database schema if needed
export async function initializeDatabase(): Promise<boolean> {
  if (!sql) {
    console.log('No database connection available, skipping matrix database initialization');
    return true; // Return true to allow app to continue
  }

  try {
    // Test the connection first
    await sql`SELECT 1`;
    
    // Create the matrix_cells table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS matrix_cells (
        id SERIAL PRIMARY KEY,
        row_module_id INTEGER NOT NULL,
        col_module_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        value TEXT NOT NULL,
        created_by_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `;
    
    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS matrix_cells_lookup_idx ON matrix_cells (project_id, row_module_id, col_module_id);
    `;
    
    console.log('Matrix cells database schema initialized');
    return true;
  } catch (error) {
    console.log('Database not available, running without matrix persistence:', error.message);
    return true; // Return true to allow app to continue
  }
}

// Save a matrix cell directly to the database
export async function saveMatrixCell(rowModuleId: number, colModuleId: number, projectId: number, value: string, userId: number) {
  if (!sql) {
    console.log('No database connection, matrix cell not persisted');
    return { id: Date.now(), rowModuleId, colModuleId, projectId, value, userId };
  }

  try {
    // Check if cell already exists
    const checkResult = await sql`
      SELECT id FROM matrix_cells 
      WHERE row_module_id = ${rowModuleId} 
      AND col_module_id = ${colModuleId} 
      AND project_id = ${projectId}
    `;
    
    if (checkResult.length > 0) {
      // Update existing cell
      const result = await sql`
        UPDATE matrix_cells 
        SET value = ${value}, updated_at = NOW()
        WHERE row_module_id = ${rowModuleId} 
        AND col_module_id = ${colModuleId} 
        AND project_id = ${projectId}
        RETURNING *
      `;
      
      console.log('Updated matrix cell:', result[0]);
      return result[0];
    } else {
      // Insert new cell
      const result = await sql`
        INSERT INTO matrix_cells (row_module_id, col_module_id, project_id, value, created_by_id, created_at)
        VALUES (${rowModuleId}, ${colModuleId}, ${projectId}, ${value}, ${userId}, NOW())
        RETURNING *
      `;
      
      console.log('Inserted new matrix cell:', result[0]);
      return result[0];
    }
  } catch (error) {
    console.log('Failed to save matrix cell, running without persistence:', error.message);
    return { id: Date.now(), rowModuleId, colModuleId, projectId, value, userId };
  }
}

// Get all matrix cells for a project
export async function getMatrixCellsByProject(projectId: number) {
  if (!sql) {
    console.log('No database connection, returning empty matrix cells');
    return [];
  }

  try {
    const result = await sql`
      SELECT * FROM matrix_cells WHERE project_id = ${projectId}
    `;
    
    return result;
  } catch (error) {
    console.log('Failed to get matrix cells for project, returning empty:', error.message);
    return [];
  }
}
