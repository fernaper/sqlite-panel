import type { APIRoute } from 'astro';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken
const { Database } = sqlite3;

export const prerender = false; // Mark this route as server-rendered

// Define JWT secret key from environment variables
const JWT_SECRET = import.meta.env.JWT_SECRET || 'your_default_secret_key'; // Use a strong secret in production

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();
    const dbPath = formData.get('dbPath')?.toString();

    // --- Authentication Logic ---
    // Replace with your actual authentication mechanism
    // This example uses environment variables for simplicity
    const expectedUser = import.meta.env.ADMIN_USER || 'guest'
    const expectedPassword = import.meta.env.ADMIN_PASSWORD || 'guest';

    if (!expectedUser || !expectedPassword) {
      console.error("ADMIN_USER or ADMIN_PASSWORD environment variables not set.");
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error.' }), { status: 500 });
    }

    if (username === expectedUser && password === expectedPassword) {
      // Authentication successful. Now, check database connection.
      const databasePath = dbPath || '/sqlite/data.db';
      let db: sqlite3.Database | null = null;

      try {
        db = await new Promise<sqlite3.Database>((resolve, reject) => {
          const database = new Database(databasePath, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(database);
            }
          });
        });

        // Close the connection immediately after successful open
        db.close();
        db = null; // Set db to null after closing

        // --- Token Generation ---
        // Generate a JWT upon successful authentication
        const token = jwt.sign({
            loggedIn: true,
            dbPath: databasePath,
          }, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

        // Return success response with the token
        return new Response(JSON.stringify({ success: true, message: 'Login successful.', token }), { status: 200 });

      } catch (dbError) {
        console.error('Database connection check failed:', dbError);
        if ((dbError as any).code === 'SQLITE_CANTOPEN') {
          return new Response(JSON.stringify({ success: false, message: 'Unable to open database file. Please check the path.' }), { status: 400 });
        } else {
          return new Response(JSON.stringify({ success: false, message: 'An error occurred while checking the database connection.' }), { status: 500 });
        }
      } finally {
        // Ensure db connection is closed if it was opened and not already closed
        if (db) {
          db.close();
        }
      }

    } else {
      // Authentication failed
      return new Response(JSON.stringify({ success: false, message: 'Invalid username or password.' }), { status: 401 });
    }
  } catch (error) {
    console.error("Login API error:", error);
    return new Response(JSON.stringify({ success: false, message: 'An unexpected error occurred.' }), { status: 500 });
  }
};

// Optional: Add a GET handler if needed, e.g., to check session status
// export const GET: APIRoute = ({ cookies }) => { ... };