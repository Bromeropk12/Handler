import React from 'react';
import {
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import EmptyState from './EmptyState';

const DataTable = ({
  columns = [],
  data = [],
  emptyTitle = 'Sin datos',
  emptyDescription = 'No hay registros disponibles.',
  emptyIcon,
  onRowClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="animate-pulse p-4 space-y-3">
          <div className="h-10 bg-surface-400 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="table-container">
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.headerClassName || ''}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <ChevronUpDownIcon className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={onRowClick ? 'cursor-pointer' : ''}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className={col.className || ''}>
                    {col.render ? col.render(row[col.key], row) : (typeof row[col.key] === 'object' && row[col.key] !== null ? JSON.stringify(row[col.key]) : row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-footer flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="btn-icon p-1.5 disabled:opacity-30"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="btn-icon p-1.5 disabled:opacity-30"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
