import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

export default function TableViewer() {
  const [tableName, setTableName] = useState<string | null>(null);
  const [tableData, setTableData] = useState<{
    columns: { name: string }[];
    rows: { [key: string]: any }[];
  } | null>(null);
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnName: string;
    originalValue: any;
  } | null>(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    // Get tableName from URL query parameter - only runs on client
    const urlParams = new URLSearchParams(window.location.search);
    const currentTableName = urlParams.get('table');
    setTableName(currentTableName);

    const fetchTableData = async () => {
      if (currentTableName) {
        try {
          const response = await fetch(`/api/db/table-data?table=${currentTableName}`, { credentials: 'include' });
          const data = await response.json();
          if (response.ok) {
            setTableData(data);
          } else {
            console.error('Error fetching table data:', data.error || 'Unknown error');
            // Optionally set an error state here to display to the user
          }
        } catch (error) {
          console.error('Error fetching table data:', error);
        }
      }
    };
    fetchTableData();
  }, []); // Run only once on mount

  if (tableName === null) { // Check if tableName is still null (initial state or no param)
    return <p className="text-gray-600 dark:text-gray-400">Select a table from the sidebar.</p>;
  }

  if (!tableData) {
    return <p className="text-gray-600 dark:text-gray-400">Loading table data...</p>;
  }

  return (
    <>
      {/* Ideally, Toaster should be placed in a higher-level layout component */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-gray-50 dark:!bg-gray-700 !text-gray-500 dark:!text-gray-300 !border-white dark:!border-gray-800',
        }}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {tableData.columns.map((col, i) => (
              <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${i == 0 ? 'rounded-tl-lg' : ''} ${i == tableData.columns.length - 1 ? 'rounded-tr-lg' : ''}`}
                key={col.name}
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {tableData.columns.map((col, i) => (
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white relative max-w-xs overflow-hidden text-ellipsis ${i == 0 && rowIndex == tableData.rows.length - 1 ? 'rounded-bl-lg' : ''} ${i == tableData.columns.length - 1 && rowIndex == tableData.rows.length - 1 ? 'rounded-br-lg' : ''}`}
                  key={col.name}
                  onDoubleClick={() => {
                    setEditingCell({
                      rowIndex,
                      columnName: col.name,
                      originalValue: row[col.name]
                    });
                    setTempValue(row[col.name]);
                  }}
                >
                  {editingCell && editingCell.rowIndex === rowIndex && editingCell.columnName === col.name ? (
                    <textarea
                      className="w-full h-full p-0 border-0 focus:ring-0"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onBlur={async () => {
                        if (tempValue !== editingCell.originalValue) {
                          // Optimistically update UI
                          const originalTableData = JSON.parse(JSON.stringify(tableData)); // Deep copy for revert
                          const updatedTableData = { ...tableData! }; // Assert tableData is not null
                          updatedTableData.rows[rowIndex][col.name] = tempValue;
                          setTableData(updatedTableData);

                          try {
                            const response = await fetch(`/api/db/update-table-data`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                table: tableName,
                                rowIndex: editingCell.rowIndex, // Use editingCell's rowIndex
                                columnName: col.name,
                                newValue: tempValue
                              }),
                              credentials: 'include'
                            });

                            if (!response.ok) {
                              const errorData = await response.json();
                              console.error('Error updating table data:', errorData);
                              toast.error(`Failed to update row: ${errorData.error || 'Unknown error'}`);
                              // Revert the change in the UI
                              setTableData(originalTableData);
                            } else {
                              toast.success('Row updated successfully!');
                              // Update original value in editingCell state if needed,
                              // though it's cleared right after anyway.
                              // If we wanted to allow further edits without re-fetching,
                              // we'd update the original value here.
                            }
                          } catch (error) {
                            console.error('Error updating table data:', error);
                            toast.error(`Failed to update row: ${error instanceof Error ? error.message : 'Network error'}`);
                            // Revert the change in the UI
                            setTableData(originalTableData);
                          }
                        }
                        setEditingCell(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span title={row[col.name]}>{row[col.name]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}