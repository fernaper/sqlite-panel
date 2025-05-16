// Import necessary modules
import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
import { verifyToken } from '@/utils/auth'; // Import verifyToken
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

// Define the API route
export const GET: APIRoute = async ({ request }) => {
  try {
    // Authenticate the request using the JWT
    const decodedToken = verifyToken(request);
    if (!decodedToken || !decodedToken.loggedIn || !decodedToken.dbPath) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const dbPath = decodedToken.dbPath;

    // Parse URL parameters
    const urlParams = new URLSearchParams(request.url.split('?')[1]);
    const tableName = urlParams.get('table');
    const rowIndex = parseInt(urlParams.get('rowIndex') || '');
    const columnName = urlParams.get('columnName');
    console.log('Fetching blob data for:', { tableName, rowIndex, columnName });

    if (!tableName || isNaN(rowIndex) || !columnName) {
      return new Response(JSON.stringify({ error: 'Table name, row index, and column name are required' }), { status: 400 });
    }

    // Open the database
    let db: sqlite3.Database;
    try {
      db = await new Promise<sqlite3.Database>((resolve, reject) => {
        const database = new Database(dbPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(database);
          }
        });
      });
    } catch (error) {
      console.error('Error opening database:', error);
      return new Response(JSON.stringify({ error: 'Failed to open database' }), { status: 500 });
    }

    // Fetch the blob data
    const blobData = await new Promise((resolve, reject) => {
      db.get(`SELECT ${columnName} FROM ${tableName} LIMIT 1 OFFSET ?`,
        [rowIndex],
        (err, row: { [key: string]: any }) => {
        if (err) {
          reject(err);
        } else {
          resolve(row[columnName]);
        }
      });
    });

    db.close();

    console.log('Blob data fetched:', blobData);

    // Return the blob data as a binary response
    if (blobData === null) {
      return new Response(JSON.stringify({ error: 'Blob data is null' }), { status: 404 });
    }
    if (blobData && Buffer.isBuffer(blobData)) {
      return new Response(blobData, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${columnName}_${rowIndex}.bin"`
        }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Blob data not found' }), { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching blob data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch blob data' }), { status: 500 });
  }
};