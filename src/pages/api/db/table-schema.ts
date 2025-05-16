import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
import { verifyToken } from '@/utils/auth';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

export const GET: APIRoute = async ({ url, request }) => {
  try {
    // Authenticate the request using the JWT
    const decodedToken = verifyToken(request);
    if (!decodedToken || !decodedToken.loggedIn || !decodedToken.dbPath) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const dbPath = decodedToken.dbPath;

    const tableName = url.searchParams.get('tableName') || url.searchParams.get('table');
    if (!tableName) {
      return new Response(JSON.stringify({ error: 'Table name parameter is required' }), { status: 400 });
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

    // Use PRAGMA table_info to get schema details
    const schemaQuery = `PRAGMA table_info("${tableName}")`;

    const schemaData = await new Promise<any[]>((resolve, reject) => {
      db.all(schemaQuery, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    db.close();

    // Format the result to match QueryResult interface (assuming PRAGMA returns rows with 'name', 'type', 'notnull', 'pk' columns)
    const columns = [
      { name: 'cid' },
      { name: 'name' },
      { name: 'type' },
      { name: 'notnull' },
      { name: 'dflt_value' },
      { name: 'pk' },
    ];

    const result = { columns, rows: schemaData };

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error fetching table schema:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch table schema' }), { status: 500 });
  }
};