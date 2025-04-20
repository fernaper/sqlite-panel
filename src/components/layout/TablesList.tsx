import { useState, useEffect } from 'react';

export default function TablesList() {
  const [tables, setTables] = useState<string[]>([]);
  const [currentTable, setCurrentTable] = useState('');

  useEffect(() => {
    // Get currentTable from URL query parameter - only runs on client
    const urlParams = new URLSearchParams(window.location.search);
    setCurrentTable(urlParams.get('table') || '');

    const fetchTables = async () => {
      try {
        console.log('Fetching tables...');
        const response = await fetch('/api/db/tables', { credentials: 'include' });
        console.log('Response headers:', response.headers);
        const data = await response.json();
        if (response.ok) {
          setTables(data.tables || []);
        } else {
          console.error('Error fetching tables:', data.error || 'Unknown error');
          // Optionally set an error state here to display to the user
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };
    fetchTables();
  }, []);

  return (
    <ul>
      {tables.map(table => (
        <li className="mb-2" key={table}>
          <a
            href={`/admin?table=${table}`}
            className={`block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${table === currentTable ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
          >
            {table}
          </a>
        </li>
      ))}
    </ul>
  );
}