import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import EmptyState from './EmptyState';

const DataTable = ({
  columns = [],
  data: rawData = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize: defaultPageSize = 10,
  emptyTitle,
  emptyMessage,
}) => {
  const data = Array.isArray(rawData) ? rawData : [];
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        let val = '';
        if (col.accessor) {
          if (typeof col.accessor === 'function') {
            val = col.accessor(row);
          } else {
            val = col.accessor.split('.').reduce((acc, part) => acc && acc[part], row);
          }
        }
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const col = columns.find(c => c.key === sortKey);
      let aVal = '';
      let bVal = '';
      if (col?.accessor) {
        if (typeof col.accessor === 'function') {
          aVal = col.accessor(a);
          bVal = col.accessor(b);
        } else {
          aVal = col.accessor.split('.').reduce((acc, part) => acc && acc[part], a) ?? '';
          bVal = col.accessor.split('.').reduce((acc, part) => acc && acc[part], b) ?? '';
        }
      }
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
      {/* Search and Page Size Filter Grid Controls */}
      <div className="grid-controls-container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        width: '100%'
      }}>
        {/* Search Box */}
        {searchable && (
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
        )}

        {/* Page Size Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #64748B)' }}>Show:</span>
            <select
              className="form-input"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              style={{ width: 'auto', padding: '6px 12px', cursor: 'pointer', borderRadius: '6px' }}
            >
              <option value="10">view 1-10</option>
              <option value="20">view 1-20</option>
              <option value="30">view 1-30</option>
            </select>
          </div>
          <span className="text-sm text-muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {paginated.length === 0 ? (
        <EmptyState title={emptyTitle ?? 'No records found'} message={emptyMessage ?? 'Try adjusting your search or filters.'} />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>S.No.</th>
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
                  <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }} data-label="S.No.">{i + 1 + page * pageSize}</td>
                  {columns.map(col => (
                    <td key={col.key} data-label={col.header || ''}>
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
