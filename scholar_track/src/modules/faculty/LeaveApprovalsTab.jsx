import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle, FileText, Calendar, Clock, Hash } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveApprovalsTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionRemarks, setActionRemarks] = useState({});
  const [processing, setProcessing] = useState({});

  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/attendance/leave/pending');
      // Faculty should only see PENDING_SUPERVISOR leaves
      const filtered = res.data.filter(l => l.status === 'PENDING_SUPERVISOR');
      setLeaves(filtered);
    } catch (err) {
      toast.error('Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = async (id, action) => {
    const remarks = actionRemarks[id] || '';
    if (!remarks || remarks.trim().length < 5) {
      return toast.error('Please provide remarks (at least 5 characters) before proceeding.');
    }
    setProcessing(prev => ({ ...prev, [id]: action }));
    try {
      const res = await api.put(`/attendance/leave/${id}/action`, { action, remarks: remarks.trim() });
      const actionLabel = action === 'RECOMMEND' ? 'Recommended to HOD' : action === 'APPROVE' ? 'Approved' : 'Rejected';
      toast.success(`Leave ${actionLabel} successfully`);
      setActionRemarks(prev => ({ ...prev, [id]: '' }));
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing leave');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: null }));
    }
  };

  const statusBadge = (status) => {
    const map = {
      PENDING_SUPERVISOR: { cls: 'badge-warning', label: 'Pending Review' },
      PENDING_HOD: { cls: 'badge-warning', label: 'Pending HOD' },
      APPROVED: { cls: 'badge-success', label: 'Approved' },
      REJECTED: { cls: 'badge-danger', label: 'Rejected' }
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
      header: 'Document',
      accessor: (row) => row.documentUrl ? (
        <a
          href={`${API_BASE_URL}${row.documentUrl}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
        >
          <FileText size={12} /> View File
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
    {
      header: 'Timeline',
      accessor: (row) => (
        <button 
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
          onClick={() => setSelectedLeaveDetails(row)}
        >
          View Timeline
        </button>
      )
    },
    {
      header: 'Remarks',
      accessor: (row) => (
        <input
          type="text"
          placeholder="Min 5 chars..."
          value={actionRemarks[row._id] || ''}
          onChange={e => setActionRemarks(prev => ({ ...prev, [row._id]: e.target.value }))}
          style={{
            width: '100%',
            minWidth: '120px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-solid)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.78rem',
            outline: 'none'
          }}
        />
      )
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const isProcessing = processing[row._id];
        if (row.status === 'PENDING_SUPERVISOR') {
          return (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#10B981', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleAction(row._id, 'RECOMMEND')}
                disabled={!!isProcessing}
              >
                <CheckCircle size={14} /> {isProcessing === 'RECOMMEND' ? '...' : 'Recommend'}
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleAction(row._id, 'REJECT')}
                disabled={!!isProcessing}
              >
                <XCircle size={14} /> {isProcessing === 'REJECT' ? '...' : 'Reject'}
              </button>
            </div>
          );
        }
        if (row.status === 'PENDING_HOD') {
          return (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#10B981', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleAction(row._id, 'APPROVE')}
                disabled={!!isProcessing}
              >
                <CheckCircle size={14} /> {isProcessing === 'APPROVE' ? '...' : 'Approve'}
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleAction(row._id, 'REJECT')}
                disabled={!!isProcessing}
              >
                <XCircle size={14} /> {isProcessing === 'REJECT' ? '...' : 'Reject'}
              </button>
            </div>
          );
        }
        return <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>—</span>;
      }
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave Approvals</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Review, recommend, or reject leave requests from your students. Add remarks and click an action.
        </p>
      </div>

      {leaves.length === 0 ? (
        <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <CheckCircle size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No pending leave requests assigned to you.
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={leaves} />
      )}

      {selectedLeaveDetails && createPortal(
        <AnimatePresence>
          <div className="modal-backdrop" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '24px'
          }} onClick={() => setSelectedLeaveDetails(null)}>
            <motion.div 
              style={{ 
                maxWidth: '560px', 
                width: '100%', 
                padding: '36px', 
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                position: 'relative'
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
                      Leave Request Timeline
                    </h3>
                  </div>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                  onClick={() => setSelectedLeaveDetails(null)}
                >
                  <XCircle size={22} style={{ color: '#94a3b8' }} />
                </button>
              </div>

              {/* General details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', fontSize: '0.9rem', color: '#334155', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div><strong>Student Name:</strong> {selectedLeaveDetails.studentId?.name} ({selectedLeaveDetails.studentId?.username})</div>
                <div><strong>Leave Type:</strong> {selectedLeaveDetails.leaveType}</div>
                <div><strong>Duration:</strong> {new Date(selectedLeaveDetails.startDate).toLocaleDateString()} to {new Date(selectedLeaveDetails.endDate).toLocaleDateString()} ({selectedLeaveDetails.totalDays} Days)</div>
                <div><strong>Reason:</strong> {selectedLeaveDetails.reason}</div>
              </div>

              {/* Timeline Stepper */}
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: '18px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Transition Stages & Remarks
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '32px', maxHeight: '350px', overflowY: 'auto' }}>
                <div style={{ position: 'absolute', left: '15px', top: '8px', bottom: '8px', width: '2px', background: '#e2e8f0' }}></div>
                
                {(selectedLeaveDetails.auditLog || []).map((log, index) => {
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
                    bubbleBorder = '#fde68a';
                    bubbleText = '#92400e';
                    labelColor = '#92400e';
                  } else if (log.action === 'SUBMITTED') {
                    nodeColor = 'var(--color-primary)';
                    bubbleBg = '#eff6ff';
                    bubbleBorder = '#bfdbfe';
                    bubbleText = '#1e40af';
                    labelColor = '#1e40af';
                  }

                  return (
                    <div key={log._id || index} style={{ position: 'relative' }}>
                      {/* Timeline Dot */}
                      <div style={{
                        position: 'absolute',
                        left: '-23px',
                        top: '4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: nodeColor,
                        border: '2px solid #ffffff',
                        zIndex: 2,
                        boxShadow: `0 0 0 3px ${nodeColor}33`
                      }}></div>
                      
                      <div style={{
                        background: bubbleBg,
                        border: `1px solid ${bubbleBorder}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '0.85rem',
                        color: bubbleText
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ color: labelColor }}>{log.action}</strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {new Date(log.date || log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                          By: <strong>{log.actorName}</strong>
                        </div>
                        {log.remarks && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(0,0,0,0.06)', fontStyle: 'italic', fontSize: '0.8rem', color: '#475569' }}>
                            Remarks: "{log.remarks}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default LeaveApprovalsTab;
