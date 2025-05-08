import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowDownIcon, ArrowUpIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import TextAreaInput from '@/components/ui/TextAreaInput';

interface QueryResult {
  columns: { name: string, type: string }[];
  rows: { [key: string]: any }[];
}

interface TableViewerProps {
  initialData?: QueryResult | null;
  dbInfo?: QueryResult | null;
}

export default function TableViewer({ initialData, dbInfo }: TableViewerProps) {
  const [tableName, setTableName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'data' | 'info'>('data'); // 'data' or 'info'
  const [tableData, setTableData] = useState<{
    columns: { name: string, type: string }[];
    rows: { [key: string]: any }[];
    pagination: {
      total: number;
      page: number;
      itemsPerPage: number;
      totalPages: number;
    };
  } | null>(null);
  const [tableSchema, setTableSchema] = useState<QueryResult | null>(null);
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnName: string;
    originalValue: any;
  } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    column: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ column: null, direction: null });
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  // Determine which data to display based on viewMode
  const dataToDisplay = viewMode === 'data' ? (initialData || tableData) : tableSchema;

  // Sort the table data (only applies to data view)
  const sortedData = useMemo(() => {
    if (viewMode !== 'data' || !sortConfig.column || !sortConfig.direction || !dataToDisplay) {
      return dataToDisplay?.rows;
    }

    return [...dataToDisplay.rows].sort((a, b) => {
      const aValue = a[sortConfig.column!];
      const bValue = b[sortConfig.column!];

      // Handle null values
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      if (aValue === bValue) return 0;

      // Try to convert to numbers if possible
      const aNum = Number(aValue);
      const bNum = Number(bValue);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Fall back to string comparison
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [dataToDisplay?.rows, sortConfig, viewMode]);

  const columnToType = useMemo(() => {
    if (viewMode !== 'data') return null;
    const data = dataToDisplay?.columns?.map(col => [col.name, col.type])
    if (!data) return null;
    return Object.fromEntries(data)
  }, [viewMode, dataToDisplay]);

  const handleSort = (columnName: string) => {
    // Only allow sorting if in data view and not displaying initialData
    if (viewMode === 'data' && !initialData) {
      setSortConfig(current => {
        if (current.column !== columnName) {
          return { column: columnName, direction: 'desc' };
        }
        if (current.direction === 'desc') {
          return { column: columnName, direction: 'asc' };
        }
        return { column: null, direction: null };
      });
    }
  };

  // Effect to read initial state from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const currentTableName = urlParams.get('table');
      const viewFromUrl = urlParams.get('view');
      const pageFromUrl = urlParams.get('page');
      const itemsPerPageFromUrl = urlParams.get('itemsPerPage');
      const sortColumnFromUrl = urlParams.get('sortColumn');
      const sortDirectionFromUrl = urlParams.get('sortDirection');

      setTableName(currentTableName);
      setViewMode(viewFromUrl === 'info' ? 'info' : 'data'); // Set view mode

      // Set initial page and itemsPerPage from URL, defaulting if not present or invalid (only for data view)
      if (viewFromUrl !== 'info') {
        const initialPage = pageFromUrl ? parseInt(pageFromUrl, 10) : 1;
        const initialItemsPerPage = itemsPerPageFromUrl ? parseInt(itemsPerPageFromUrl, 10) : 10;
        setCurrentPage(initialPage);
        setItemsPerPage(initialItemsPerPage);
      } else {
         // Reset pagination for info view
         setCurrentPage(1);
         setItemsPerPage(10);
      }


      // Set initial sort config from URL (only for data view)
      if (viewFromUrl !== 'info' && sortColumnFromUrl) {
        setSortConfig({
          column: sortColumnFromUrl,
          direction: (sortDirectionFromUrl as 'asc' | 'desc') || 'asc', // Default to asc if direction is invalid or not present
        });
      } else {
        // Reset sort config for info view
        setSortConfig({ column: null, direction: null });
      }
    }
  }, [initialData]); // This effect should only run on mount or when initialData changes

  // Effect to update URL query parameters when viewMode, page, itemsPerPage, or sortConfig changes
  useEffect(() => {
    // Only update URL on the client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);

      // Update view parameter
      if (viewMode === 'info') {
        urlParams.set('view', 'info');
      } else {
        urlParams.delete('view'); // Default is data, so remove parameter
      }

      // Update page and itemsPerPage parameters (only for data view)
      if (viewMode === 'data') {
        if (currentPage !== 1) {
          urlParams.set('page', currentPage.toString());
        } else {
          urlParams.delete('page');
        }

        if (itemsPerPage !== 10) {
          urlParams.set('itemsPerPage', itemsPerPage.toString());
        } else {
          urlParams.delete('itemsPerPage');
        }
      } else {
         // Remove data-specific parameters in info view
         urlParams.delete('page');
         urlParams.delete('itemsPerPage');
      }


      // Update sort parameters (only for data view)
      if (viewMode === 'data' && sortConfig.column) {
        urlParams.set('sortColumn', sortConfig.column);
        // Default to asc if direction is null
        urlParams.set('sortDirection', sortConfig.direction || 'asc');
      } else {
        // Remove sort parameters in info view
        urlParams.delete('sortColumn');
        urlParams.delete('sortDirection');
      }

      // Construct the new URL
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

      // Update the browser history without reloading the page
      window.history.replaceState({}, '', newUrl);
    }
  }, [viewMode, currentPage, itemsPerPage, sortConfig, initialData]);

  // Effect to fetch data based on viewMode and tableName
  useEffect(() => {
    // Only fetch data if initialData is NOT provided and tableName is set
    if (!initialData && tableName) {
      const fetchData = async () => {
        try {
          let url;
          if (viewMode === 'info') {
            // Use the new table-schema endpoint for info view
            url = new URL(`/api/db/table-schema`, window.location.origin);
            url.searchParams.set('table', tableName);
          } else { // viewMode === 'data'
            url = new URL(`/api/db/table-data`, window.location.origin);
            url.searchParams.set('table', tableName);
            url.searchParams.set('page', currentPage.toString());
            url.searchParams.set('itemsPerPage', itemsPerPage.toString());
            if (sortConfig.column) {
              url.searchParams.set('sortColumn', sortConfig.column);
              url.searchParams.set('sortDirection', sortConfig.direction || 'asc');
            }
          }

          const response = await fetch(url.toString(), { credentials: 'include' });
          const data = await response.json();
          if (response.ok) {
            if (viewMode === 'info') {
              setTableSchema(data);
              setTableData(null); // Clear table data when viewing info
            } else {
              setTableData(data);
              // Keep schema data when viewing data to determine column types for editing
              // setTableSchema(null);
            }
          } else {
            console.error(`Error fetching ${viewMode} data:`, data.error || 'Unknown error');
            // Optionally set an error state here to display to the user
          }
        } catch (error) {
          console.error(`Error fetching ${viewMode} data:`, error);
        }
      };
      fetchData();
    }
  }, [tableName, viewMode, currentPage, itemsPerPage, sortConfig, initialData]); // Add viewMode to dependencies

  const writeCell = ({ row, col }: { row: { [key: string]: any }, col: { name: string } }) => {
    const cellValue = row[col.name];
    if (typeof cellValue === 'object' && cellValue !== null && cellValue.type === 'Buffer' && Array.isArray(cellValue.data)) {
      return '[Blob Data]';
    }
    if (cellValue === null || cellValue === undefined) {
      return 'NULL';
    }
    const stringValue = String(cellValue);
    return stringValue.length > 1000 ? stringValue.substring(0, 1000) + '...' : stringValue;
  }

  // If initialData is provided, use it directly and skip table name check
  if (initialData) {
     if (!dataToDisplay || dataToDisplay.rows.length === 0) {
       return <p className="text-gray-600 dark:text-gray-400">No results to display.</p>;
     }
  } else {
    // Existing logic for displaying table data based on URL param
    if (tableName === null) { // Check if tableName is still null (initial state or no param)
      if (dbInfo) {
        if (dbInfo.rows.length > 0) {
          return (
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {dbInfo.columns.map((col, i) => (
                      <th
                        scope="col"
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${i == 0 ? 'rounded-tl-lg' : ''} ${i == dbInfo.columns.length - 1 ? 'rounded-tr-lg' : ''}`}
                        key={col.name}
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dbInfo.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      {dbInfo.columns.map((col, i) => (
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white relative max-w-xs overflow-hidden text-ellipsis ${i == 0 && rowIndex == dbInfo.rows.length - 1 ? 'rounded-bl-lg' : ''} ${i == dbInfo.columns.length - 1 && rowIndex == dbInfo.rows.length - 1 ? 'rounded-br-lg' : ''}`}
                          key={col.name}
                        >
                          {writeCell({ row, col })}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else {
          return <p className="text-gray-600 dark:text-gray-400">No database info available.</p>;
        }
      } else {
        // Original message if no table selected and no dbInfo provided
        return <p className="text-gray-600 dark:text-gray-400">Select a table from the sidebar.</p>;
      }
    }

    // Loading state based on viewMode
    if (viewMode === 'data' && !tableData) {
      return <p className="text-gray-600 dark:text-gray-400">Loading table data...</p>;
    }
    if (viewMode === 'info' && !tableSchema) {
       return <p className="text-gray-600 dark:text-gray-400">Loading table schema...</p>;
    }
  }

  // Render table data or schema based on viewMode
  if (viewMode === 'info') {
    if (!tableSchema || tableSchema.rows.length === 0) {
      return <p className="text-gray-600 dark:text-gray-400">No schema information available for this table.</p>;
    }
    return (
      <div className="overflow-x-auto rounded-lg">
        <h2 className="text-md mb-4 text-gray-800 dark:text-white">Schema for table: {tableName}</h2>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {tableSchema.columns.map((col, i) => (
                <th
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${i == 0 ? 'rounded-tl-lg' : ''} ${i == tableSchema.columns.length - 1 ? 'rounded-tr-lg' : ''}`}
                  key={col.name}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tableSchema.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                {tableSchema.columns.map((col, i) => (
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white relative max-w-xs overflow-hidden text-ellipsis ${i == 0 && rowIndex == tableSchema.rows.length - 1 ? 'rounded-bl-lg' : ''} ${i == tableSchema.columns.length - 1 && rowIndex == tableSchema.rows.length - 1 ? 'rounded-br-lg' : ''}`}
                    key={col.name}
                  >
                    {writeCell({ row, col })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Render table data (original logic)
  return (
    <>
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b-1 border-white dark:border-gray-800">
          <tr>
            {dataToDisplay?.columns?.map((col, i) => (
              <th
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${i == 0 ? 'rounded-tl-lg' : ''} ${i == dataToDisplay.columns.length - 1 ? 'rounded-tr-lg' : ''} relative group ${!initialData ? 'cursor-pointer' : ''}`}
                key={col.name}
                onClick={() => handleSort(col.name)}
                onMouseEnter={() => setHoveredColumn(col.name)}
                onMouseLeave={() => setHoveredColumn(null)}
              >
                <div className="flex items-center space-x-1">
                  <span>{col.name}</span>
                   {!initialData && ( // Only show sort icons if not displaying initialData
                     <div className={`transition-opacity ${hoveredColumn === col.name || sortConfig.column === col.name ? 'opacity-100' : 'opacity-0'}`}>
                       {sortConfig.column === col.name ? (
                         sortConfig.direction === 'desc' ? (
                           <ArrowDownIcon className="w-3 h-3" />
                         ) : (
                           <ArrowUpIcon className="w-3 h-3" />
                         )
                       ) : (
                         <ArrowDownIcon className="w-3 h-3 text-gray-400" />
                       )}
                     </div>
                    )}
                 </div>
               </th>
             ))}
           </tr>
         </thead>
         <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {(sortedData || dataToDisplay?.rows)?.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
              {dataToDisplay?.columns?.map((col, i) => (
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white relative max-w-xs overflow-hidden text-ellipsis ${i == 0 && rowIndex == dataToDisplay.rows.length - 1 ? 'rounded-bl-lg' : ''} ${i == dataToDisplay.columns.length - 1 && rowIndex == dataToDisplay.rows.length - 1 ? 'rounded-br-lg' : ''}`}
                  key={col.name}
                  // Disable editing if displaying initialData
                  onDoubleClick={() => {
                    if (!initialData) {
                      const cellValue = row[col.name];
                      const isBlob = (
                        typeof cellValue === 'object' && cellValue !== null && cellValue.type === 'Buffer' && Array.isArray(cellValue.data)
                      ) || cellValue === '[Blob Data]';

                      if (!isBlob) { // Only allow editing if it's NOT a blob
                        setEditingCell({
                          rowIndex,
                          columnName: col.name,
                          originalValue: cellValue
                        });
                        setTempValue(cellValue); // Initialize tempValue with the cell's current value
                      } else {
                        // Optionally provide feedback that blob columns are not editable
                        toast.info('Blob columns are not editable.');
                      }
                    }
                  }}
                >
                  {editingCell && editingCell.rowIndex === rowIndex && editingCell.columnName === col.name ? (
                    (() => {
                      const columnType = columnToType?.[col.name] || 'TEXT'; // Default to TEXT if type is not found
                      const isNumber = columnType === 'INTEGER' || columnType === 'REAL';
                      const InputComponent = isNumber ? TextInput : TextAreaInput;
                      const inputType = isNumber ? 'number' : 'text'; // Use 'text' for TextAreaInput

                      return (
                        <div className="flex items-center w-full h-full">
                          <InputComponent
                            className="w-full h-full p-0 border-0 focus:ring-0 min-w-16"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={async (e) => {
                              // Check if the blur is caused by clicking the cancel button
                              const relatedTarget = e.relatedTarget as HTMLElement | null;
                              if (relatedTarget && relatedTarget.closest('.cancel-edit-button')) {
                                setEditingCell(null); // Exit editing mode
                                // No need to revert tempValue here, as it's not used after cancelling
                                return; // Do not proceed with update
                              }

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
                                      newValue: isNumber ? (tempValue === '' ? null : Number(tempValue)) : tempValue // Convert to number or null if number type
                                    }),
                                    credentials: 'include'
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    console.error('Error updating table data:', errorData);
                                    // Attempt to display a more detailed error message
                                    const errorMessage = errorData.error
                                      ? typeof errorData.error === 'string'
                                        ? errorData.error
                                        : JSON.stringify(errorData.error) // Stringify if it's an object
                                      : 'Unknown error';
                                    toast.error(`Failed to update row: ${errorMessage}`);
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
                                  // Attempt to display a more detailed error message for catch block
                                  const errorMessage = error instanceof Error ? error.message : 'Network error';
                                  toast.error(`Failed to update row: ${errorMessage}`);
                                  // Revert the change in the UI
                                  setTableData(originalTableData);
                                }
                              }
                              setEditingCell(null); // Exit editing mode after update attempt
                            }}
                            autoFocus
                            type={inputType} // Apply input type for TextInput
                          />
                          <Button
                            variant="none"
                            className="p-1 ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cancel-edit-button" // Add a class for identification
                            onClick={() => {
                              setEditingCell(null); // Cancel editing
                              setTempValue(editingCell.originalValue); // Revert temp value
                            }}
                            aria-label="Cancel editing"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })()) : (
                      writeCell({ row, col })
                    )
                  }
                 </td>
               ))}
            </tr>
          ))}
         </tbody>
       </table>
       </div>
       {/* Pagination Controls */}
       {!initialData && tableData?.pagination && ( // Only show pagination if not displaying initialData and pagination data exists
         <div className="flex justify-between items-center mt-4 px-6">
           <div className="flex items-center space-x-2">
             <label htmlFor="itemsPerPage" className="text-sm text-gray-600 dark:text-gray-400">
               Rows per page:
             </label>
             <Select
               id="itemsPerPage"
               value={itemsPerPage}
               onChange={(e) => {
                 const newItemsPerPage = Number(e.target.value);
                 setItemsPerPage(newItemsPerPage);
                 setCurrentPage(1); // Reset to first page when changing items per page
               }}
               className="form-select text-sm !px-2 !py-1"
             >
               {[10, 25, 50, 100, -1].map((num) => (
                 <option key={num} value={num === -1 ? tableData.pagination.total : num}>
                   {num === -1 ? 'All' : num}
                 </option>
               ))}
             </Select>
             <span className="text-sm text-gray-600 dark:text-gray-400 ml-4">
               Total: {tableData.pagination.total} rows
             </span>
           </div>
           <div className="flex items-center space-x-2">
             <button
               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
               disabled={currentPage === 1}
               className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
             >
               Previous
             </button>
             <span className="text-sm text-gray-600 dark:text-gray-400">
               Page {tableData.pagination.page} of {tableData.pagination.totalPages}
             </span>
             <button
               onClick={() => setCurrentPage(prev =>
                 prev < tableData.pagination.totalPages ? prev + 1 : prev
               )}
               disabled={currentPage >= tableData.pagination.totalPages}
               className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
             >
               Next
             </button>
           </div>
         </div>
       )}
     </>
   );
 }