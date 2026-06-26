import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Calendar, FileText, Clock, BookOpen, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const LeaveLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [subject, setSubject] = useState('');
  const [searched, setSearched] = useState(false);

  const api = useApi();
  const toast = useToast();

  // Set default date range to current month on mount
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchLogs = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both From Date and To Date.');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ fromDate, toDate });
      if (subject.trim()) params.append('subject', subject.trim());
      const res = await api.get(`/attendance/leave/logs?${params.toString()}`);
      setLogs(res.data);
      if (res.data.length === 0) {
        toast.info('No leave records found for the selected filters.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch leave logs.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleReset = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
    setSubject('');
    setLogs([]);
    setSearched(false);
  };

  const statusBadge = (status) => {
    const map = {
      PENDING_SUPERVISOR: { cls: 'badge-warning', label: 'Pending Faculty' },
      PENDING_HOD: { cls: 'badge-warning', label: 'Pending HOD' },
      APPROVED: { cls: 'badge-success', label: 'Approved' },
      REJECTED: { cls: 'badge-danger', label: 'Rejected' },
      WITHDRAWN: { cls: 'badge-neutral', label: 'Withdrawn' },
      DRAFT: { cls: 'badge-neutral', label: 'Draft' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const columns = [
    {
      header: 'Student',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
            {row.studentId?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {row.studentId?.username || ''} {row.studentId?.profile?.shNo ? `| SH: ${row.studentId.profile.shNo}` : ''}
          </div>
        </div>
      )
    },
    { header: 'Leave Type', accessor: (row) => <span style={{ fontSize: '0.85rem' }}>{row.leaveType || 'N/A'}</span> },
    {
      header: 'Duration',
      accessor: (row) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div>{new Date(row.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(row.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
            <Calendar size={10} style={{ display: 'inline', marginRight: 2 }} />
            {row.totalDays} day{row.totalDays > 1 ? 's' : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Subject',
      accessor: (row) => (
        <div style={{ fontSize: '0.78rem' }}>
          {row.subjects && row.subjects.length > 0
            ? row.subjects.map((s, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  background: 'var(--color-primary-light, #E8F5E9)',
                  color: 'var(--color-primary, #2E9E5B)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  marginRight: '4px',
                  marginBottom: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 500
                }}>
                  {s.subjectName}
                </span>
              ))
            : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
          }
        </div>
      )
    },
    {
      header: 'Document',
      accessor: (row) => row.documentUrl ? (
        <a
          href={`${API_BASE_URL}${row.documentUrl}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
        >
          <FileText size={12} /> View
        </a>
      ) : (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>No file</span>
      )
    },
    {
      header: 'Applied On',
      accessor: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          <Clock size={10} style={{ display: 'inline', marginRight: 2 }} />
          {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    { header: 'Status', accessor: (row) => statusBadge(row.status) },
  ];

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave Logs</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          View all leave records for your mapped students. Filter by date range and subject.
        </p>
      </div>

      {/* Filter Section */}
      <form onSubmit={handleSearch} style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-solid)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={16} style={{ color: 'var(--color-primary, #2E9E5B)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Filters</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* From Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '6px'
            }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              From Date <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-solid)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* To Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '6px'
            }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              To Date <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-solid)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Subject (optional) */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '6px'
            }}>
              <BookOpen size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Subject (optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Search by subject name or code..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-solid)',
                background: 'var(--color-bg)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            <Search size={14} /> Search
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results Section */}
      {!searched ? (
        <div className="glass-panel p-xl" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <Calendar size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Select a date range and click <strong>Search</strong> to view leave logs.
          </p>
        </div>
      ) : loading ? (
        <SkeletonLoader count={1} height={400} />
      ) : logs.length === 0 ? (
        <div className="glass-panel p-xl" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <BookOpen size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No leave records found for the selected filters.
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Showing <strong>{logs.length}</strong> record{logs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <DataTable columns={columns} data={logs} />
        </>
      )}
    </div>
  );
};

export default LeaveLogsTab;
