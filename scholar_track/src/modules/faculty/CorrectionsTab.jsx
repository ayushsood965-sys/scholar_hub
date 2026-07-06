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
  Clock,
  Upload
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
              position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
              zIndex: 200000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
              padding: '24px', overflowY: 'auto'
            }}
            onClick={() => setSelectedCorrection(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={e => e.stopPropagation()}
              style={{ 
                maxWidth: 600, 
                width: '100%', 
                margin: '40px auto',
                padding: '36px',
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                position: 'relative'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                      Correction Request Details
                    </h3>
                  </div>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} 
                  onClick={() => setSelectedCorrection(null)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <XCircle size={22} />
                </button>
              </div>

              {/* Student Info */}
              <div className="grid-2" style={{ marginBottom: 24, background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Student</label>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} style={{ color: '#64748b' }} />
                    {selectedCorrection.studentId?.name || 'N/A'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2, paddingLeft: '20px' }}>
                    {selectedCorrection.studentId?.username || ''} <br/> SH No: {selectedCorrection.studentId?.profile?.shNo || '—'}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Date of Absence</label>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarDays size={14} style={{ color: '#64748b' }} />
                    {selectedCorrection.recordId?.date
                      ? new Date(selectedCorrection.recordId.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric', weekday: 'short'
                      })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Correction Details */}
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                <label style={{ fontSize: '#0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, display: 'block', fontWeight: 700 }}>
                  <BookOpen size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--color-primary)' }} /> Correction Specification
                </label>
                <div className="grid-2" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '14px', marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Requested Status</p>
                    <span className="badge" style={{
                      background: selectedCorrection.correctionType === 'ON_LEAVE' ? '#fffbeb' : '#ecfdf5',
                      color: selectedCorrection.correctionType === 'ON_LEAVE' ? '#b45309' : '#047857',
                      border: `1px solid ${selectedCorrection.correctionType === 'ON_LEAVE' ? '#fde68a' : '#a7f3d0'}`,
                      fontSize: '0.8rem', marginTop: 6, display: 'inline-block', padding: '4px 10px', borderRadius: '6px'
                    }}>
                      {selectedCorrection.correctionType === 'ON_LEAVE'
                        ? `On Leave — ${selectedCorrection.leaveType || ''}`
                        : 'Present'}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Subjects & Attempt</p>
                    <span className="badge badge-neutral" style={{ fontSize: '0.8rem', marginTop: 6, display: 'inline-block', padding: '4px 10px', borderRadius: '6px' }}>
                      {selectedCorrection.timetableSlotIds?.length || 0} subject(s)
                      {selectedCorrection.correctionAttempt > 0 && ` | Attempt #${selectedCorrection.correctionAttempt}`}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Student Appeal Reason</p>
                  <p style={{ fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.5, marginTop: 6, background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                    "{selectedCorrection.reason}"
                  </p>
                </div>
                {selectedCorrection.documentUrl && (
                  <div style={{ marginTop: 16, paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                    <a
                      href={`${API_BASE_URL}${selectedCorrection.documentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} /> View Attached Document
                    </a>
                  </div>
                )}
              </div>

              {/* Audit Log */}
              {selectedCorrection.auditLog && selectedCorrection.auditLog.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'block', fontWeight: 700 }}>
                    <Clock size={14} style={{ display: 'inline', marginRight: 6 }} /> Activity Log
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCorrection.auditLog.map((log, idx) => {
                      let tagBg = '#eff6ff';
                      let tagColor = '#1e40af';
                      if (log.action === 'RECOMMENDED') { tagBg = '#fffbeb'; tagColor = '#92400e'; }
                      else if (log.action === 'APPROVED') { tagBg = '#ecfdf5'; tagColor = '#065f46'; }
                      else if (log.action === 'REJECTED') { tagBg = '#fef2f2'; tagColor = '#991b1b'; }

                      return (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '12px', background: '#f8fafc', borderRadius: '8px',
                          fontSize: '0.82rem', border: '1px solid #e2e8f0'
                        }}>
                          <span className="badge" style={{
                            fontSize: '0.65rem', flexShrink: 0,
                            background: tagBg, color: tagColor, padding: '3px 8px', borderRadius: '4px', fontWeight: 700
                          }}>
                            {log.action === 'RECOMMENDED' ? 'FORWARDED' : log.action}
                          </span>
                          <span style={{ color: '#334155', lineHeight: 1.4 }}>
                            <strong style={{ color: '#0f172a' }}>{log.actorName}</strong>: {log.remarks}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Remarks */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ color: '#374151', fontWeight: 600 }}>
                  <FileText size={14} /> Your Remarks <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                  rows={3}
                  placeholder="Provide detailed remarks for your decision (minimum 5 characters)..."
                  style={{ background: '#ffffff', color: '#111827', border: '1px solid #d1d5db' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#10B981', color: '#fff', border: 'none',
                    padding: '10px 20px', borderRadius: '8px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    opacity: processing ? 0.7 : 1, cursor: 'pointer'
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
                    padding: '10px 20px', borderRadius: '8px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    opacity: processing ? 0.7 : 1, cursor: 'pointer'
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
