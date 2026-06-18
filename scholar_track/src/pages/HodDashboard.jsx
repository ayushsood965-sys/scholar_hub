import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  LogOut, 
  Clock, 
  ShieldAlert, 
  Users, 
  Terminal,
  AlertCircle,
  Home,
  User,
  CalendarRange
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import AttendanceDashboard from '../modules/attendance/AttendanceDashboard';

const HodDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/hpu_logo.png" alt="HPU Logo" />
          <h2>ScholarTrack</h2>
        </div>

        <div className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Home className="nav-icon" /> Overview
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Clock className="nav-icon" /> Attendance Auditing
          </button>

          <button 
            className={`nav-item ${activeTab === 'leave' ? 'active' : ''}`}
            onClick={() => setActiveTab('leave')}
          >
            <CalendarRange className="nav-icon" /> Leave Approvals
          </button>
        </div>

        <div className="sidebar-bottom">
          <button 
            className="nav-item" 
            onClick={() => { logout(); navigate('/'); }}
            style={{ color: '#EF4444' }}
          >
            <LogOut className="nav-icon" style={{ color: '#EF4444' }} /> Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {activeTab === 'overview' ? 'HOD Overview' : 'Attendance Control Center'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ThemeToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user.name ? user.name[0].toUpperCase() : 'H'}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Scrollable Area */}
        <div className="dashboard-area" style={{ position: 'relative' }}>
          {/* Animated Blobs Backdrop */}
          <div className="liquid-bg-wrapper" style={{ zIndex: 1 }}>
            <div className="liquid-blob blob-1"></div>
            <div className="liquid-blob blob-2"></div>
            <div className="liquid-blob blob-3"></div>
          </div>

          <div style={{ position: 'relative', zIndex: 10 }}>
            {activeTab === 'overview' ? (
              <div>
                {/* Welcome Banner */}
                <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(2, 132, 199, 0.08)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.82rem', fontWeight: 600, color: '#0284c7', marginBottom: '12px' }}>
                    <Sparkles size={12} /> HPU ScholarTrack Head of Department Console
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, HOD {user.name}</h1>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
                    Department of {user.department || 'Computer Science'} | Role: Head of Department (HOD)
                  </p>
                </div>

                {/* Profile Grid details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
                  {/* Personal Details Card */}
                  <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0284c7' }}>
                      <User size={20} /> Administrator Profile
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Full Name</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{user.name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Email Address</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{user.email || user.username}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Designated Role</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>Head of Department (HOD)</div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Context Card */}
                  <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0284c7' }}>
                      <Sparkles size={20} /> Departmental Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Department</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{user.department || 'Computer Science'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Department Scholars</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>42 active PhD Scholars</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Academic Blocks</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>Science & Tech Block A, Room 101</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Attendance Quick Stats Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '25px', marginBottom: '30px' }}>
                  <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Department Cohort</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Users size={24} /> Monitored Active Roster
                    </div>
                  </div>
                  <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Defalcation Audits</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldAlert size={24} /> Flagged Shortages (75%)
                    </div>
                  </div>
                  <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Biometric Registry</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Terminal size={24} /> Department Node Logs
                    </div>
                  </div>
                </div>

                {/* Attendance Dashboard Module */}
                <AttendanceDashboard activeTab={activeTab} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HodDashboard;
