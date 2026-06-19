import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, AlertTriangle, Search } from 'lucide-react';
import useApi from '../../hooks/useApi';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/attendance/dashboard/hod');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load department stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api, toast]);

  if (loading) return <SkeletonLoader count={1} height={400} />;
  
  const safeStats = stats || {
    sessionName: 'Not Set',
    totalStudentsCount: 0,
    averageDeptPercentage: 0,
    defaulterCount: 0,
    rosterStats: []
  };

  return (
    <div className="overview-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">DEPARTMENT OVERVIEW</div>
        <h2 className="welcome-title">HOD Dashboard</h2>
        <p className="welcome-subtitle">Current Session: {safeStats.sessionName || 'Not Set'}</p>
      </div>

      <div className="grid-3 mb-lg">
        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon" style={{ background: '#3B82F620', color: '#3B82F6' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.totalStudentsCount}</h3>
            <p>Total Scholars</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon" style={{ background: '#10B98120', color: '#10B981' }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.averageDeptPercentage}%</h3>
            <p>Avg. Attendance</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-icon" style={{ background: '#EF444420', color: '#EF4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.defaulterCount}</h3>
            <p>Defaulters</p>
          </div>
        </motion.div>
      </div>

      <div className="glass-panel p-xl">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Roster Highlights</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scholar Name</th>
                <th>Enrollment No.</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {safeStats.rosterStats?.slice(0, 10).map((scholar, idx) => (
                <tr key={idx}>
                  <td>{scholar.name}</td>
                  <td>{scholar.enrollmentNumber}</td>
                  <td>{scholar.percentage}%</td>
                  <td>
                    {scholar.isDefaulter ? (
                      <span className="badge badge-danger">Defaulter</span>
                    ) : scholar.isWarning ? (
                      <span className="badge badge-warning">Warning</span>
                    ) : (
                      <span className="badge badge-success">Good</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!safeStats.rosterStats || safeStats.rosterStats.length === 0) && (
                <tr><td colSpan="4" className="text-center">No scholars found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
