import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserX, Clock, CalendarRange, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../hooks/useApi';
import StatCard from '../../components/ui/StatCard';
import ProgressRing from '../../components/ui/ProgressRing';
import AttendanceHeatmap from '../../components/ui/AttendanceHeatmap';
import StatusBadge from '../../components/ui/StatusBadge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const AttendanceTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/attendance/dashboard/student');
        setStats(data);
      } catch (err) {
        console.error('Error fetching student stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div>
        <SkeletonLoader type="stats" count={4} />
        <div className="mt-lg"><SkeletonLoader type="ring" /></div>
        <div className="mt-lg"><SkeletonLoader type="table" count={5} /></div>
      </div>
    );
  }

  if (stats?.error) {
    return (
      <div className="glass-panel p-xl text-center">
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>{stats.error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard icon={UserCheck} value={`${stats?.percentage?.toFixed(1) ?? 0}%`} label="Attendance Rate" color={stats?.percentage >= 75 ? 'var(--status-present)' : 'var(--status-absent)'} delay={0} />
        <StatCard icon={UserCheck} value={stats?.presentDays ?? 0} label="Present Days" color="var(--status-present)" delay={0.05} />
        <StatCard icon={UserX} value={stats?.absentDays ?? 0} label="Absent Days" color="var(--status-absent)" delay={0.1} />
        <StatCard icon={CalendarRange} value={(stats?.creditedLeaveDays ?? 0) + (stats?.excusedLeaveDays ?? 0)} label="Leave Days" color="var(--status-leave)" delay={0.15} />
      </div>

      <div className="grid-2">
        {/* Progress Ring */}
        <motion.div
          className="glass-panel p-xl flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ProgressRing percentage={stats?.percentage ?? 0} size={160} strokeWidth={12} />
          <div className="mt-lg" style={{ textAlign: 'center' }}>
            <div className="text-sm text-muted" style={{ marginBottom: '8px' }}>
              Min Required: {stats?.minRequiredPercentage ?? 75}% · Warning: {stats?.warningThreshold ?? 80}%
            </div>
            {stats?.isDefaulter && (
              <div className="badge badge-defaulter">⚠ Defaulter Status</div>
            )}
            {stats?.isWarning && !stats?.isDefaulter && (
              <div className="badge badge-warning">⚠ Warning Zone</div>
            )}
            {!stats?.isDefaulter && !stats?.isWarning && (
              <div className="badge badge-present">✓ Compliant</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                {stats?.percentage >= (stats?.minRequiredPercentage ?? 75) ? 'Safe Absences Left' : 'Classes to Attend'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stats?.percentage >= (stats?.minRequiredPercentage ?? 75) ? 'var(--status-present)' : 'var(--status-absent)', marginTop: '4px' }}>
                {stats?.percentage >= (stats?.minRequiredPercentage ?? 75) ? stats?.safeAbsencesRemaining ?? 0 : stats?.consecutiveClassesToAttend ?? 0}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Working Days</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>{stats?.effectiveWorkingDays ?? 0}</div>
            </div>
          </div>
        </motion.div>

        {/* Heatmap */}
        <motion.div
          className="glass-panel p-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Attendance Heatmap</h3>
          <AttendanceHeatmap logs={stats?.logs ?? []} />
        </motion.div>
      </div>

      {/* Recent Records */}
      <motion.div
        className="glass-panel p-xl mt-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Recent Attendance Log</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Locked</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.logs ?? []).slice(0, 15).map((log, i) => (
                <motion.tr
                  key={log.date ?? i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <td style={{ fontWeight: 600 }}>
                    {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td><StatusBadge status={log.status} /></td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{log.remarks || '—'}</td>
                  <td>{log.isLocked ? <span className="badge badge-neutral">🔒 Locked</span> : <span className="text-xs text-muted">Open</span>}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceTab;
