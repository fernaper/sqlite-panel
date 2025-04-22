import { useState, useEffect } from 'react';
import SqlQueryExecutor from '@/components/layout/SqlQueryExecutor.tsx';
import TableViewer from '@/components/layout/TableViewer.tsx'

interface QueryResult {
  columns: { name: string }[];
  rows: { [key: string]: any }[];
}

interface AdminContentProps {
  dbPath: string;
}

export default function AdminContent({ dbPath }: AdminContentProps) {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [dbInfo, setDbInfo] = useState<QueryResult | null>(null);

  const handleQueryResult = (result: QueryResult | null) => {
    setQueryResult(result);
  };

  useEffect(() => {
    const fetchDbInfo = async () => {
      try {
        const response = await fetch('/api/db/info', { credentials: 'include' });
        const data = await response.json();
        if (response.ok) {
          setDbInfo(data);
        } else {
          console.error('Error fetching database info:', data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching database info:', error);
      }
    };
    fetchDbInfo();
  }, []);

  return (
    <main className="flex-1 px-6 pb-6 overflow-auto">
      <h1 className="text-sm font-bold my-3 text-gray-500 dark:text-gray-300">Database: {dbPath}</h1>

      {/* SQL Query Executor */}
      <SqlQueryExecutor onQueryResult={handleQueryResult} />

      {/* Render TableViewer component */}
      <TableViewer initialData={queryResult} dbInfo={dbInfo} />

    </main>
  );
}