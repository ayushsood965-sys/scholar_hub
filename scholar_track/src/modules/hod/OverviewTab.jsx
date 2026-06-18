import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../hooks/useApi';
import StatCard from '../../components/ui/StatCard';
import ProgressRing from '../../components/ui/ProgressRing';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const OverviewTab = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/attendance/dashboard/hod');
        setStats(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <><SkeletonLoader type="stats" count={4} /><div className="mt-lg"><SkeletonLoader type="ring" /></div></>;

  if (stats?.message) {
    return <div className="glass-panel p-xl text-center"><p className="text-muted">{stats.message}</p></div>;
  }

  return (
    <div>
      <motion.div className="welcome-banner glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="welcome-tag"><Sparkles size={12} /> HOD Dashboard</div>
        <h1 className="welcome-title">Department of {user?.department ?? 'N/A'}</h1>
        <p className="welcome-subtitle">Session: {stats?.sessionName ?? '—'} · {stats?.totalStudentsCount ?? 0} Active Scholars</p>
      </motion.div>

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard icon={Users} value={stats?.totalStudentsCount ?? 0} label="Total Scholars" delay={0} />
        <StatCard icon={BarChart3} value={`${stats?.averageDeptPercentage ?? 0}%`} label="Dept. Average" color={stats?.averageDeptPercentage >= 75 ? 'var(--status-present)' : 'var(--status-absent)'} delay={0.05} />
        <StatCard icon={AlertTriangle} value={stats?.defaulterCount ?? 0} label="Defaulters" color="var(--status-defaulter)" delay={0.1} />
        <StatCard icon={TrendingUp} value={stats?.warningCount ?? 0} label="Warning Zone" color="var(--status-warning)" delay={0.15} />
      </div>

      <div className="grid-2">
        {/* Dept Average Ring */}
        <motion.div className="glass-panel p-xl flex flex-col items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ProgressRing percentage={stats?.averageDeptPercentage ?? 0} size={160} strokeWidth={12} label="Dept Avg" />
          <p className="text-sm text-muted mt-md">Department-wide average attendance percentage</p>
        </motion.div>

        {/* Top Defaulters Quick View */}
        <motion.div className="glass-panel p-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--status-defaulter)' }} /> Defaulter List
          </h3>
          {(stats?.defaulters ?? []).length === 0 ? (
            <p className="text-sm text-muted">No defaulters in this session ✓</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.defaulters.slice(0, 6).map((d, i) => (
                <motion.div
                  key={d.studentId ?? i}
                  className="flex items-center justify-between"
                  style={{ padding: '10px 14px', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{d.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{d.enrollmentNumber}</div>
                  </div>
                  <span className="badge badge-defaulter">{d.percentage?.toFixed(1)}%</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OverviewTab;
