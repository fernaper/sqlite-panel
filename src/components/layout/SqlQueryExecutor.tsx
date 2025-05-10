import { useState, useEffect } from 'react';
import { Editor as MonacoEditor, useMonaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import Button from '@/components/ui/Button.tsx';
import Card from '@/components/ui/Card.tsx';

interface QueryResult {
  columns: { name: string }[];
  rows: { [key: string]: any }[];
}

interface SqlQueryExecutorProps {
  onQueryResult: (result: QueryResult | null) => void;
}

export default function SqlQueryExecutor({ onQueryResult }: SqlQueryExecutorProps) {
  const [sqlQuery, setSqlQuery] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [editorMode, setEditorMode] = useState<'sql' | 'markdown'>('sql');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const monaco = useMonaco();

  const toggleEditorMode = () => {
    setEditorMode(prevMode => (prevMode === 'sql' ? 'markdown' : 'sql'));
  };

  useEffect(() => {
    const updateTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDarkMode ? 'dark' : 'light');
    };

    // Initial theme check
    updateTheme();

    // Observe changes to the 'dark' class on the html element
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Cleanup observer on component unmount
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchDbInfo = async () => {
      try {
        // Fetch table names
        const tablesResponse = await fetch('/api/db/tables');
        const tablesData = await tablesResponse.json();
        if (tablesResponse.ok) {
          setTableNames(tablesData.tables);
          
          // Fetch column names for each table
          const allColumnNames: string[] = [];
          for (const table of tablesData.tables) {
            const schemaResponse = await fetch(`/api/db/table-schema?tableName=${table}`);
            const schemaData = await schemaResponse.json();
            if (schemaResponse.ok) {
              const columns = schemaData.rows.map((col: any) => col.name);
              allColumnNames.push(...columns);
            } else {
              console.error(`Error fetching schema for table ${table}:`, schemaData.error);
            }
          }
          // Remove duplicates and update state
          setColumnNames(Array.from(new Set(allColumnNames)));
        } else {
          console.error('Error fetching tables:', tablesData.error);
        }
      } catch (error) {
        console.error('Error fetching database info:', error);
      }
    };

    fetchDbInfo();
  }, []);

  useEffect(() => {
    if (monaco) {
      const baseTheme = (currentTheme === 'dark' ? 'vs-dark' : 'vs') as any;
      monaco.editor.defineTheme('customTheme', {
        base: baseTheme,
        inherit: true,
        rules: [],
        colors: {
          'editor.background': currentTheme === 'dark' ? '#1f2937' : '#e5e7eb',  // bg-gray-800 dark:bg-gray-200
          'editor.lineHighlightBackground': currentTheme === 'dark' ? '#374151' : '#d1d5db', // bg-gray-700 dark:bg-gray-300
        },
      });
      monaco.editor.setTheme('customTheme');

      // Register a completion item provider
      const provider = monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const textBeforeCursor = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const words = textBeforeCursor.trim().split(/\s+/);
          const lastWord = words.length > 0 ? words[words.length - 1]?.toUpperCase() : ''; // Get the actual last word

          let suggestions: monaco.languages.CompletionItem[] = [];

          // Suggest columns after SELECT or a table name/alias (basic check)
          if (lastWord === 'SELECT' || tableNames.map(name => name.toUpperCase()).includes(lastWord)) {
             suggestions = columnNames.map(columnName => ({
              label: columnName,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: columnName,
              range: range,
            }));
          }
          // Suggest tables after FROM or JOIN
          else if (lastWord === 'FROM' || lastWord === 'JOIN') {
            suggestions = tableNames.map(tableName => ({
              label: tableName,
              kind: monaco.languages.CompletionItemKind.Field, // Or Table
              insertText: tableName,
              range: range,
            }));
          }
          // Otherwise, suggest keywords
          else {
            suggestions = [
              {
                label: 'SELECT',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'SELECT',
                range: range,
              },
              {
                label: 'FROM',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'FROM',
                range: range,
              },
              {
                label: 'WHERE',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'WHERE',
                range: range,
              },
              {
                label: 'INSERT INTO',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'INSERT INTO',
                range: range,
              },
              {
                label: 'VALUES',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'VALUES',
                range: range,
              },
              {
                label: 'UPDATE',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'UPDATE',
                range: range,
              },
              {
                label: 'SET',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'SET',
                range: range,
              },
              {
                label: 'DELETE FROM',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'DELETE FROM',
                range: range,
              },
              {
                label: 'CREATE TABLE',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'CREATE TABLE',
                range: range,
              },
              {
                label: 'DROP TABLE',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'DROP TABLE',
                range: range,
              },
              // Add more SQL keywords as needed
            ];
          }

          return { suggestions: suggestions };
        },
      });

      // Clean up the provider on component unmount
      return () => provider.dispose();
    }
  }, [monaco, currentTheme, tableNames, columnNames]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editorMode === 'sql') {
        const response = await fetch('/api/db/execute-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sqlQuery }),
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          onQueryResult(data);
        } else {
          setError(data.error || 'An unknown error occurred.');
          onQueryResult(null); // Clear previous results on error
        }
      } else { // editorMode === 'markdown'
        const response = await fetch('/api/db/generate-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: markdownContent }),
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          setSqlQuery(data.query);
          setEditorMode('sql');
          setMarkdownContent('');
          onQueryResult(null); // Clear previous results when generating a new query
        } else {
          setError(data.error || 'An unknown error occurred.');
          onQueryResult(null); // Clear previous results on error
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A network error occurred.');
      console.error('Error handling submit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Execute SQL</h3>
        <button
          type="button"
          className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
          onClick={toggleEditorMode}
        >
          {editorMode === 'sql' ? '💡 Generate with AI' : '📦 Switch to SQL'}
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="w-full h-30 bg-gray-200 dark:bg-gray-800" >
          <MonacoEditor
            language={editorMode}
            theme="customTheme"
            value={editorMode === 'sql' ? sqlQuery : markdownContent}
            onChange={(value) => {
              if (editorMode === 'sql') {
                setSqlQuery(value || '');
              } else {
                setMarkdownContent(value || '');
              }
            }}
            options={{
              minimap: { enabled: false},
              wordWrap: 'on',
              showUnused: false,
              folding: false,
              lineNumbersMinChars: 1,
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        <Button
          type="submit"
          className="mt-3"
          disabled={loading || (editorMode === 'markdown' && markdownContent.trim() === '') || (editorMode === 'sql' && sqlQuery.trim() === '')}
        >
          {loading ? 'Running...' : (editorMode === 'sql' ? 'Run Query' : 'Generate Query')}
        </Button>
      </form>

      {loading && <p className="mt-4 text-gray-600 dark:text-gray-400">Executing query...</p>}
      {error && (
        <div className="mt-4 text-red-600 dark:text-red-400">
          <p>Error:</p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-auto">{error}</pre>
        </div>
      )}

    </Card>
  );
}
