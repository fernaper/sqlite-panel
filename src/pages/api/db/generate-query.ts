import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from "@google/generative-ai";
import sqlite3 from 'sqlite3';
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


export const POST: APIRoute = async ({ request, cookies }) => {
  const { prompt } = await request.json();

  if (!model) {
    return new Response(JSON.stringify({ error: "Gemini API key not configured." }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const session = cookies.get('sqlite-panel-session');
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