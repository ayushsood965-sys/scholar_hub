import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building,
  Users,
  CalendarRange,
  Shield,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import useApi from "../../hooks/useApi";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import { useToast } from "../../context/ToastContext";

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/attendance/dashboard/super");
        setStats(res.data);
        setSyncStats(res.data.syncStats);
      } catch (err) {
        toast.error("Failed to load system stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);



  if (loading) return <SkeletonLoader count={1} height={400} />;
  if (!stats) return null;

  return (
    <div className="overview-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">SYSTEM OVERVIEW</div>
        <h2 className="welcome-title">Unified SuperAdmin Dashboard</h2>
        <p className="welcome-subtitle">
          Centralized control for ScholarSync & ScholarTrack portals.
        </p>
      </div>



      {/* ScholarTrack Stats */}
      <div
        className="sidebar-section-label"
        style={{ padding: "0 0 8px 0", marginBottom: 8 }}
      >
        📋 SCHOLAR TRACK STATS
      </div>
      <div className="grid-4 mb-lg">
        <motion.div
          className="stat-card clay-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="stat-icon"
            style={{ background: "#3B82F620", color: "#3B82F6" }}
          >
            <Building size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.departmentsCount}</h3>
            <p>Departments</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card clay-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="stat-icon"
            style={{ background: "#10B98120", color: "#10B981" }}
          >
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalStudents}</h3>
            <p>Active Students</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card clay-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="stat-icon"
            style={{ background: "#F59E0B20", color: "#F59E0B" }}
          >
            <CalendarRange size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.activeSessionsCount}</h3>
            <p>Active Sessions</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card clay-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div
            className="stat-icon"
            style={{ background: "#8B5CF620", color: "#8B5CF6" }}
          >
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPolicies}</h3>
            <p>Attendance Policies</p>
          </div>
        </motion.div>
      </div>

      {/* ScholarSync Stats */}
      {syncStats && (
        <>
          <div
            className="sidebar-section-label"
            style={{ padding: "0 0 8px 0", marginBottom: 8 }}
          >
            🎓 SCHOLAR SYNC STATS
          </div>
          <div className="grid-4 mb-lg">
            <motion.div
              className="stat-card clay-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div
                className="stat-icon"
                style={{ background: "#A855F720", color: "#A855F7" }}
              >
                <UserCheck size={24} />
              </div>
              <div className="stat-content">
                <h3>{syncStats.faculty}</h3>
                <p>Faculty Supervisors</p>
              </div>
            </motion.div>

            <motion.div
              className="stat-card clay-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="stat-icon"
                style={{ background: "#F59E0B20", color: "#F59E0B" }}
              >
                <Shield size={24} />
              </div>
              <div className="stat-content">
                <h3>{syncStats.hods}</h3>
                <p>HOD Admins</p>
              </div>
            </motion.div>

            <motion.div
              className="stat-card clay-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div
                className="stat-icon"
                style={{ background: "#10B98120", color: "#10B981" }}
              >
                <GraduationCap size={24} />
              </div>
              <div className="stat-content">
                <h3>{syncStats.scholars}</h3>
                <p>Research Scholars</p>
              </div>
            </motion.div>

            <motion.div
              className="stat-card clay-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div
                className="stat-icon"
                style={{ background: "#3B82F620", color: "#3B82F6" }}
              >
                <Building size={24} />
              </div>
              <div className="stat-content">
                <h3>{stats.departmentsCount}</h3>
                <p>Departments</p>
              </div>
            </motion.div>
          </div>
        </>
      )}

      <div className="glass-panel p-xl mb-lg">
        <h3 style={{ marginBottom: "20px", color: "var(--text-primary)", fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="#3B82F6" /> Live System Telemetry
        </h3>
        <div className="grid-3 gap-md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'pulse 1.5s infinite' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>ScholarTrack Gateway</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Status: Active & Listening</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'pulse 1.5s infinite' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>ScholarSync Gateway</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Status: Active & Consolidated</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'pulse 1.5s infinite' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>HPU Shared Datastore</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Connection: ReplicaSet Secondary Online</div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OverviewTab;
