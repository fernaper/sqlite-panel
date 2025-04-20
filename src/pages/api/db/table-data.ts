import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

export const GET: APIRoute = async ({ cookies, request }) => {
  try {
    const session = cookies.get('session');
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { dbPath } = JSON.parse(session.value);
    if (!dbPath) {
      return new Response(JSON.stringify({ error: 'Database path not found in session' }), { status: 500 });
    }

    const urlParams = new URLSearchParams(request.url.split('?')[1]);
    const tableName = urlParams.get('table');
    if (!tableName) {
      return new Response(JSON.stringify({ error: 'Table name is required' }), { status: 400 });
    }

    const db = new Database(dbPath);

    const tableData = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
          reject(err);
        } else {
          db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve({ columns, rows });
            }
          });
        }
      });
    });

    db.close();

    return new Response(JSON.stringify(tableData), { status: 200 });
  } catch (error) {
    console.error('Error fetching table data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch table data' }), { status: 500 });
  }
};