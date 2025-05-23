import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
import { verifyToken } from '@/utils/auth';
const { Database } = sqlite3;

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Authenticate the request using the JWT
    const decodedToken = verifyToken(request);
    if (!decodedToken || !decodedToken.loggedIn || !decodedToken.dbPath) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const dbPath = decodedToken.dbPath;

    const { table, rowIndex, columnName, newValue } = await request.json();
    if (!table || rowIndex === undefined || !columnName || newValue === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 });
    }

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
      db.all(`PRAGMA table_info("${table}")`, (err, columns) => {
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
      db.all(`SELECT * FROM "${table}" LIMIT 1 OFFSET ?`, [rowIndex], (err, rows) => {
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

    // Update the row
    await new Promise((resolve, reject) => {
      db.run(`UPDATE "${table}" SET "${columnName}" = ? WHERE ${whereClause}`, [newValue, ...whereValues], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    db.close();

    return new Response(JSON.stringify({ message: 'Data updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error updating table data:', error);
    // Include the actual error message in the response
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: `Failed to update data: ${errorMessage}` }), { status: 500 });
  }
};