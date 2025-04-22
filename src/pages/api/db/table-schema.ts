import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

export const GET: APIRoute = async ({ url, cookies }) => {
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

    const tableName = url.searchParams.get('table');
    if (!tableName) {
      return new Response(JSON.stringify({ error: 'Table name parameter is required' }), { status: 400 });
    }

    const db = new Database(dbPath);

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