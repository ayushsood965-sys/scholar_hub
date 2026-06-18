import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Users, Clock } from 'lucide-react';
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
        const { data } = await api.get('/attendance/dashboard/faculty');
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
        <div className="welcome-tag"><Sparkles size={12} /> Faculty Dashboard</div>
        <h1 className="welcome-title">Welcome, {user?.name ?? 'Faculty'}</h1>
        <p className="welcome-subtitle">Department of {user?.department ?? 'N/A'} · Active Session: {stats?.sessionName ?? 'No Active Session'}</p>
      </motion.div>

      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <StatCard icon={BookOpen} value={stats?.coursesScheduled ?? 0} label="Courses Scheduled" delay={0.05} />
        <StatCard icon={Users} value={stats?.managedScholars ?? 0} label="Scholars Managed" delay={0.1} />
        <StatCard icon={Clock} value={stats?.recentLogs?.length ?? 0} label="Recent Logs" delay={0.15} />
      </div>

      {/* Timetable Slots */}
      {stats?.courses?.length > 0 && (
        <motion.div className="glass-panel p-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>My Course Schedule</h3>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Course</th><th>Day</th><th>Time</th></tr></thead>
              <tbody>
                {stats.courses.map((c, i) => (
                  <motion.tr key={c._id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}>
                    <td style={{ fontWeight: 600 }}>{c.courseName ?? c.courseCode ?? '—'}</td>
                    <td>{c.dayOfWeek}</td>
                    <td>{c.startTime} — {c.endTime}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      {stats?.recentLogs?.length > 0 && (
        <motion.div className="glass-panel p-xl mt-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Recent Marking Activity</h3>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Date</th><th>Status</th><th>Course</th></tr></thead>
              <tbody>
                {stats.recentLogs.slice(0, 10).map((log, i) => (
                  <tr key={log._id ?? i}>
                    <td style={{ fontWeight: 600 }}>{log.studentId?.name ?? '—'}</td>
                    <td>{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td><span className={`badge ${log.status === 'PRESENT' ? 'badge-present' : log.status === 'ABSENT' ? 'badge-absent' : 'badge-late'}`}>{log.status}</span></td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{log.courseName ?? 'Daily'}</td>
                  </tr>
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
