import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowDownIcon, ArrowUpIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import TextAreaInput from '@/components/ui/TextAreaInput';
import Popover from '@/components/ui/Popover';
import Card from '@/components/ui/Card';

interface QueryResult {
  columns: { name: string, type?: string, notnull?: number }[];
  rows: { [key: string]: any }[];
}

interface FlexibleQueryResult {
  columns?: { name: string, type?: string, notnull?: number }[];
  rows?: { [key: string]: any }[];
  query?: string;
  error?: string;
}

interface TableViewerProps {
  initialData?: FlexibleQueryResult | null;
  dbInfo?: FlexibleQueryResult | null;
  tableName?: string | null;
}

export default function TableViewer({ initialData, dbInfo, tableName: propTableName }: TableViewerProps) {
  const [tableName, setTableName] = useState<string | null>(propTableName || null); // Use propTableName as initial state
  const [viewMode, setViewMode] = useState<'data' | 'info'>('data'); // 'data' or 'info'
  const [tableData, setTableData] = useState<{
    columns: { name: string, type?: string, notnull?: number }[];
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
  const [tempValue, setTempValue] = useState<
    string | number | null
  >('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    column: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ column: null, direction: null });
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const [blobCellControls, setBlobCellControls] = useState<{
    rowIndex: number;
    columnName: string;
  } | null>(null);

  // Determine which data to display based on viewMode
  const dataToDisplay = viewMode === 'data' ? (initialData || tableData) : tableSchema;

  // Sort the table data (only applies to data view)
  const sortedData = useMemo(() => {
    if (viewMode !== 'data' || !sortConfig.column || !sortConfig.direction || !dataToDisplay?.rows) {
      return dataToDisplay?.rows;
    }

    // Ensure dataToDisplay.rows is an array before sorting
    const rowsToSort = Array.isArray(dataToDisplay.rows) ? dataToDisplay.rows : [];

    return [...rowsToSort].sort((a, b) => {
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

  const columnCanBeNull = useMemo(() => {
    if (viewMode !== 'data') return null;
    const data = dataToDisplay?.columns?.map(col => [col.name, col.notnull ? false : true])
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

      // Only set tableName from URL if propTableName is not provided
      if (!propTableName) {
        setTableName(currentTableName);
      }
      
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
  }, [initialData, propTableName]);

  // Effect to update URL query parameters when viewMode, page, itemsPerPage, or sortConfig changes
  useEffect(() => {
    // Only update URL on the client side and if not displaying initialData
    if (typeof window !== 'undefined' && !initialData) {
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
    if (typeof cellValue === 'object' && cellValue !== null && cellValue.type === 'Buffer' && (Array.isArray(cellValue.data) || cellValue.data instanceof ArrayBuffer)) {
      return '[Blob Data]';
    }
    if (cellValue === null || cellValue === undefined) {
      return null;
    }
    const stringValue = String(cellValue);
    return stringValue.length > 1000 ? stringValue.substring(0, 1000) + '...' : stringValue;
  }
  
  const isBlobCell = (cellValue: any) => {
    return (
      typeof cellValue === 'object' && cellValue !== null && cellValue.type === 'Buffer' && (Array.isArray(cellValue.data) || cellValue.data instanceof ArrayBuffer)
    ) || cellValue === '[Blob Data]';
  };

  const handleDownloadBlob = (rowIndex: number, columnName: string) => {
    const url = new URL(`/api/db/blob-data`, window.location.origin);
    url.searchParams.set('table', tableName!);
    url.searchParams.set('rowIndex', rowIndex.toString());
    url.searchParams.set('columnName', columnName);
    window.open(url.toString(), '_blank');
  };
  
  // Accept rowIndex as parameter
  const handleBlobUpdate = async (rowIndex: number, columnName: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('table', tableName!);
      formData.append('rowIndex', rowIndex.toString());
      formData.append('columnName', columnName);
  
      const response = await fetch(`/api/db/update-blob-data`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Failed to update blob: ${errorData.error}`);
      } else {
        toast.success('Blob updated successfully!');
        // Update the table data optimistically
        const updatedTableData = { ...tableData! };
        updatedTableData.rows[rowIndex][columnName] = {
          type: 'Buffer',
          data: await file.arrayBuffer()
        };
        setTableData(updatedTableData);
      }
    } catch (error) {
      console.error('Error updating blob data:', error);
      toast.error('Failed to update blob');
    }
  };

  return (
    <>
      {/* Conditionally render initial TableViewer or query results */}
      {(!initialData && tableName) ? ( // Render initial TableViewer if no initialData and tableName is set
        viewMode === 'info' ? (
          // Info view
          !tableSchema || !tableSchema.rows || tableSchema.rows.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No schema information available for this table.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <h2 className="text-md mb-4 text-gray-800 dark:text-white">Schema for table: {tableName}</h2>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {tableSchema.columns?.map((col, i) => (
                      <th
                        scope="col"
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${i == 0 ? 'rounded-tl-lg' : ''} ${i == (tableSchema.columns?.length ?? 0) - 1 ? 'rounded-tr-lg' : ''}`}
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
                      {tableSchema.columns?.map((col, i) => (
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white relative max-w-xs overflow-hidden text-ellipsis ${i == 0 && rowIndex == (tableSchema.rows?.length ?? 0) - 1 ? 'rounded-bl-lg' : ''} ${i == (tableSchema.columns?.length ?? 0) - 1 && rowIndex == (tableSchema.rows?.length ?? 0) - 1 ? 'rounded-br-lg' : ''}`}
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
          )
        ) : (
          // Data view
          !tableData || !tableData.rows || tableData.rows.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No table data available.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b-1 border-white dark:border-gray-800">
                    <tr>
                      {tableData.columns?.map((col, i) => (
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${i == 0 ? 'rounded-tl-lg' : ''} ${i == (tableData.columns?.length ?? 0) - 1 ? 'rounded-tr-lg' : ''} relative group ${!initialData ? 'cursor-pointer' : ''}`}
                          key={col.name}
                          onClick={() => handleSort(col.name)}
                          onMouseEnter={() => setHoveredColumn(col.name)}
                          onMouseLeave={() => setHoveredColumn(null)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{col.name}</span>
                            {!initialData && (
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
                    {(sortedData || tableData.rows)?.map((row, rowIndex) => (
                      <tr key={rowIndex} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        {tableData.columns?.map((col, i) => (
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white relative max-w-xs overflow-hidden text-ellipsis ${i == 0 && rowIndex == (tableData.rows?.length ?? 0) - 1 ? 'rounded-bl-lg' : ''} ${i == (tableData.columns?.length ?? 0) - 1 && rowIndex == (tableData.rows?.length ?? 0) - 1 ? 'rounded-br-lg' : ''}`}
                            key={col.name}
                            // Disable editing if displaying initialData
                            onDoubleClick={() => {
                              if (!initialData) {
                                const cellValue = row[col.name];
                                // Assuming row.rowid contains the unique identifier
                                if (isBlobCell(cellValue)) {
                                  setBlobCellControls({ rowIndex, columnName: col.name });
                                } else {
                                  setEditingCell({
                                    rowIndex,
                                    columnName: col.name,
                                    originalValue: cellValue
                                  });
                                  setTempValue(cellValue);
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
                                      value={tempValue ?? ''}
                                      onChange={(e) => setTempValue(e.target.value)}
                                      onBlur={async (e) => {
                                        // Check if the blur is caused by clicking the cancel button or NULL button
                                        const relatedTarget = e.relatedTarget as HTMLElement | null;
                                        if (relatedTarget && (relatedTarget.closest('.cancel-edit-button') || relatedTarget.closest('.null-edit-button'))) {
                                          return; // Do not exit editing mode if clicking on NULL or Cancel button
                                        }

                                        setEditingCell(null); // Exit editing mode

                                        if (tempValue !== editingCell.originalValue) {
                                          // Optimistically update UI
                                          const originalTableData = JSON.parse(JSON.stringify(tableData)); // Deep copy for revert
                                          const updatedTableData = { ...tableData! }; // Assert tableData is not null
                                          updatedTableData.rows[rowIndex][col.name] = tempValue;
                                          setTableData(updatedTableData);

                                          // Send update to API
                                          try {
                                            const response = await fetch('/api/db/update-table-data', {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                              },
                                              body: JSON.stringify({
                                                table: tableName,
                                                rowIndex: rowIndex, // Pass the row index
                                                columnName: col.name,
                                                newValue: tempValue,
                                              }),
                                              credentials: 'include',
                                            });

                                            if (!response.ok) {
                                              const errorData = await response.json();
                                              toast.error(`Failed to update cell: ${errorData.error}`);
                                              // Revert UI on error
                                              setTableData(originalTableData);
                                            } else {
                                              toast.success('Cell updated successfully!');
                                            }
                                          } catch (error) {
                                            console.error('Error updating cell:', error);
                                            toast.error('Failed to update cell');
                                            // Revert UI on error
                                            setTableData(originalTableData);
                                          }
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLElement).blur(); // Trigger onBlur to save
                                        } else if (e.key === 'Escape') {
                                          setEditingCell(null); // Exit editing mode without saving
                                          setTempValue(editingCell.originalValue); // Revert temp value
                                        }
                                      }}
                                      autoFocus
                                    />
                                    {/* Add a button to set the cell value to NULL */}
                                    {columnCanBeNull?.[editingCell.columnName] && (
                                      <Popover
                                        element={
                                          <Button
                                            type="button"
                                            className="ml-1 px-2 py-1 text-xs null-edit-button"
                                            onClick={() => {
                                              setTempValue(null); // Set temp value to null
                                              // Programmatically blur the input to trigger save logic
                                              const inputElement = document.activeElement as HTMLElement;
                                              if (inputElement) {
                                                inputElement.blur();
                                              }
                                            }}
                                          >
                                            NULL
                                          </Button>
                                        }
                                      >
                                        Set cell value to NULL
                                      </Popover>
                                    )}
                                    {/* Add a cancel button */}
                                    <Popover
                                      element={
                                        <Button
                                          type="button"
                                          className="ml-1 px-2 py-1 text-xs cancel-edit-button"
                                          onClick={() => {
                                            setEditingCell(null); // Exit editing mode without saving
                                            setTempValue(editingCell.originalValue); // Revert temp value
                                          }}
                                        >
                                          <XMarkIcon className="w-3 h-3" />
                                        </Button>
                                      }
                                    >
                                      Cancel editing
                                    </Popover>
                                  </div>
                                );
                              })()) : blobCellControls && blobCellControls.rowIndex === rowIndex && blobCellControls.columnName === col.name ? (
                                <div className="flex items-center space-x-2 w-full h-full">
                                  <Button
                                    type="button"
                                    className="px-2 py-1 text-xs"
                                    onClick={() => handleDownloadBlob(rowIndex, col.name)}
                                  >
                                    Download Blob
                                  </Button>
                                  <Button
                                    type="button"
                                    className="px-2 py-1 text-xs"
                                    onClick={() => {
                                      // Trigger file input click
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) {
                                          handleBlobUpdate(rowIndex, col.name, file);
                                        }
                                      };
                                      input.click();
                                    }}
                                  >
                                    Update Blob
                                  </Button>
                                  <Button
                                    type="button"
                                    className="px-2 py-1 text-xs"
                                    onClick={() => setBlobCellControls(null)}
                                  >
                                    <XMarkIcon className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                writeCell({ row, col })
                              )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls (only for data view and not initialData) */}
              {viewMode === 'data' && !initialData && tableData?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <span>Items per page:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value, 10));
                        setCurrentPage(1); // Reset to first page on items per page change
                      }}
                    >
                      {[10, 25, 50, 100, -1].map((num) => (
                        <option key={num} value={num === -1 ? '-1' : num.toString()}>
                          {num === -1 ? 'All' : num}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                      Showing <span className="font-semibold text-gray-900 dark:text-white">{((tableData.pagination.page - 1) * tableData.pagination.itemsPerPage) + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(tableData.pagination.page * tableData.pagination.itemsPerPage, tableData.pagination.total)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{tableData.pagination.total}</span> entries
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={tableData.pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, tableData.pagination.totalPages))}
                      disabled={tableData.pagination.page === tableData.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )
        )
      ) : (
        // Render initialData if provided (which comes from query results in AdminContent)
        initialData ? (
          <div className="mt-6 space-y-4">
             {/* Display the executed query if available in initialData */}
             {initialData.query && (
               <div className="mb-2">
                 <p className="font-semibold text-gray-700 dark:text-gray-300">Query:</p>
                 <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-auto">{initialData.query}</pre>
               </div>
             )}

             {/* Render TableViewer for SELECT results or Card for others */}
             {initialData.columns && initialData.rows ? (
               // Render TableViewer for SELECT results
               <>
                 {!initialData.rows || initialData.rows.length === 0 ? (
                   <p className="text-gray-600 dark:text-gray-400">No results to display.</p>
                 ) : (
                   <>
                     <div className="overflow-x-auto rounded-lg">
                       <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                         <thead className="bg-gray-50 dark:bg-gray-700 border-b-1 border-white dark:border-gray-800">
                           <tr>
                             {initialData.columns?.map((col, i) => (
                               <th
                                 scope="col"
                                 className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${i == 0 ? 'rounded-tl-lg' : ''} ${i == (initialData.columns?.length ?? 0) - 1 ? 'rounded-tr-lg' : ''}`}
                                 key={col.name}
                               >
                                 {col.name}
                               </th>
                             ))}
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                           {initialData.rows.map((row, rowIndex) => (
                             <tr key={rowIndex} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                               {initialData.columns?.map((col, i) => (
                                 <td
                                   className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white relative max-w-xs overflow-hidden text-ellipsis ${i == 0 && rowIndex == (initialData.rows?.length ?? 0) - 1 ? 'rounded-bl-lg' : ''} ${i == (initialData.columns?.length ?? 0) - 1 && rowIndex == (initialData.rows?.length ?? 0) - 1 ? 'rounded-br-lg' : ''}`}
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
                   </>
                 )}
               </>
             ) : (
               // Render Card for errors or non-SELECT success
               <Card>
                 {initialData.error ? (
                   <>
                     <p className="font-semibold text-red-600 dark:text-red-400">Error:</p>
                     <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-auto">{initialData.error}</pre>
                   </>
                 ) : (
                   <p className="text-gray-600 dark:text-gray-400">Query executed successfully (no rows returned).</p>
                 )}
               </Card>
             )}
           </div>
        ) : ( // This else block should not be reached if initialData is handled above
          null
        )
      )}
    </>
  );
}