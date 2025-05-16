import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

import SqlQueryExecutor from '@/components/layout/SqlQueryExecutor.tsx';
import type { SingleQueryResult, ExecutorResponse } from '@/components/layout/SqlQueryExecutor.tsx';
import TableViewer from '@/components/layout/TableViewer.tsx'
import Card from '@/components/ui/Card.tsx';
import Button from '@/components/ui/Button';

interface AdminContentProps {
  dbPath: string;
}

export default function AdminContent({ dbPath }: AdminContentProps) {
  const [queryResults, setQueryResults] = useState<ExecutorResponse | null>(null);
  const [dbInfo, setDbInfo] = useState<SingleQueryResult | null>(null);
  const [initialTableName, setInitialTableName] = useState<string | null>(null); // State for initial table view

  const handleQueryResults = (results: ExecutorResponse | null) => {
    setQueryResults(results);
  };

  const refreshDatabaseInfo = async () => {
    try {
      const response = await fetch('/api/db/info', { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setDbInfo(data);
        // Set the first table name from dbInfo as the initial table to display
        if (data?.rows && data.rows.length > 0 && data.rows[0].name) {
          setInitialTableName(data.rows[0].name);
        }
      } else {
        console.error('Error fetching database info:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching database info:', error);
    }
  };

  useEffect(() => {
    refreshDatabaseInfo();
  }, []);

  return (
    <main className="flex-1 px-6 pb-6 overflow-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-sm font-bold my-3 text-gray-500 dark:text-gray-300">Database: {dbPath}</h1>
        <Button
          className="aspect-square !p-2 border-none group"
          variant='empty'
          aria-label="Reload database info and current table data"
          onClick={() => {
            refreshDatabaseInfo();
            setQueryResults(null); // Reset query results to show the initial table view
            toast.success('Database info reloaded');
          }}
        >
          <ArrowPathIcon className="h-5 w-5 text-gray-500 dark:text-gray-300 group-hover:rotate-180 transition-transform" />
        </Button>
      </div>

      {/* SQL Query Executor */}
      <SqlQueryExecutor onQueryResults={handleQueryResults} />

      {/* Render TableViewer component */}
      {((!queryResults?.results || queryResults?.results?.length === 0) && initialTableName) || (queryResults === null && initialTableName === null) ? (
        <TableViewer tableName={initialTableName} dbInfo={dbInfo} />
      ) : (
        queryResults?.results && queryResults?.results.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Query Results</h3>
            {queryResults?.results?.map((result, index) => (
              <div key={index} className="mb-4">
                {/* Display the executed query */}
                {queryResults?.queries?.[index] && queryResults.queries.length > 1 ? (
                  <div className="mb-2">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Query {index + 1}:</p>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-auto">{queryResults?.queries?.[index]}</pre>
                  </div>
                ) : <></>}

                {/* Render TableViewer for SELECT results or Card for others */}
                {result.columns && result.rows ? (
                  // Render TableViewer for SELECT results
                  <TableViewer initialData={result} />
                ) : (
                  // Render Card for errors or non-SELECT success
                  <Card>
                    {result.error ? (
                      <>
                        <p className="font-semibold text-red-600 dark:text-red-400">Error:</p>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-auto">{result.error}</pre>
                      </>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Query executed successfully (no rows returned).</p>
                    )}
                  </Card>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </main>
  );
}