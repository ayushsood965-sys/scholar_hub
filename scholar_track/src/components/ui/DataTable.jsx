import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import EmptyState from './EmptyState';

const DataTable = ({
  columns = [],
  data = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  emptyTitle,
  emptyMessage,
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row?.[col.accessor]) : '';
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const col = columns.find(c => c.key === sortKey);
      const aVal = col?.accessor ? (typeof col.accessor === 'function' ? col.accessor(a) : a?.[col.accessor]) : '';
      const bVal = col?.accessor ? (typeof col.accessor === 'function' ? col.accessor(b) : b?.[col.accessor]) : '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div>
      {searchable && (
        <div className="table-search">
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <span className="text-sm text-muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {paginated.length === 0 ? (
        <EmptyState title={emptyTitle ?? 'No records found'} message={emptyMessage ?? 'Try adjusting your search or filters.'} />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    style={{ cursor: col.sortable !== false ? 'pointer' : 'default', userSelect: 'none' }}
                  >
                    <div className="flex items-center gap-xs">
                      {col.header}
                      {sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, i) => (
                <motion.tr
                  key={row._id ?? row.id ?? i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row)
                        : (typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : row?.[col.accessor] ?? '—'
                        )
                      }
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-md" style={{ padding: '0 4px' }}>
          <span className="text-sm text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-sm">
            <button className="btn btn-sm btn-outline" disabled={page === 0} onClick={() => setPage(0)}>
              <ChevronsLeft size={14} />
            </button>
            <button className="btn btn-sm btn-outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Prev
            </button>
            <button className="btn btn-sm btn-outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
            <button className="btn btn-sm btn-outline" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
