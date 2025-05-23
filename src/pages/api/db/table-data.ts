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

    const urlParams = new URLSearchParams(request.url.split('?')[1]);
    const tableName = urlParams.get('table');
    const page = parseInt(urlParams.get('page') || '1');
    const itemsPerPage = parseInt(urlParams.get('itemsPerPage') || '10');
    
    if (!tableName) {
      return new Response(JSON.stringify({ error: 'Table name is required' }), { status: 400 });
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

    const tableData = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Get total count first
        db.get(`SELECT COUNT(*) as total FROM ${tableName}`, (err, countResult: { total: number }) => {
          if (err) {
            reject(err);
            return;
          }

          const offset = (page - 1) * itemsPerPage;
          // Get paginated rows
          db.all(
            `SELECT * FROM ${tableName} LIMIT ? OFFSET ?`,
            [itemsPerPage, offset],
            (err, rows: { [key: string]: any }[]) => {
              if (err) {
                reject(err);
              } else {
                // Identify blob columns based on type from PRAGMA table_info
                const blobColumnNames = columns
                  .filter((col: any) => col.type.toUpperCase() === 'BLOB')
                  .map((col: any) => col.name);

                // Replace blob data with '[Blob Data]' string
                const processedRows = rows.map(row => {
                  const newRow: { [key: string]: any } = {};
                  for (const colName in row) {
                    if (blobColumnNames.includes(colName)) {
                      newRow[colName] = '[Blob Data]';
                    } else {
                      const cellValue = row[colName];
                      // Truncate string values to 1000 characters
                      if (typeof cellValue === 'string' && cellValue.length > 1000) {
                        newRow[colName] = cellValue.substring(0, 1000) + '...';
                      } else {
                        newRow[colName] = cellValue;
                      }
                    }
                  }
                  return newRow;
                });

                resolve({
                  columns,
                  rows: processedRows, // Use processedRows
                  pagination: {
                    total: countResult.total,
                    page,
                    itemsPerPage,
                    totalPages: Math.ceil(countResult.total / itemsPerPage)
                  }
                });
              }
            }
          );
        });
      });
    });

    db.close();

    return new Response(JSON.stringify(tableData), { status: 200 });
  } catch (error) {
    console.error('Error fetching table data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch table data' }), { status: 500 });
  }
};