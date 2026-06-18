import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Building, Users, Calendar, Shield } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../hooks/useApi';
import StatCard from '../../components/ui/StatCard';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const OverviewTab = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/attendance/dashboard/super');
        setStats(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <SkeletonLoader type="stats" count={4} />;

  return (
    <div>
      <motion.div className="welcome-banner glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="welcome-tag"><Sparkles size={12} /> Super Admin</div>
        <h1 className="welcome-title">System Administration</h1>
        <p className="welcome-subtitle">Global attendance management control center · {user?.name}</p>
      </motion.div>

      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard icon={Building} value={stats?.totalDepartments ?? 0} label="Departments" delay={0} />
        <StatCard icon={Users} value={stats?.totalStudents ?? 0} label="Total Scholars" delay={0.05} />
        <StatCard icon={Calendar} value={stats?.totalSessions ?? 0} label="Active Sessions" delay={0.1} />
        <StatCard icon={Shield} value={stats?.totalPolicies ?? 0} label="Active Policies" delay={0.15} />
      </div>

      {/* Per-Department Summary */}
      {stats?.departments?.length > 0 && (
        <motion.div className="glass-panel p-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Department-wise Summary</h3>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Department</th><th>Scholars</th><th>Avg %</th><th>Defaulters</th><th>Active Session</th></tr></thead>
              <tbody>
                {stats.departments.map((d, i) => (
                  <motion.tr key={d.name ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.studentCount ?? 0}</td>
                    <td style={{ fontWeight: 700, color: (d.averagePercentage ?? 0) >= 75 ? 'var(--status-present)' : 'var(--status-absent)' }}>{d.averagePercentage?.toFixed(1) ?? '—'}%</td>
                    <td><span className={`badge ${d.defaulterCount > 0 ? 'badge-defaulter' : 'badge-present'}`}>{d.defaulterCount ?? 0}</span></td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{d.activeSession ?? '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OverviewTab;
