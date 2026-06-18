import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import api from '../../hooks/useApi';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const AuditTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/attendance/audit-trail');
        setLogs(data ?? []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <SkeletonLoader type="table" count={8} />;

  return (
    <div>
      <div className="mb-lg">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Audit Trail</h2>
        <p className="text-sm text-muted">Chronological log of all attendance-related actions in your department</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={BookOpen} title="No audit logs" message="Audit entries will appear here as attendance actions are performed." />
      ) : (
        <motion.div
          className="glass-panel p-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="audit-timeline">
            {logs.map((entry, i) => (
              <motion.div
                key={entry._id ?? i}
                className="audit-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="audit-actor">{entry.actorName ?? entry.performedBy?.name ?? 'System'}</div>
                <div className="audit-action">
                  <span style={{ fontWeight: 600 }}>{entry.actionType ?? entry.action}</span>
                  {entry.details && <> — {typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)}</>}
                </div>
                <div className="audit-time">
                  {entry.timestamp ?? entry.createdAt
                    ? new Date(entry.timestamp ?? entry.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : ''
                  }
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AuditTab;
