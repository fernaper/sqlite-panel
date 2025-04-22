import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const session = cookies.get('session');
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let dbPath;
    try {
      dbPath = JSON.parse(session.value)?.['dbPath'];
    } catch (error) {
      console.error('Error parsing session cookie:', error);
      return new Response(JSON.stringify({ error: 'Invalid session cookie' }), { status: 500 });
    }
    if (!dbPath) {
      return new Response(JSON.stringify({ error: 'Database path not found in session' }), { status: 500 });
    }

    const db = new Database(dbPath);

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