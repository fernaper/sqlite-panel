import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from "@google/generative-ai";
import sqlite3 from 'sqlite3';
import { verifyToken } from '@/utils/auth';
const { Database } = sqlite3;

export const prerender = false;

const config = {
  geminiApiKey: process.env.GEMINI_API_KEY  || import.meta.env.GEMINI_API_KEY,
  defaultQueryLimit: 500,
  geminiModel: process.env.GEMINI_MODEL  || import.meta.env.GEMINI_MODEL || "gemini-2.0-flash", // Gemini model to use
};

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: config.geminiModel }) : null;

// Helper function to get database schema
async function getDatabaseSchema(dbPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath, (err) => {
      if (err) {
        return reject(err);
      }

      db.all("SELECT name FROM sqlite_master WHERE type='table'", async (err, tables: { name: string }[]) => {
        if (err) {
          db.close();
          return reject(err);
        }

        let schemaString = "Database Schema:\n\n";

        for (const table of tables) {
          schemaString += `Table: ${table.name}\n`;
          const schemaQuery = `PRAGMA table_info("${table.name}")`;
          const schemaData = await new Promise<any[]>((res, rej) => {
            db.all(schemaQuery, (err, rows) => {
              if (err) {
                return rej(err);
              }
              res(rows);
            });
          });

          schemaData.forEach((col: any) => {
            schemaString += `  - ${col.name} (${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''})\n`;
          });
          schemaString += "\n";
        }

        db.close();
        resolve(schemaString);
      });
    });
  });
}


export const POST: APIRoute = async ({ request }) => {
  const { prompt } = await request.json();

  if (!model) {
    return new Response(JSON.stringify({ error: "Gemini API key not configured." }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Authenticate the request using the JWT
  const decodedToken = verifyToken(request);
  if (!decodedToken || !decodedToken.loggedIn || !decodedToken.dbPath) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const dbPath = decodedToken.dbPath;

  try {
    const dbSchema = await getDatabaseSchema(dbPath);

    const fullPrompt = `${dbSchema}\nGenerate a SQLite SQL query for the following request:\n${prompt}\nProvide only the SQL query, without any additional text or markdown formatting.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let generatedQuery = response.text().trim(); // Trim whitespace

    // Remove markdown code block if present
    const codeBlockRegex = /^```(?:\w+)?\n([\s\S]*?)\n```$/;
    const match = generatedQuery.match(codeBlockRegex);
    if (match && match[1]) {
      generatedQuery = match[1].trim();
    }

    return new Response(JSON.stringify({ query: generatedQuery }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error generating query:", error);
    return new Response(JSON.stringify({ error: "Failed to generate SQL query." }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};