import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, CalendarRange, AlertTriangle } from 'lucide-react';
import useApi from '../../hooks/useApi';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/attendance/dashboard/faculty');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load faculty stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api, toast]);

  if (loading) return <SkeletonLoader count={1} height={400} />;
  
  const safeStats = stats || {
    name: 'Faculty',
    todayClasses: [],
    pendingLeaves: 0,
    pendingCorrections: 0,
    markedToday: []
  };

  const todayClassesColumns = [
    { header: 'Time', accessor: (row) => `${row.startTime} - ${row.endTime}` },
    { header: 'Subject', accessor: 'subjectName' },
    { header: 'Degree', accessor: (row) => `${row.degreeNameId?.name || 'N/A'}` },
    { header: 'Semester', accessor: (row) => `${row.semesterId?.name || 'N/A'}` },
    { 
      header: 'Status', 
      accessor: (row) => {
        // Find if attendance is already marked for this slot today
        const isMarked = safeStats.markedToday?.some(m => m.timetableSlotId === row._id);
        return isMarked ? <span className="badge badge-success">Marked</span> : <span className="badge badge-warning">Pending</span>;
      }
    }
  ];

  return (
    <div className="overview-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">FACULTY OVERVIEW</div>
        <h2 className="welcome-title">Welcome back, {safeStats.name}</h2>
        <p className="welcome-subtitle">Here is your schedule for today.</p>
      </div>

      <div className="grid-3 mb-lg">
        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon" style={{ background: '#3B82F620', color: '#3B82F6' }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.todayClasses?.length || 0}</h3>
            <p>Classes Today</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon" style={{ background: '#10B98120', color: '#10B981' }}>
            <CalendarRange size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.pendingLeaves || 0}</h3>
            <p>Pending Leaves</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-icon" style={{ background: '#EF444420', color: '#EF4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>{safeStats.pendingCorrections || 0}</h3>
            <p>Pending Corrections</p>
          </div>
        </motion.div>
      </div>

      <div className="glass-panel p-xl mb-lg">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Today's Schedule</h3>
        {safeStats.todayClasses?.length > 0 ? (
          <DataTable columns={todayClassesColumns} data={safeStats.todayClasses} />
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
            No classes scheduled for today.
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
