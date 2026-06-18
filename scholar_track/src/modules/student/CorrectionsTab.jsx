import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Send } from 'lucide-react';
import api from '../../hooks/useApi';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

const CorrectionsTab = () => {
  const toast = useToast();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/attendance/corrections/me');
        setCorrections(data ?? []);
      } catch (err) {
        console.error('Error fetching corrections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <SkeletonLoader type="table" count={4} />;

  return (
    <div>
      <div className="mb-lg">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Correction Requests</h2>
        <p className="text-sm text-muted">Track your attendance dispute submissions and their resolution status</p>
      </div>

      {corrections.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No corrections filed"
          message="You can raise corrections from your attendance log if you believe a record is incorrect."
        />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Requested Status</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Faculty Remarks</th>
                <th>HOD Remarks</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map((c, i) => (
                <motion.tr
                  key={c._id ?? i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td style={{ fontWeight: 600 }}>
                    {c.recordId?.date
                      ? new Date(c.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'
                    }
                  </td>
                  <td><StatusBadge status={c.requestedStatus} /></td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                    {c.reason ?? '—'}
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{c.facultyRemarks || '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{c.hodRemarks || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Trail */}
      {corrections.length > 0 && corrections[0]?.auditLog?.length > 0 && (
        <motion.div
          className="glass-panel p-xl mt-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Latest Dispute Trail</h3>
          <div className="audit-timeline">
            {corrections[0].auditLog.map((entry, i) => (
              <div key={i} className="audit-item">
                <div className="audit-actor">{entry.actorName ?? 'System'}</div>
                <div className="audit-action">{entry.action} — {entry.remarks}</div>
                <div className="audit-time">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CorrectionsTab;
