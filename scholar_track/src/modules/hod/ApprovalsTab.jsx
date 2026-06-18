import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, CalendarRange, FileCheck } from 'lucide-react';
import api from '../../hooks/useApi';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

const ApprovalsTab = () => {
  const toast = useToast();
  const [section, setSection] = useState('leaves');
  const [leaves, setLeaves] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [lRes, cRes] = await Promise.all([
        api.get('/attendance/leave/pending-hod'),
        api.get('/attendance/corrections/pending-hod'),
      ]);
      setLeaves(lRes.data ?? []);
      setCorrections(cRes.data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLeaveAction = async (id, action) => {
    try {
      await api.put(`/attendance/leave/${id}/hod-action`, { action, remarks: `${action} by HOD` });
      toast.success(`Leave ${action.toLowerCase()}!`);
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed.'); }
  };

  const handleCorrectionAction = async (id, action) => {
    try {
      await api.put(`/attendance/corrections/${id}/hod-action`, { action, remarks: `${action} by HOD` });
      toast.success(`Correction ${action.toLowerCase()}!`);
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed.'); }
  };

  if (loading) return <SkeletonLoader type="table" count={5} />;

  return (
    <div>
      <div className="tab-header">
        <button className={`tab-btn ${section === 'leaves' ? 'active' : ''}`} onClick={() => setSection('leaves')}>
          <CalendarRange size={16} /> Leave Requests ({leaves.length})
        </button>
        <button className={`tab-btn ${section === 'corrections' ? 'active' : ''}`} onClick={() => setSection('corrections')}>
          <FileCheck size={16} /> Corrections ({corrections.length})
        </button>
      </div>

      {section === 'leaves' && (
        leaves.length === 0 ? (
          <EmptyState icon={CalendarRange} title="No pending leaves" message="All leave requests have been processed." />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Scholar</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Faculty</th><th>Actions</th></tr></thead>
              <tbody>
                {leaves.map((l, i) => (
                  <motion.tr key={l._id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td style={{ fontWeight: 600 }}>{l.studentId?.name ?? '—'}</td>
                    <td><span className="badge badge-primary">{l.leaveType}</span></td>
                    <td>{new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>{new Date(l.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>{l.totalDays}</td>
                    <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{l.reason}</td>
                    <td><StatusBadge status={l.facultyStatus ?? l.supervisorStatus} /></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-sm btn-success" onClick={() => handleLeaveAction(l._id, 'APPROVE')}><CheckCircle size={14} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleLeaveAction(l._id, 'REJECT')}><XCircle size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {section === 'corrections' && (
        corrections.length === 0 ? (
          <EmptyState icon={FileCheck} title="No pending corrections" message="All corrections have been processed." />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Scholar</th><th>Date</th><th>Requested Status</th><th>Reason</th><th>Faculty</th><th>Actions</th></tr></thead>
              <tbody>
                {corrections.map((c, i) => (
                  <motion.tr key={c._id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td style={{ fontWeight: 600 }}>{c.studentId?.name ?? '—'}</td>
                    <td>{c.recordId?.date ? new Date(c.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td><StatusBadge status={c.requestedStatus} /></td>
                    <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{c.reason}</td>
                    <td><StatusBadge status={c.facultyAction} /></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-sm btn-success" onClick={() => handleCorrectionAction(c._id, 'APPROVE')}><CheckCircle size={14} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleCorrectionAction(c._id, 'REJECT')}><XCircle size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default ApprovalsTab;
