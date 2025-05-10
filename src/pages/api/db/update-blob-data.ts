// Import necessary modules
import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

// Define the API route
export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    // Authenticate the request
    const session = cookies.get('sqlite-panel-session');
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { dbPath } = JSON.parse(session.value);
    if (!dbPath) {
      return new Response(JSON.stringify({ error: 'Database path not found in session' }), { status: 500 });
    }

    // Parse the request body
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tableName = formData.get('table') as string;
    const rowIndex = parseInt(formData.get('rowIndex') as string, 10);
    const columnName = formData.get('columnName') as string;

    if (!file || !tableName || isNaN(rowIndex) || !columnName) {
      return new Response(JSON.stringify({ error: 'File, table name, valid row index, and column name are required' }), { status: 400 });
    }

    // Open the database
    let db: sqlite3.Database;
    try {
      db = await new Promise<sqlite3.Database>((resolve, reject) => {
        const database = new Database(dbPath, (err) => {
          if (err) {
            if ((err as any).code === 'SQLITE_CANTOPEN') {
              reject(new Error('Database file not found or inaccessible.'));
            } else {
              reject(err);
            }
          } else {
            resolve(database);
          }
        });
      });
    } catch (error) {
      console.error('Error opening database:', error);
      if (error instanceof Error && error.message === 'Database file not found or inaccessible.') {
         return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ error: 'Failed to open database' }), { status: 500 });
    }

    // Get primary key column(s)
    const pragmaResult = await new Promise<any[]>((resolve, reject) => {
      db.all(`PRAGMA table_info("${tableName}")`, (err, columns) => {
        if (err) reject(err);
        else resolve(columns);
      });
    });

    const primaryKeyColumns = pragmaResult.filter((col: any) => col.pk > 0).sort((a: any, b: any) => a.pk - b.pk);

    if (primaryKeyColumns.length === 0) {
      db.close();
      return new Response(JSON.stringify({ error: 'Table has no primary key' }), { status: 400 });
    }

    // Get the row to update
    const rowsResult = await new Promise<any[]>((resolve, reject) => {
      db.all(`SELECT * FROM "${tableName}" LIMIT 1 OFFSET ?`, [rowIndex], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (rowsResult.length === 0) {
      db.close();
      return new Response(JSON.stringify({ error: 'Row not found' }), { status: 404 });
    }

    const row = rowsResult[0];

    // Build WHERE clause using primary key
    const whereClause = primaryKeyColumns.map((col: any) => `"${col.name}" = ?`).join(' AND ');
    const whereValues = primaryKeyColumns.map((col: any) => row[col.name]);

    // Update the blob data
    const buffer = Buffer.from(await file.arrayBuffer());
    await new Promise<void>((resolve, reject) => {
      db.run(`UPDATE "${tableName}" SET "${columnName}" = ? WHERE ${whereClause}`, [buffer, ...whereValues], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    db.close();

    return new Response(JSON.stringify({ message: 'Blob data updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error updating blob data:', error);
    // Include the actual error message in the response
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: `Failed to update blob data: ${errorMessage}` }), { status: 500 });
  }
};