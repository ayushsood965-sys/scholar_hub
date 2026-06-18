import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  Database, 
  Send,
  LogOut,
  Sparkles,
  ShieldAlert,
  ListOrdered,
  Home,
  User,
  Clock,
  CalendarRange
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import AttendanceDashboard from '../modules/attendance/AttendanceDashboard';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Defalcation shortages list (below 75%)
  const [shortages, setShortages] = useState([
    { id: 1, name: 'Aditya Verma', rollNo: 'HPU-2023-CS08', program: 'M.Tech', rate: 68.2, email: 'aditya.verma@hpu.edu', notified: false },
    { id: 2, name: 'Mehak Sharma', rollNo: 'HPU-2024-IT12', program: 'MCA', rate: 71.4, email: 'mehak.sharma@hpu.edu', notified: false },
    { id: 3, name: 'Vikram Singh', rollNo: 'HPU-2023-CS45', program: 'B.Tech', rate: 61.5, email: 'vikram.singh@hpu.edu', notified: false }
  ]);

  // General log stream
  const [systemLogs, setSystemLogs] = useState([
    { id: 1, event: 'Face ID Swiped Success', user: 'Piyush Sharma', terminal: 'CS Gateway 1', stamp: '10:42:15 AM' },
    { id: 2, event: 'RFID Tag Authenticated', user: 'Sneha Patel', terminal: 'Chem Lab Entry', stamp: '10:38:02 AM' },
    { id: 3, event: 'Leave Document Uploaded', user: 'Rohan Das', terminal: 'Student Web portal', stamp: '10:15:30 AM' },
    { id: 4, event: 'Manual Log Approved', user: 'Guide Dr. Rajesh Kumar', terminal: 'HOD Console', stamp: '09:55:00 AM' }
  ]);

  const handleSendNotice = (id, name, email) => {
    setShortages(prev => prev.map(s => s.id === id ? { ...s, notified: true } : s));
    toast.success(`Defalcation notice email successfully dispatched to ${name} (${email})`);
  };

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
            <Clock className="nav-icon" /> Attendance Policies
          </button>

          <button 
            className={`nav-item ${activeTab === 'leave' ? 'active' : ''}`}
            onClick={() => setActiveTab('leave')}
          >
            <CalendarRange className="nav-icon" /> Holiday Calendar
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
            {activeTab === 'overview' ? 'Administration Overview' : 'Attendance Control Center'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ThemeToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user.name ? user.name[0].toUpperCase() : 'A'}
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
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(26, 90, 59, 0.08)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '12px' }}>
                    <Sparkles size={12} /> HPU ScholarTrack Administrative Console
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, Admin {user.name}</h1>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
                    Department of {user.department || 'Computer Science'} | Role: Head of Department / Admin
                  </p>
                </div>

                {/* Profile Grid details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
                  {/* Personal Details Card */}
                  <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
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
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>Head of Department / Administrative Officer</div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Context Card */}
                  <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
                      <Sparkles size={20} /> System Settings
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Department Scope</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{user.department || 'Computer Science'}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Audit Configuration</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>75% Minimum Biometric Threshold</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Gateways Online</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>3 Biometric Terminal Terminals</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <AttendanceDashboard activeTab={activeTab} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
