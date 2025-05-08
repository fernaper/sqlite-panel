import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const session = cookies.get('sqlite-panel-session');
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { dbPath } = JSON.parse(session.value);
    if (!dbPath) {
      return new Response(JSON.stringify({ error: 'Database path not found in session' }), { status: 500 });
    }

    const { sqlQuery } = await request.json();

    if (!sqlQuery) {
      return new Response(JSON.stringify({ error: 'SQL query is required' }), { status: 400 });
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

    const queryResult = await new Promise((resolve, reject) => {
      // Use db.all for queries that return rows (SELECT)
      // For other queries (INSERT, UPDATE, DELETE), db.run might be more appropriate,
      // but db.all can also work and return info about changes.
      db.all(sqlQuery, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // If rows are returned, get column names from the first row if available
          const columns = rows.length > 0 ? Object.keys(rows[0] as object).map(name => ({ name })) : [];
          resolve({ columns, rows });
        }
      });
    });

    db.close();

    return new Response(JSON.stringify(queryResult), { status: 200 });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to execute SQL query' }), { status: 500 });
  }
};