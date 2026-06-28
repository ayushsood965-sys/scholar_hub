import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, AlertTriangle, AlertCircle, Calendar, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

// Import Primitives
import TrendLineChart from '../../components/ui/TrendLineChart';
import HorizontalBarChart from '../../components/ui/HorizontalBarChart';
import DrillDownModal from './DrillDownModal';

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState(null); // { view: 'faculty' | 'course', id, name }
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonLoader count={1} height={120} />
        <div className="grid-4">
          <SkeletonLoader count={1} height={130} />
          <SkeletonLoader count={1} height={130} />
          <SkeletonLoader count={1} height={130} />
          <SkeletonLoader count={1} height={130} />
        </div>
        <SkeletonLoader count={1} height={240} />
        <div className="grid-2">
          <SkeletonLoader count={1} height={300} />
          <SkeletonLoader count={1} height={300} />
        </div>
      </div>
    );
  }

  const safeStats = stats || {
    sessionName: 'Not Set',
    totalStudentsCount: 0,
    averageDeptPercentage: 0,
    defaulterCount: 0,
    warningCount: 0,
    rosterStats: [],
    auditLogs: [],
    facultyStats: [],
    courseStats: [],
    weeklyTrend: [],
    pendingLeaveCount: 0,
    pendingCorrectionCount: 0
  };

  return (
    <div className="overview-tab" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-tag">DEPARTMENT OVERVIEW</div>
        <h2 className="welcome-title">HOD Dashboard</h2>
        <p className="welcome-subtitle">Current Session: {safeStats.sessionName || 'Not Set'}</p>
      </div>

      {/* Roster Aggregate Stats Cards */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.totalStudentsCount}</h3>
            <p>Total Scholars</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.averageDeptPercentage}%</h3>
            <p>Avg. Attendance</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.defaulterCount}</h3>
            <p>Defaulters (&lt;75%)</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.warningCount}</h3>
            <p>Warnings (75% - 80%)</p>
          </div>
        </motion.div>
      </div>

      {/* Attendance Trend Chart */}
      <motion.div 
        className="glass-panel" 
        style={{ padding: '24px' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.1rem' }}>
          Weekly Department Attendance Trend
        </h3>
        <TrendLineChart data={safeStats.weeklyTrend} height={200} color="var(--color-primary)" />
      </motion.div>

      {/* Comparisons Grids */}
      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Faculty-wise Breakdown */}
        <motion.div 
          className="glass-panel" 
          style={{ padding: '24px' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
            Faculty Performance Index
          </h3>
          <HorizontalBarChart 
            data={safeStats.facultyStats.map(f => ({ ...f, name: f.facultyName }))} 
            dataKey="avgPercentage"
            height={260}
          />
        </motion.div>

        {/* Course-wise Breakdown */}
        <motion.div 
          className="glass-panel" 
          style={{ padding: '24px' }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
            Course Attendance Distribution
          </h3>
          <HorizontalBarChart 
            data={safeStats.courseStats.map(c => ({ ...c, name: c.subjectName }))} 
            dataKey="avgPercentage"
            height={260}
          />
        </motion.div>
      </div>

      {/* Lower grid: Top Defaulters + Recent Activity */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        {/* Top Defaulters */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.1rem' }}>
            Defaulter Summary (Attendance &lt; 75%)
          </h3>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scholar Name</th>
                  <th>Enrollment No.</th>
                  <th>Attendance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {safeStats.defaulters?.slice(0, 10).map((scholar, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{scholar.name}</td>
                    <td>{scholar.enrollmentNumber}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--status-absent)' }}>{scholar.percentage}%</td>
                    <td>
                      <span className="badge badge-danger">Defaulter</span>
                    </td>
                  </tr>
                ))}
                {(!safeStats.defaulters || safeStats.defaulters.length === 0) && (
                  <tr><td colSpan="4" className="text-center" style={{ color: 'var(--text-secondary)' }}>No defaulter scholars in the department.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Tracker */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--color-primary)' }} />
            Attendance Audit Trail
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
            {safeStats.auditLogs?.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                No attendance logs found.
              </span>
            ) : (
              safeStats.auditLogs?.map((log, idx) => (
                <div key={idx} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.studentId?.name || 'Unknown student'}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <span>Marked by: {log.markedBy?.name || 'System'}</span>
                    <span style={{ color: log.status === 'PRESENT' ? 'var(--status-present)' : 'var(--status-absent)', fontWeight: 'bold' }}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {drillDown && (
          <DrillDownModal 
            view={drillDown.view}
            id={drillDown.id}
            name={drillDown.name}
            onClose={() => setDrillDown(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverviewTab;
