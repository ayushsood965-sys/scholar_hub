import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, XCircle, FileCheck } from 'lucide-react';
import api from '../../hooks/useApi';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

const CorrectionsTab = () => {
  const toast = useToast();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await api.get('/attendance/corrections/pending');
      setCorrections(data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/attendance/corrections/${id}/action`, { action, remarks: `${action} by faculty` });
      toast.success(`Correction ${action.toLowerCase()} successfully!`);
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Action failed.');
    }
  };

  if (loading) return <SkeletonLoader type="table" count={4} />;

  return (
    <div>
      <div className="mb-lg">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Pending Corrections</h2>
        <p className="text-sm text-muted">Review and recommend/reject attendance dispute requests</p>
      </div>

      {corrections.length === 0 ? (
        <EmptyState icon={FileCheck} title="No pending corrections" message="There are no correction requests awaiting your review." />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Scholar</th><th>Date</th><th>Requested Status</th><th>Reason</th><th>Actions</th></tr></thead>
            <tbody>
              {corrections.map((c, i) => (
                <motion.tr key={c._id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <td style={{ fontWeight: 600 }}>{c.studentId?.name ?? '—'}</td>
                  <td>{c.recordId?.date ? new Date(c.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                  <td><StatusBadge status={c.requestedStatus} /></td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{c.reason ?? '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm btn-success" onClick={() => handleAction(c._id, 'RECOMMEND')}>
                        <ThumbsUp size={14} /> Recommend
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleAction(c._id, 'REJECT')}>
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

export default CorrectionsTab;
