import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, AlertCircle } from 'lucide-react';
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
        const res = await api.get('/attendance/dashboard/student');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load student stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api, toast]);

  if (loading) return <SkeletonLoader count={1} height={400} />;
  
  const safeStats = stats || {
    name: 'Student',
    semesterName: 'N/A',
    degreeName: 'N/A',
    overallPercentage: 0,
    classesAttended: 0,
    totalClasses: 0,
    policyWarning: false,
    minRequiredPercentage: 75,
    consecutiveClassesToAttend: 0
  };

  return (
    <div className="overview-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">STUDENT OVERVIEW</div>
        <h2 className="welcome-title">Welcome back, {safeStats.name}</h2>
        <p className="welcome-subtitle">Semester: {safeStats.semesterName || 'N/A'} | {safeStats.degreeName || 'N/A'}</p>
      </div>

      <div className="grid-3 mb-lg">
        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon" style={{ background: '#3B82F620', color: '#3B82F6' }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.overallPercentage}%</h3>
            <p>Overall Attendance</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon" style={{ background: '#10B98120', color: '#10B981' }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.classesAttended} / {safeStats.totalClasses}</h3>
            <p>Classes Attended</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-icon" style={{ background: '#EF444420', color: '#EF4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.policyWarning ? 'WARNING' : 'GOOD'}</h3>
            <p>Status</p>
          </div>
        </motion.div>
      </div>

      {safeStats.policyWarning && (
        <div className="glass-panel p-xl" style={{ borderLeft: '4px solid #EF4444', marginBottom: '24px' }}>
          <h3 style={{ color: '#EF4444', marginBottom: '8px' }}>Attendance Warning</h3>
          <p style={{ color: 'var(--text-primary)' }}>Your attendance is below the required threshold of {safeStats.minRequiredPercentage}%. You need to attend the next <strong>{safeStats.consecutiveClassesToAttend}</strong> classes to recover.</p>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
