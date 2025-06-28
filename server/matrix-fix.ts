
/**
 * Matrix Persistence Fix
 * 
 * This script provides a direct database interaction layer to solve
 * the disappearing markers issue in the traceability matrix.
 */

import { Pool } from 'pg';

// Create a PostgreSQL connection pool using the environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize the database schema if needed
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Create the matrix_cells table if it doesn't exist
    await pool.query(`
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
    `);
    
    // Create index for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS matrix_cells_lookup_idx ON matrix_cells (project_id, row_module_id, col_module_id);
    `);
    
    console.log('Matrix cells database schema initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    return false;
  }
}

// Save a matrix cell directly to the database
export async function saveMatrixCell(rowModuleId: number, colModuleId: number, projectId: number, value: string, userId: number) {
  try {
    // Check if cell already exists
    const checkResult = await pool.query(
      'SELECT id FROM matrix_cells WHERE row_module_id = $1 AND col_module_id = $2 AND project_id = $3',
      [rowModuleId, colModuleId, projectId]
    );
    
    if (checkResult.rows.length > 0) {
      // Update existing cell
      const result = await pool.query(
        `UPDATE matrix_cells 
         SET value = $1, updated_at = NOW()
         WHERE row_module_id = $2 AND col_module_id = $3 AND project_id = $4
         RETURNING *`,
        [value, rowModuleId, colModuleId, projectId]
      );
      
      console.log('Updated matrix cell:', result.rows[0]);
      return result.rows[0];
    } else {
      // Insert new cell
      const result = await pool.query(
        `INSERT INTO matrix_cells (row_module_id, col_module_id, project_id, value, created_by_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [rowModuleId, colModuleId, projectId, value, userId]
      );
      
      console.log('Inserted new matrix cell:', result.rows[0]);
      return result.rows[0];
    }
  } catch (error) {
    console.error('Failed to save matrix cell:', error);
    throw error;
  }
}

// Get all matrix cells for a project
export async function getMatrixCellsByProject(projectId: number) {
  try {
    const result = await pool.query(
      'SELECT * FROM matrix_cells WHERE project_id = $1',
      [projectId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Failed to get matrix cells for project:', error);
    throw error;
  }
}
