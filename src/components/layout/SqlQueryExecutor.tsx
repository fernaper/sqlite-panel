import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A network error occurred.');
      console.error('Error executing query:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Execute SQL</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          id="sqlQuery"
          name="sqlQuery"
          placeholder="SELECT * FROM users WHERE id = 1;"
          rows={4}
          className="w-full p-2 font-mono box-border outline-1 outline-gray-400 dark:outline-gray-800 bg-gray-200 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300"
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
        ></textarea>
        <Button type="submit" className="mt-3" disabled={loading}>
          {loading ? 'Running...' : 'Run Query'}
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