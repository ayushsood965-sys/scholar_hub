import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { API_BASE_URL } from '../../config';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import {
  Eye,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  User,
  CalendarDays,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  History,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CorrectionsTab = () => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorrection, setSelectedCorrection] = useState(null); // for modal
  const [actionRemarks, setActionRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/attendance/corrections/pending');
      setCorrections(res.data);
    } catch (err) {
      toast.error('Failed to load pending corrections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, [api]);

  const handleAction = async (id, action) => {
    if (!actionRemarks || actionRemarks.trim().length < 5) {
      return toast.error('Please provide remarks (at least 5 characters) before proceeding.');
    }
    setProcessing(true);
    try {
      const res = await api.put(`/attendance/corrections/${id}/action`, { action, remarks: actionRemarks });
      const actionLabel = action === 'RECOMMEND' ? 'Recommended to HOD' : 'Rejected';
      toast.success(`Correction ${actionLabel} successfully`);
      setSelectedCorrection(null);
      setActionRemarks('');
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing correction');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (correction) => {
    setSelectedCorrection(correction);
    setActionRemarks('');
  };

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <div className="flex items-center gap-sm mb-xs">
          <History size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Corrections Queue</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Review student attendance correction requests. Approve and forward to HOD, or Reject with remarks.
        </p>
      </div>

      {corrections.length === 0 ? (
        <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <CheckCircle size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No pending correction requests. All requests have been processed.
          </p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Student</th>
                <th>Date</th>
                <th>Subjects</th>
                <th>Requested</th>
                <th>Reason</th>
                <th>Attempt</th>
                <th style={{ width: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map((c, idx) => (
                <motion.tr
                  key={c._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                >
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                      {c.studentId?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {c.studentId?.username || ''}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {c.recordId?.date
                      ? new Date(c.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {c.timetableSlotIds?.length || 0} subject(s)
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: c.correctionType === 'ON_LEAVE' ? '#FEF3C7' : '#D1FAE5',
                      color: c.correctionType === 'ON_LEAVE' ? '#92400E' : '#065F46',
                      fontSize: '0.7rem'
                    }}>
                      {c.correctionType === 'ON_LEAVE' ? `On Leave (${c.leaveType || ''})` : 'Present'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.reason?.substring(0, 40)}{c.reason?.length > 40 ? '...' : ''}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>#{c.correctionAttempt || 1}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => openModal(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── View/ Action Modal ── */}
      <AnimatePresence>
        {selectedCorrection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              zIndex: 200000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
            onClick={() => setSelectedCorrection(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="glass-card"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 28 }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    Correction Request Details
                  </h3>
                  <p className="text-sm text-muted" style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                    Review the details below and take appropriate action
                  </p>
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => setSelectedCorrection(null)} style={{ border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                  <XCircle size={20} />
                </button>
              </div>

              {/* Student Info */}
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student</label>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginTop: 4 }}>
                    <User size={14} style={{ display: 'inline', marginRight: 6, opacity: 0.6 }} />
                    {selectedCorrection.studentId?.name || 'N/A'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {selectedCorrection.studentId?.username || ''} | {selectedCorrection.studentId?.profile?.shNo || ''}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</label>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginTop: 4 }}>
                    <CalendarDays size={14} style={{ display: 'inline', marginRight: 6, opacity: 0.6 }} />
                    {selectedCorrection.recordId?.date
                      ? new Date(selectedCorrection.recordId.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
                      })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Correction Details */}
              <div style={{ background: 'rgba(99, 102, 241, 0.03)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, display: 'block' }}>
                  <BookOpen size={14} style={{ display: 'inline', marginRight: 6 }} /> Correction Details
                </label>
                <div className="grid-2">
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Requested Status</p>
                    <span className="badge" style={{
                      background: selectedCorrection.correctionType === 'ON_LEAVE' ? '#FEF3C7' : '#D1FAE5',
                      color: selectedCorrection.correctionType === 'ON_LEAVE' ? '#92400E' : '#065F46',
                      fontSize: '0.8rem', marginTop: 4
                    }}>
                      {selectedCorrection.correctionType === 'ON_LEAVE'
                        ? `On Leave — ${selectedCorrection.leaveType || ''}`
                        : 'Present'}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Subjects</p>
                    <span className="badge badge-neutral" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                      {selectedCorrection.timetableSlotIds?.length || 0} subject(s)
                      {selectedCorrection.correctionAttempt > 0 && ` | Attempt #${selectedCorrection.correctionAttempt}`}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Reason</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.5, marginTop: 4, background: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                    {selectedCorrection.reason}
                  </p>
                </div>
                {selectedCorrection.documentUrl && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      <FileText size={12} style={{ display: 'inline', marginRight: 4 }} /> Document
                    </p>
                    <a
                      href={`${API_BASE_URL}${selectedCorrection.documentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}
                    >
                      View Attached Document
                    </a>
                  </div>
                )}
              </div>

              {/* Audit Log */}
              {selectedCorrection.auditLog && selectedCorrection.auditLog.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'block' }}>
                    <Clock size={14} style={{ display: 'inline', marginRight: 6 }} /> Activity Log
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedCorrection.auditLog.map((log, idx) => (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem'
                      }}>
                        <span className="badge" style={{
                          fontSize: '0.6rem', flexShrink: 0,
                          background: log.action === 'SUBMITTED' ? '#DBEAFE' : log.action === 'RECOMMENDED' ? '#FEF3C7' : log.action === 'APPROVED' ? '#D1FAE5' : '#FEE2E2',
                          color: log.action === 'SUBMITTED' ? '#1E40AF' : log.action === 'RECOMMENDED' ? '#92400E' : log.action === 'APPROVED' ? '#065F46' : '#991B1B'
                        }}>
                          {log.action}
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {log.actorName}: {log.remarks}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Remarks */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">
                  <FileText size={14} /> Your Remarks <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                  rows={3}
                  placeholder="Provide detailed remarks for your decision (minimum 5 characters)..."
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#10B981', color: '#fff', border: 'none',
                    padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    opacity: processing ? 0.7 : 1
                  }}
                  onClick={() => handleAction(selectedCorrection._id, 'RECOMMEND')}
                  disabled={processing}
                >
                  <ThumbsUp size={16} /> {processing ? 'Processing...' : 'Approve & Send to HOD'}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#EF4444', color: '#fff', border: 'none',
                    padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    opacity: processing ? 0.7 : 1
                  }}
                  onClick={() => handleAction(selectedCorrection._id, 'REJECT')}
                  disabled={processing}
                >
                  <ThumbsDown size={16} /> {processing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CorrectionsTab;
