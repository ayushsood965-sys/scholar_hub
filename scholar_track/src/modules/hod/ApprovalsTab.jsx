import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';
import useApi from '../../hooks/useApi';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { progressiveFetch } from '../../utils/progressiveFetch';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Calendar, 
  Clock,
  Layers,
  CalendarDays,
  Upload,
  User
} from 'lucide-react';

const ApprovalsTab = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [correctionHistory, setCorrectionHistory] = useState([]);

  const [selectedCorrectionForModal, setSelectedCorrectionForModal] = useState(null);
  const [selectedLeaveForModal, setSelectedLeaveForModal] = useState(null);
  const [correctionRemarksText, setCorrectionRemarksText] = useState('');
  const [leaveRemarksText, setLeaveRemarksText] = useState('');
  const [actionRemarks, setActionRemarks] = useState({}); // per-row remarks input
  const [processing, setProcessing] = useState({}); // per-row processing action
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('leaves'); // leaves | corrections
  
  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      


      // Fetch pending leaves progressively
      progressiveFetch(api, '/attendance/leave/pending', {}, (data, isBackground) => {
        if (!isBackground) {
          setLeaves(data);
          setLoading(false);
        } else {
          setLeaves(prev => {
            const existingIds = new Set(prev.map(l => l._id));
            const uniqueNew = data.filter(l => !existingIds.has(l._id));
            return [...prev, ...uniqueNew];
          });
        }
      });

      // Fetch pending corrections progressively
      progressiveFetch(api, '/attendance/corrections/pending', {}, (data, isBackground) => {
        if (!isBackground) {
          setCorrections(data);
        } else {
          setCorrections(prev => {
            const existingIds = new Set(prev.map(c => c._id));
            const uniqueNew = data.filter(c => !existingIds.has(c._id));
            return [...prev, ...uniqueNew];
          });
        }
      });

      // Fetch Leave history logs
      api.get('/attendance/leave/hod/history')
        .then(res => setLeaveHistory(res.data || []))
        .catch(err => console.error('Failed to load leave history', err));

      // Fetch Correction history logs
      api.get('/attendance/corrections/hod/history')
        .then(res => setCorrectionHistory(res.data || []))
        .catch(err => console.error('Failed to load correction history', err));

    } catch (err) {
      toast.error('Failed to load pending approvals');
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchApprovals(); 
  }, [user]);

  const handleLeaveAction = async (id, action) => {
    const remarks = selectedLeaveForModal ? leaveRemarksText : (actionRemarks[id] || '');
    if (!remarks || remarks.trim().length < 5) {
      return toast.error('Please provide remarks (at least 5 characters) before proceeding.');
    }
    setProcessing(prev => ({ ...prev, [id]: action }));
    try {
      const res = await api.put(`/attendance/leave/${id}/action`, { action, remarks: remarks.trim() });
      const actionLabel = action === 'APPROVE' ? 'Approved' : 'Rejected';
      toast.success(`Leave ${actionLabel} successfully`);
      setActionRemarks(prev => ({ ...prev, [id]: '' }));
      setSelectedLeaveForModal(null);
      setLeaveRemarksText('');
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing leave');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleCorrectionAction = async (id, action) => {
    if (!correctionRemarksText || correctionRemarksText.trim().length < 5) {
      return toast.error('Please provide remarks (at least 5 characters) before proceeding.');
    }
    setProcessing(prev => ({ ...prev, [id]: action }));
    try {
      await api.put(`/attendance/corrections/${id}/action`, { action, remarks: correctionRemarksText });
      const label = action === 'APPROVE' ? 'Approved' : 'Rejected';
      toast.success(`Correction ${label} successfully`);
      setSelectedCorrectionForModal(null);
      setCorrectionRemarksText('');
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing correction');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: null }));
    }
  };



  const leaveColumns = [
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
    {
      header: 'Status',
      accessor: (row) => {
        const map = {
          PENDING_SUPERVISOR: { cls: 'badge-warning', label: 'Pending Review' },
          PENDING_HOD: { cls: 'badge-warning', label: 'Pending HOD' },
          APPROVED: { cls: 'badge-success', label: 'Approved' },
          REJECTED: { cls: 'badge-danger', label: 'Rejected' }
        };
        const s = map[row.status] || { cls: 'badge-neutral', label: row.status };
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
      }
    },
    {
      header: 'Action',
      accessor: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => { setSelectedLeaveForModal(row); setLeaveRemarksText(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <FileText size={14} /> View
        </button>
      )
    }
  ];

  const correctionColumns = [
    {
      header: 'Student',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
            {row.studentId?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {row.studentId?.username || ''}
          </div>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          <Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />
          {row.recordId?.date
            ? new Date(row.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'N/A'}
        </span>
      )
    },
    {
      header: 'Requested',
      accessor: (row) => (
        <span className="badge" style={{
          background: row.correctionType === 'ON_LEAVE' ? '#FEF3C7' : '#D1FAE5',
          color: row.correctionType === 'ON_LEAVE' ? '#92400E' : '#065F46',
          fontSize: '0.72rem'
        }}>
          {row.correctionType === 'ON_LEAVE' ? `Leave (${row.leaveType || ''})` : 'Present'}
        </span>
      )
    },
    {
      header: 'Reason',
      accessor: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          {(row.reason || '').substring(0, 40)}{(row.reason || '').length > 40 ? '...' : ''}
        </span>
      )
    },
    {
      header: 'Faculty Remarks',
      accessor: (row) => (
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {row.facultyRemarks ? `"${row.facultyRemarks.substring(0, 50)}${row.facultyRemarks.length > 50 ? '...' : ''}"` : '\u2014'}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => { setSelectedCorrectionForModal(row); setCorrectionRemarksText(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <FileText size={14} /> View
        </button>
      )
    }
  ];

  const leaveHistoryColumns = [
    {
      header: 'Student',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
            {row.studentId?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {row.studentId?.username || ''}
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
      header: 'Status',
      accessor: (row) => {
        const map = {
          APPROVED: { cls: 'badge-success', label: 'Approved' },
          REJECTED: { cls: 'badge-danger', label: 'Rejected' }
        };
        const s = map[row.status] || { cls: 'badge-neutral', label: row.status };
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
      }
    },
    {
      header: 'Action',
      accessor: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => { setSelectedLeaveForModal(row); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <FileText size={14} /> View
        </button>
      )
    }
  ];

  const correctionHistoryColumns = [
    {
      header: 'Student',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
            {row.studentId?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {row.studentId?.username || ''}
          </div>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          <Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />
          {row.recordId?.date
            ? new Date(row.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'N/A'}
        </span>
      )
    },
    {
      header: 'Correction Type',
      accessor: (row) => (
        <span className="badge" style={{
          background: row.correctionType === 'ON_LEAVE' ? '#FEF3C7' : '#D1FAE5',
          color: row.correctionType === 'ON_LEAVE' ? '#92400E' : '#065F46',
          fontSize: '0.72rem'
        }}>
          {row.correctionType === 'ON_LEAVE' ? `Leave (${row.leaveType || ''})` : 'Present'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => {
        const map = {
          APPROVED: { cls: 'badge-success', label: 'Approved' },
          REJECTED: { cls: 'badge-danger', label: 'Rejected' }
        };
        const s = map[row.status] || { cls: 'badge-neutral', label: row.status };
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
      }
    },
    {
      header: 'Action',
      accessor: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => { setSelectedCorrectionForModal(row); setCorrectionRemarksText(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <FileText size={14} /> View
        </button>
      )
    }
  ];



  if (loading && !leaves.length && !corrections.length) {
    return <SkeletonLoader count={1} height={400} />;
  }

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave & Correction Queue</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review student leave and attendance correction requests.</p>
      </div>

      {/* Tab selection */}
      <div className="tab-header mb-lg" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '12px' }}>
        <button 
          className={`tab-btn ${activeSubTab === 'leaves' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'leaves' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'leaves' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem' }}
          onClick={() => setActiveSubTab('leaves')}
        >
          Leave Requests ({leaves.length})
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'corrections' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'corrections' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'corrections' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem' }}
          onClick={() => setActiveSubTab('corrections')}
        >
          Corrections ({corrections.length})
        </button>
      </div>

      {activeSubTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Pending Leave Requests
            </h3>
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
              <DataTable columns={leaveColumns} data={leaves} />
            )}
          </div>

          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Approved / Rejected Leaves Log
            </h3>
            {leaveHistory.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '24px', background: 'var(--color-surface-elevated)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                No processed leave requests found.
              </p>
            ) : (
              <DataTable columns={leaveHistoryColumns} data={leaveHistory} />
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'corrections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Pending Corrections Requests
            </h3>
            {corrections.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '24px', background: 'var(--color-surface-elevated)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                No pending correction requests found.
              </p>
            ) : (
              <DataTable columns={correctionColumns} data={corrections} />
            )}
          </div>

          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Approved / Rejected Corrections Log
            </h3>
            {correctionHistory.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '24px', background: 'var(--color-surface-elevated)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                No processed correction requests found.
              </p>
            ) : (
              <DataTable columns={correctionHistoryColumns} data={correctionHistory} />
            )}
          </div>
        </div>
      )}


      {/* ── HOD Correction Review Modal ── */}
      {createPortal(
        <AnimatePresence>
          {selectedCorrectionForModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
                zIndex: 200000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                padding: '24px', overflowY: 'auto'
              }}
              onClick={() => { setSelectedCorrectionForModal(null); setCorrectionRemarksText(''); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ type: 'spring', duration: 0.4 }}
                onClick={e => e.stopPropagation()}
                style={{
                  maxWidth: 640,
                  width: '100%',
                  margin: '40px auto',
                  padding: '36px',
                  background: 'var(--color-surface)',
                  borderRadius: '20px',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                        HOD Correction Review
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>Review and approve or reject this correction request</p>
                    </div>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    onClick={() => { setSelectedCorrectionForModal(null); setCorrectionRemarksText(''); }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <XCircle size={22} />
                  </button>
                </div>

                {/* Student Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 20, background: 'var(--color-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Student</label>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} style={{ color: '#64748b' }} />
                      {selectedCorrectionForModal.studentId?.name || 'N/A'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2, paddingLeft: '20px' }}>
                      {selectedCorrectionForModal.studentId?.username || ''}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Date of Absence</label>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={14} style={{ color: '#64748b' }} />
                      {selectedCorrectionForModal.recordId?.date
                        ? new Date(selectedCorrectionForModal.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Correction Details */}
                <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '20px', marginBottom: 20, border: '1px solid var(--color-border)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, display: 'block', fontWeight: 700 }}>
                    <Layers size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--color-primary)' }} /> Correction Specification
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '14px', marginBottom: '14px' }}>
                    <div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Requested Status</p>
                      <span className="badge" style={{
                        background: selectedCorrectionForModal.correctionType === 'ON_LEAVE' ? '#fffbeb' : '#ecfdf5',
                        color: selectedCorrectionForModal.correctionType === 'ON_LEAVE' ? '#b45309' : '#047857',
                        border: `1px solid ${selectedCorrectionForModal.correctionType === 'ON_LEAVE' ? '#fde68a' : '#a7f3d0'}`,
                        fontSize: '0.8rem', marginTop: 6, display: 'inline-block', padding: '4px 10px', borderRadius: '6px'
                      }}>
                        {selectedCorrectionForModal.correctionType === 'ON_LEAVE'
                          ? `On Leave — ${selectedCorrectionForModal.leaveType || ''}`
                          : 'Present'}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Subjects & Attempt</p>
                      <span className="badge badge-neutral" style={{ fontSize: '0.8rem', marginTop: 6, display: 'inline-block', padding: '4px 10px', borderRadius: '6px' }}>
                        {selectedCorrectionForModal.timetableSlotIds?.length || 0} subject(s)
                        {selectedCorrectionForModal.correctionAttempt > 0 && ` | Attempt #${selectedCorrectionForModal.correctionAttempt}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Student Appeal Reason</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.5, marginTop: 6, background: 'var(--color-bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontStyle: 'italic' }}>
                      "{selectedCorrectionForModal.reason}"
                    </p>
                  </div>
                  {selectedCorrectionForModal.documentUrl && (
                    <div style={{ marginTop: 16, paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                      <a
                        href={`${API_BASE_URL}${selectedCorrectionForModal.documentUrl}`}
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
                {selectedCorrectionForModal.auditLog && selectedCorrectionForModal.auditLog.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'block', fontWeight: 700 }}>
                      <Clock size={14} style={{ display: 'inline', marginRight: 6 }} /> Activity Log
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedCorrectionForModal.auditLog.map((log, idx) => {
                        let tagBg = '#eff6ff', tagColor = '#1e40af';
                        if (log.action === 'RECOMMENDED') { tagBg = '#fffbeb'; tagColor = '#92400e'; }
                        else if (log.action === 'APPROVED') { tagBg = '#ecfdf5'; tagColor = '#065f46'; }
                        else if (log.action === 'REJECTED') { tagBg = '#fef2f2'; tagColor = '#991b1b'; }
                                                const role = log.action === 'SUBMITTED' ? 'Student' : (log.action === 'RECOMMENDED' ? 'Faculty' : 'HOD');
                        const logTime = log.timestamp || log.date || log.createdAt;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid var(--color-border)' }}>
                            <span className="badge" style={{ fontSize: '0.65rem', flexShrink: 0, background: tagBg, color: tagColor, padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              {log.action === 'RECOMMENDED' ? 'FORWARDED' : log.action}
                            </span>
                            <span style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4, width: '100%' }}>
                              <strong style={{ color: 'var(--color-text-primary)' }}>{log.actorName}</strong> <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({role})</span>: {log.remarks}
                              {logTime && (
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                                  {new Date(logTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Faculty Remarks banner */}
                {selectedCorrectionForModal.facultyRemarks && (
                  <div style={{ marginBottom: 20, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px' }}>
                    <p style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Faculty Remarks</p>
                    <p style={{ fontSize: '0.88rem', color: '#78350f', fontStyle: 'italic', margin: 0 }}>"{selectedCorrectionForModal.facultyRemarks}"</p>
                  </div>
                )}

                {/* HOD Remarks Input */}
                {selectedCorrectionForModal.status === 'PENDING_HOD' && (
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ color: '#374151', fontWeight: 600 }}>
                      <FileText size={14} style={{ display: 'inline', marginRight: 4 }} /> HOD Remarks <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                      className="form-input"
                      value={correctionRemarksText}
                      onChange={e => setCorrectionRemarksText(e.target.value)}
                      rows={3}
                      placeholder="Provide remarks for your decision (minimum 5 characters)..."
                      style={{ background: 'var(--color-surface)', color: '#111827', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {selectedCorrectionForModal.status === 'PENDING_HOD' ? (
                    <>
                      <button
                        type="button"
                        style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => { setSelectedCorrectionForModal(null); setCorrectionRemarksText(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        style={{
                          background: '#EF4444', color: '#fff', border: 'none',
                          padding: '10px 20px', borderRadius: '8px', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                          opacity: processing[selectedCorrectionForModal._id] ? 0.7 : 1
                        }}
                        onClick={() => handleCorrectionAction(selectedCorrectionForModal._id, 'REJECT')}
                        disabled={!!processing[selectedCorrectionForModal._id]}
                      >
                        <XCircle size={16} /> {processing[selectedCorrectionForModal._id] === 'REJECT' ? 'Rejecting...' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        style={{
                          background: '#10B981', color: '#fff', border: 'none',
                          padding: '10px 20px', borderRadius: '8px', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                          opacity: processing[selectedCorrectionForModal._id] ? 0.7 : 1
                        }}
                        onClick={() => handleCorrectionAction(selectedCorrectionForModal._id, 'APPROVE')}
                        disabled={!!processing[selectedCorrectionForModal._id]}
                      >
                        <CheckCircle size={16} /> {processing[selectedCorrectionForModal._id] === 'APPROVE' ? 'Approving...' : 'Approve'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => { setSelectedCorrectionForModal(null); }}
                    >
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── HOD Leave Review Modal ── */}
      {createPortal(
        <AnimatePresence>
          {selectedLeaveForModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
                zIndex: 200000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                padding: '24px', overflowY: 'auto'
              }}
              onClick={() => { setSelectedLeaveForModal(null); setLeaveRemarksText(''); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ type: 'spring', duration: 0.4 }}
                onClick={e => e.stopPropagation()}
                style={{
                  maxWidth: 640,
                  width: '100%',
                  margin: '40px auto',
                  padding: '36px',
                  background: 'var(--color-surface)',
                  borderRadius: '20px',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarDays size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                        HOD Leave Review
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>Review and approve or reject this leave request</p>
                    </div>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    onClick={() => { setSelectedLeaveForModal(null); setLeaveRemarksText(''); }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <XCircle size={22} />
                  </button>
                </div>

                {/* Student Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 20, background: 'var(--color-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Student</label>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} style={{ color: '#64748b' }} />
                      {selectedLeaveForModal.studentId?.name || 'N/A'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2, paddingLeft: '20px' }}>
                      {selectedLeaveForModal.studentId?.username || ''}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Leave Period</label>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={14} style={{ color: '#64748b' }} />
                      {new Date(selectedLeaveForModal.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(selectedLeaveForModal.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 2, paddingLeft: '20px' }}>
                      {selectedLeaveForModal.totalDays} day(s) {selectedLeaveForModal.isHalfDay && '(Half Day)'}
                    </p>
                  </div>
                </div>

                {/* Leave Details */}
                <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '20px', marginBottom: 20, border: '1px solid var(--color-border)', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, display: 'block', fontWeight: 700 }}>
                    <Layers size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--color-primary)' }} /> Leave Specification
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '14px', marginBottom: '14px' }}>
                    <div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Leave Category</p>
                      <span className="badge badge-pending" style={{ fontSize: '0.8rem', marginTop: 6, display: 'inline-block', padding: '4px 10px', borderRadius: '6px' }}>
                        {selectedLeaveForModal.leaveType || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Status</p>
                      <span className={`badge ${
                        selectedLeaveForModal.status === 'APPROVED' ? 'badge-success' :
                        selectedLeaveForModal.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                      }`} style={{ fontSize: '0.8rem', marginTop: 6, display: 'inline-block', padding: '4px 10px', borderRadius: '6px' }}>
                        {selectedLeaveForModal.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Student Leave Reason</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.5, marginTop: 6, background: 'var(--color-bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontStyle: 'italic' }}>
                      "{selectedLeaveForModal.reason || 'No reason provided'}"
                    </p>
                  </div>
                  {selectedLeaveForModal.documentUrl && (
                    <div style={{ marginTop: 16, paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                      <a
                        href={`${API_BASE_URL}${selectedLeaveForModal.documentUrl}`}
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
                {selectedLeaveForModal.auditLog && selectedLeaveForModal.auditLog.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'block', fontWeight: 700 }}>
                      <Clock size={14} style={{ display: 'inline', marginRight: 6 }} /> Activity Log
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedLeaveForModal.auditLog.map((log, idx) => {
                        let tagBg = '#eff6ff', tagColor = '#1e40af';
                        if (log.action === 'RECOMMENDED') { tagBg = '#fffbeb'; tagColor = '#92400e'; }
                        else if (log.action === 'APPROVED') { tagBg = '#ecfdf5'; tagColor = '#065f46'; }
                        else if (log.action === 'REJECTED') { tagBg = '#fef2f2'; tagColor = '#991b1b'; }
                        const role = log.action === 'SUBMITTED' ? 'Student' : (log.action === 'RECOMMENDED' ? 'Faculty' : 'HOD');
                        const logTime = log.timestamp || log.date || log.createdAt;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px', background: 'var(--color-bg)', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid var(--color-border)' }}>
                            <span className="badge" style={{ fontSize: '0.65rem', flexShrink: 0, background: tagBg, color: tagColor, padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              {log.action === 'RECOMMENDED' ? 'FORWARDED' : log.action}
                            </span>
                            <span style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4, width: '100%' }}>
                              <strong style={{ color: 'var(--color-text-primary)' }}>{log.actorName}</strong> <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({role})</span>: {log.remarks}
                              {logTime && (
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                                  {new Date(logTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* HOD Remarks Input */}
                {selectedLeaveForModal.status === 'PENDING_HOD' && (
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ color: '#374151', fontWeight: 600 }}>
                      <FileText size={14} style={{ display: 'inline', marginRight: 4 }} /> HOD Remarks <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                      className="form-input"
                      value={leaveRemarksText}
                      onChange={e => setLeaveRemarksText(e.target.value)}
                      rows={3}
                      placeholder="Provide remarks for your decision (minimum 5 characters)..."
                      style={{ background: 'var(--color-surface)', color: '#111827', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {selectedLeaveForModal.status === 'PENDING_HOD' ? (
                    <>
                      <button
                        type="button"
                        style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => { setSelectedLeaveForModal(null); setLeaveRemarksText(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        style={{
                          background: '#EF4444', color: '#fff', border: 'none',
                          padding: '10px 20px', borderRadius: '8px', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                          opacity: processing[selectedLeaveForModal._id] ? 0.7 : 1
                        }}
                        onClick={() => handleLeaveAction(selectedLeaveForModal._id, 'REJECT')}
                        disabled={!!processing[selectedLeaveForModal._id]}
                      >
                        <XCircle size={16} /> {processing[selectedLeaveForModal._id] === 'REJECT' ? 'Rejecting...' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        style={{
                          background: '#10B981', color: '#fff', border: 'none',
                          padding: '10px 20px', borderRadius: '8px', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                          opacity: processing[selectedLeaveForModal._id] ? 0.7 : 1
                        }}
                        onClick={() => handleLeaveAction(selectedLeaveForModal._id, 'APPROVE')}
                        disabled={!!processing[selectedLeaveForModal._id]}
                      >
                        <CheckCircle size={16} /> {processing[selectedLeaveForModal._id] === 'APPROVE' ? 'Approving...' : 'Approve'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => { setSelectedLeaveForModal(null); }}
                    >
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ApprovalsTab;
