import React, { useState, useMemo } from 'react';

export const useGridControl = (rawData = [], searchKeys = [], defaultPageSize = 10) => {
  const data = Array.isArray(rawData) ? rawData : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val) => {
    setPageSize(Number(val));
    setCurrentPage(1);
  };

  // Helper function to resolve nested keys like 'scholarId.name'
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();
    
    return data.filter(item => {
      return searchKeys.some(key => {
        const val = getNestedValue(item, key);
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchKeys]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const startIdx = (validCurrentPage - 1) * pageSize;
    return filteredData.slice(startIdx, startIdx + pageSize);
  }, [filteredData, validCurrentPage, pageSize]);

  const renderGridControls = () => {
    return (
      <div className="grid-controls-container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search..."
            className="form-input search-input"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ width: '100%', padding: '8px 12px' }}
          />
        </div>

        {/* Page Size Selector & Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #64748B)' }}>Show:</span>
            <select
              className="form-input page-size-select"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', cursor: 'pointer' }}
            >
              <option value="10">view 1-10</option>
              <option value="20">view 1-20</option>
              <option value="30">view 1-30</option>
            </select>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-buttons" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="btn-outline-small"
                style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: validCurrentPage === 1 ? 0.5 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                ◀
              </button>
              <span style={{ fontSize: '0.85rem', padding: '0 8px', fontWeight: 600, color: 'var(--color-text-primary, #1F2937)' }}>
                Page {validCurrentPage} of {totalPages}
              </span>
              <button
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="btn-outline-small"
                style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: validCurrentPage === totalPages ? 0.5 : 1, cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return {
    searchTerm,
    setSearchTerm: handleSearchChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    currentPage: validCurrentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    paginatedData,
    renderGridControls
  };
};
