import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Calendar, FileText, Clock, BookOpen, Search, Filter, XCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';

const CorrectionLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [selectedCorrectionDetails, setSelectedCorrectionDetails] = useState(null);
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
      const res = await api.get(`/attendance/corrections/logs?${params.toString()}`);
      setLogs(res.data || []);
      if (res.data.length === 0) {
        toast.info('No correction records found for the selected filters.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch correction logs.');
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
      PENDING_FACULTY: { cls: 'badge-warning', label: 'Pending Faculty' },
      PENDING_HOD: { cls: 'badge-warning', label: 'Pending HOD' },
      APPROVED: { cls: 'badge-success', label: 'Approved' },
      REJECTED: { cls: 'badge-danger', label: 'Rejected' },
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
    {
      header: 'Date of Absent Record',
      accessor: (row) => row.recordId?.date ? new Date(row.recordId.date).toLocaleDateString('en-IN') : '',
      render: (row) => row.recordId?.date
        ? new Date(row.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/A'
    },
    {
      header: 'Correction Type',
      accessor: (row) => row.correctionType === 'ON_LEAVE' ? `On Leave (${row.leaveType || ''})` : 'Present',
      render: (row) => (
        <span className="badge" style={{
          background: row.correctionType === 'ON_LEAVE' ? '#FEF3C7' : '#D1FAE5',
          color: row.correctionType === 'ON_LEAVE' ? '#92400E' : '#065F46',
          fontSize: '0.72rem',
          fontWeight: 600
        }}>
          {row.correctionType === 'ON_LEAVE' ? `On Leave (${row.leaveType || ''})` : 'Present'}
        </span>
      )
    },
    {
      header: 'Attempt',
      accessor: (row) => `#${row.correctionAttempt || 1}`,
      render: (row) => (
        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>#{row.correctionAttempt || 1}</span>
      )
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row) => (
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.reason}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => statusBadge(row.status)
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
      header: 'Action',
      sortable: false,
      render: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => setSelectedCorrectionDetails(row)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          View Details
        </button>
      )
    }
  ];

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Correction Logs</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Audit historical attendance correction requests and transition timelines.
        </p>
      </div>

      {/* Date Search Filter Form */}
      <form onSubmit={handleSearch} style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-solid)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>Logs Date Filters</span>
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
            Select a date range and click <strong>Search</strong> to view correction logs.
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
            No correction records found for the selected filters.
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

      {/* Stepper Timeline Details Modal */}
      {selectedCorrectionDetails && createPortal(
        <AnimatePresence>
          <div className="modal-backdrop" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999999, padding: '24px'
          }} onClick={() => setSelectedCorrectionDetails(null)}>
            <motion.div 
              style={{ 
                maxWidth: '560px', width: '100%', padding: '36px', 
                background: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-lg pb-xs" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>
                      Correction Timeline
                    </h3>
                  </div>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                  onClick={() => setSelectedCorrectionDetails(null)}
                >
                  <XCircle size={22} style={{ color: '#94a3b8' }} />
                </button>
              </div>

              {/* General details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', fontSize: '0.9rem', color: '#334155', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div><strong>Student Name:</strong> {selectedCorrectionDetails.studentId?.name} ({selectedCorrectionDetails.studentId?.username})</div>
                <div><strong>Correction Date:</strong> {selectedCorrectionDetails.recordId?.date ? new Date(selectedCorrectionDetails.recordId.date).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Type Requested:</strong> {selectedCorrectionDetails.correctionType === 'ON_LEAVE' ? `On Leave (${selectedCorrectionDetails.leaveType || ''})` : 'Present'}</div>
                <div><strong>Reason:</strong> {selectedCorrectionDetails.reason}</div>
                {selectedCorrectionDetails.documentUrl && (
                  <div>
                    <strong>Supporting Document:</strong>{' '}
                    <a href={`${API_BASE_URL}${selectedCorrectionDetails.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 600 }}>
                      View Attachment
                    </a>
                  </div>
                )}
              </div>

              {/* Timeline Stepper */}
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '18px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Transition Stages & Remarks
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '32px', maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ position: 'absolute', left: '15px', top: '8px', bottom: '8px', width: '2px', background: '#e2e8f0' }}></div>
                
                {(selectedCorrectionDetails.auditLog || []).map((log, index) => {
                  let nodeColor = '#94a3b8';
                  let bubbleBg = '#f8fafc';
                  let bubbleBorder = '#e2e8f0';
                  let bubbleText = '#334155';
                  let labelColor = '#0f172a';

                  if (log.action === 'APPROVED') {
                    nodeColor = '#10b981';
                    bubbleBg = '#ecfdf5';
                    bubbleBorder = '#a7f3d0';
                    bubbleText = '#065f46';
                    labelColor = '#065f46';
                  } else if (log.action === 'REJECTED') {
                    nodeColor = '#ef4444';
                    bubbleBg = '#fef2f2';
                    bubbleBorder = '#fecaca';
                    bubbleText = '#991b1b';
                    labelColor = '#991b1b';
                  } else if (log.action === 'RECOMMENDED') {
                    nodeColor = '#f59e0b';
                    bubbleBg = '#fffbeb';
                    bubbleBorder = '#fef3c7';
                    bubbleText = '#92400E';
                    labelColor = '#92400E';
                  } else if (log.action === 'SUBMITTED' || log.action === 'APPLIED') {
                    nodeColor = '#6366f1';
                    bubbleBg = '#e0e7ff';
                    bubbleBorder = '#c7d2fe';
                    bubbleText = '#3730a3';
                    labelColor = '#3730a3';
                  }

                  return (
                    <div key={index} style={{ position: 'relative' }}>
                      {/* Circle node on line */}
                      <div style={{
                        position: 'absolute', left: '-23px', top: '4px', width: '10px', height: '10px',
                        borderRadius: '50%', background: nodeColor, border: '2px solid #ffffff', zIndex: 1,
                        boxShadow: '0 0 0 3px rgba(226, 232, 240, 0.8)'
                      }}></div>
                      
                      {/* Content block */}
                      <div style={{
                        padding: '16px', background: bubbleBg, border: `1px solid ${bubbleBorder}`,
                        borderRadius: '12px', color: bubbleText
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: labelColor }}>
                            {log.action}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} />
                            {new Date(log.timestamp).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                          By: {log.actorName || 'Student'}
                        </div>
                        {log.remarks && (
                          <div style={{ fontSize: '0.82rem', fontStyle: 'italic', marginTop: '6px', color: 'var(--color-text-secondary)', borderLeft: `2px solid ${nodeColor}`, paddingLeft: '8px' }}>
                            "{log.remarks}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Close Button footer */}
              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setSelectedCorrectionDetails(null)} style={{ padding: '10px 24px', fontSize: '0.88rem', fontWeight: 600 }}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CorrectionLogsTab;
