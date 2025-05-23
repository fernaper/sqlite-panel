import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
import { verifyToken } from '@/utils/auth';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

export const GET: APIRoute = async ({ request }) => {
  try {
    // Authenticate the request using the JWT
    const decodedToken = verifyToken(request);
    if (!decodedToken || !decodedToken.loggedIn || !decodedToken.dbPath) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const dbPath = decodedToken.dbPath;

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

    // Get table names
    const tableNames = await new Promise<string[]>((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows: { name: string }[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.name));
        }
      });
    });

    const tableInfo = [];

    // Get row count for each table
    for (const tableName of tableNames) {
      const rowCountQuery = `SELECT COUNT(*) as row_count FROM "${tableName}"`;
      const rowCountResult = await new Promise<{ row_count: number }>((resolve, reject) => {
        db.get(rowCountQuery, (err, row: { row_count: number }) => {
          if (err) {
            // Log the error but don't fail the whole request for one table
            console.error(`Error getting row count for table ${tableName}:`, err);
            resolve({ row_count: -1 }); // Indicate error or unknown count
          } else {
            resolve(row);
          }
        });
      });
      tableInfo.push({ table_name: tableName, row_count: rowCountResult.row_count });
    }

    // Format the result to match QueryResult interface
    const columns = [
      { name: 'table_name' },
      { name: 'row_count' },
      // Note: Getting accurate size per table in SQLite is complex and not directly supported by simple queries.
      // We will not include size per table for now.
    ];
    const rows = tableInfo;

    const result = { columns, rows };

    db.close();

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error fetching database info:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch database info' }), { status: 500 });
  }
};