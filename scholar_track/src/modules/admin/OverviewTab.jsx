import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Users, CalendarRange, Shield } from 'lucide-react';
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
        const res = await api.get('/attendance/dashboard/super');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load system stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSeed = async (type) => {
    const pwd = window.prompt(`Enter Security Password to seed ${type}:`);
    if (!pwd) return;

    try {
      setLoading(true);
      const endpoint = type === 'masters' ? '/seed/masters' : '/seed/students';
      const res = await api.post(endpoint, { password: pwd });
      toast.success(res.data.message || `Successfully seeded ${type}`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Error seeding ${type}`);
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  if (loading) return <SkeletonLoader count={1} height={400} />;
  if (!stats) return null;

  return (
    <div className="overview-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">SYSTEM OVERVIEW</div>
        <h2 className="welcome-title">SuperAdmin Dashboard</h2>
        <p className="welcome-subtitle">Manage university-wide attendance configurations.</p>
      </div>

      <div className="glass-panel p-xl mb-lg" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={20} /> System Database Seeding
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
          Use these utilities to quickly bootstrap the ScholarTrack Attendance database with HPU-specific configurations and dummy candidates. This requires a security password.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-primary" onClick={() => handleSeed('masters')}>
            <Building size={18} /> Seed Sessions and Degrees
          </button>
          <button className="btn btn-secondary" onClick={() => handleSeed('students')}>
            <Users size={18} /> Seed Students
          </button>
        </div>
      </div>

      <div className="grid-4 mb-lg">
        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon" style={{ background: '#3B82F620', color: '#3B82F6' }}>
            <Building size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.departmentsCount}</h3>
            <p>Departments</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon" style={{ background: '#10B98120', color: '#10B981' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalStudents}</h3>
            <p>Active Students</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-icon" style={{ background: '#F59E0B20', color: '#F59E0B' }}>
            <CalendarRange size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.activeSessionsCount}</h3>
            <p>Active Sessions</p>
          </div>
        </motion.div>

        <motion.div className="stat-card clay-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="stat-icon" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPolicies}</h3>
            <p>Attendance Policies</p>
          </div>
        </motion.div>
      </div>

      <div className="glass-panel p-xl">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Department Summary</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Enrolled Students</th>
                <th>Avg. Attendance</th>
                <th>Defaulters</th>
              </tr>
            </thead>
            <tbody>
              {stats.departments?.map((dept, idx) => (
                <tr key={idx}>
                  <td>{dept.name}</td>
                  <td>{dept.studentCount}</td>
                  <td>{dept.averagePercentage}%</td>
                  <td>
                    {dept.defaulterCount > 0 ? (
                      <span className="badge badge-danger">{dept.defaulterCount}</span>
                    ) : (
                      <span className="badge badge-success">0</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!stats.departments || stats.departments.length === 0) && (
                <tr><td colSpan="4" className="text-center">No department data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
