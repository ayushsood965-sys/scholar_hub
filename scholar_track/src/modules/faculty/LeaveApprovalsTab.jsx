import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ThumbsUp } from 'lucide-react';
import api from '../../hooks/useApi';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

const LeaveApprovalsTab = () => {
  const toast = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await api.get('/attendance/leave/pending');
      setLeaves(data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/attendance/leave/${id}/action`, { action, remarks: `${action} by faculty` });
      toast.success(`Leave ${action.toLowerCase()} successfully!`);
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Action failed.');
    }
  };

  if (loading) return <SkeletonLoader type="table" count={4} />;

  return (
    <div>
      <div className="mb-lg">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Pending Leave Requests</h2>
        <p className="text-sm text-muted">Recommend or reject leave applications from your scholars</p>
      </div>

      {leaves.length === 0 ? (
        <EmptyState icon={CheckCircle} title="All clear!" message="No pending leave requests to review." />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Scholar</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Actions</th></tr></thead>
            <tbody>
              {leaves.map((l, i) => (
                <motion.tr key={l._id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <td style={{ fontWeight: 600 }}>{l.studentId?.name ?? '—'}</td>
                  <td><span className="badge badge-primary">{l.leaveType}</span></td>
                  <td>{new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td>{new Date(l.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td>{l.totalDays}</td>
                  <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{l.reason}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm btn-success" onClick={() => handleAction(l._id, 'RECOMMEND')}>
                        <ThumbsUp size={14} /> Recommend
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleAction(l._id, 'REJECT')}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveApprovalsTab;
