import React from 'react';  
  
interface Column<T> {  
  key: string;  
  header: string;  
  render?: (value: any, row: T) => React.ReactNode;  
}  
  
interface TableProps<T> {  
  columns: Column<T>[];  
  data: T[];  
  loading?: boolean;  
  keyExtractor?: (row: T) => string | number;  
}  
  
export function Table<T extends Record<string, any>>({  
  columns,  
  data,  
  loading,  
  keyExtractor,  
}: TableProps<T>) {  
  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;  
  if (!data.length) return <div className="p-8 text-center text-gray-400">No data found.</div>;  
  
  return (  
    <div className="overflow-x-auto border border-gray-200 rounded-md">  
      <table className="w-full text-sm">  
        <thead className="bg-gray-50 border-b-2 border-gray-200">  
          <tr>  
            {columns.map((col) => (  
              <th key={col.key} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">  
                {col.header}  
              </th>  
            ))}  
          </tr>  
        </thead>  
        <tbody>  
          {data.map((row, i) => {  
            const key = keyExtractor ? keyExtractor(row) : (row.id ?? i);  
            return (  
              <tr key={String(key)} className="border-b border-gray-100 hover:bg-gray-50 transition">  
                {columns.map((col) => (  
                  <td key={col.key} className="px-3 py-2">  
                    {col.render ? col.render(row[col.key], row) : row[col.key]}  
                  </td>  
                ))}  
              </tr>  
            );  
          })}  
        </tbody>  
      </table>  
    </div>  
  );  
}
