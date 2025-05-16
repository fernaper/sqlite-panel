import { useState, useEffect } from 'react';
import { CubeIcon } from '@heroicons/react/24/solid';

export default function TablesList() {
  const [tables, setTables] = useState<string[]>([]);
  const [currentTable, setCurrentTable] = useState('');
  const [currentView, setCurrentView] = useState<'data' | 'info'>('data'); // State to track current view mode

  useEffect(() => {
    // Get currentTable and view from URL query parameters - only runs on client
    const urlParams = new URLSearchParams(window.location.search);
    setCurrentTable(urlParams.get('table') || '');
    setCurrentView(urlParams.get('view') === 'info' ? 'info' : 'data');

    const fetchTables = async () => {
      try {
        const token = localStorage.getItem('sqlite-panel-jwt');
        if (!token) {
          console.error('JWT not found in localStorage');
          window.location.href = '/login';
          return;
        }
        const response = await fetch(
          '/api/db/tables', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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
          <div className="flex items-center justify-between gap-2">
            <a
              href={`/admin?table=${table}&view=info`}
              className={`cursor-pointer p-2 ms-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${table === currentTable && currentView === 'info' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
              aria-label={`View info for table ${table}`}
            >
              <CubeIcon className="w-5 h-5" />
            </a>
            <a
              href={`/admin?table=${table}`}
              className={`flex-grow block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${table === currentTable && currentView === 'data' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {table}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}