import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const session = cookies.get('session');
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { dbPath } = JSON.parse(session.value);
    if (!dbPath) {
      return new Response(JSON.stringify({ error: 'Database path not found in session' }), { status: 500 });
    }

    const { table, rowIndex, columnName, newValue } = await request.json();
    if (!table || rowIndex === undefined || !columnName || newValue === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 });
    }

    const db = new Database(dbPath);

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
    return new Response(JSON.stringify({ error: 'Failed to update data' }), { status: 500 });
  }
};