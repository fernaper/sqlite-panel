import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
import { verifyToken } from '@/utils/auth';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

export const POST: APIRoute = async ({ request }) => {
  try {
    // Authenticate the request using the JWT
    const decodedToken = verifyToken(request);
    if (!decodedToken || !decodedToken.loggedIn || !decodedToken.dbPath) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const dbPath = decodedToken.dbPath;

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

    const queries = sqlQuery.split(';').map((q: string) => q.trim()).filter((q: string) => q.length > 0);
    const results = [];

    for (const query of queries) {
      if (!query) continue; // Skip empty queries

      try {
        const queryResult = await new Promise((resolve, reject) => {
          // Use db.all for queries that return rows (SELECT)
          // For other queries (INSERT, UPDATE, DELETE), db.run might be more appropriate,
          // but db.all can also work and return info about changes.
          db.all(query, [], (err, rows) => {
            if (err) {
              reject(err);
            } else {
              // If rows are returned, get column names from the first row if available
              const columns = rows && rows.length > 0 ? Object.keys(rows[0] as object).map(name => ({ name })) : [];
              resolve({ columns, rows });
            }
          });
        });
        results.push(queryResult);
      } catch (error) {
        // Handle error for a specific query
        console.error(`Error executing query "${query}":`, error);
        results.push({ query, error: error instanceof Error ? error.message : 'Query failed' });
        // Decide whether to continue or stop on error. For now, continue.
      }
    }

    db.close();

    return new Response(JSON.stringify({queries, results}), { status: 200 }); // Return array of results
  } catch (error) {
    console.error('Error executing SQL query:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to execute SQL query' }), { status: 500 });
  }
};