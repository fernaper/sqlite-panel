import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

export const GET: APIRoute = async ({ cookies, request }) => {
  try {
    const session = cookies.get('session');
    console.log('Session cookie:', session);
    if (!session) {
      console.log('No session cookie found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let dbPath
    try {
      dbPath = JSON.parse(session.value)?.['dbPath'];
      console.log('Parsed dbPath:', dbPath);
    } catch (error) {
      console.error('Error parsing session cookie:', error);
      return new Response(JSON.stringify({ error: 'Invalid session cookie' }), { status: 500 });
    }
    if (!dbPath) {
      return new Response(JSON.stringify({ error: 'Database path not found in session' }), { status: 500 });
    }

    const db = new Database(dbPath);

    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows: { name: string }[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.name));
        }
      });
    });

    db.close();

    return new Response(JSON.stringify({ tables }), { status: 200 });
  } catch (error) {
    console.error('Error listing tables:', error);
    return new Response(JSON.stringify({ error: 'Failed to list tables' }), { status: 500 });
  }
};