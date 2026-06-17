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
  ListOrdered
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();

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
    <div className="subpage-container">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      <Navbar />

      <div style={{ flex: 1, padding: '40px 8%', zIndex: 10 }}>
        {/* Welcome Banner */}
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(26, 90, 59, 0.08)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '12px' }}>
              <Sparkles size={12} /> HPU ScholarTrack Administrative Console
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, HOD {user.name}</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
              Department of {user.department || 'Computer Science'} | Role: Head of Department / Admin
            </p>
          </div>
          <button onClick={logout} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
            <LogOut size={16} /> Log Out
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '25px', marginBottom: '30px' }}>
          <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Department Cohort Size</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={32} /> 740 Students
            </div>
          </div>
          <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Defalcation Shortages</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#EF4444', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={32} /> {shortages.length} Flagged
            </div>
          </div>
          <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Biometric Swipes Today</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0284c7', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={32} /> 642 Logs
            </div>
          </div>
        </div>

        {/* Grid for Shortages and System Logs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
          
          {/* Defalcation warning list */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
              <AlertTriangle size={20} /> Attendance Shortage Warnings (Below 75%)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {shortages.map(student => (
                <div key={student.id} style={{ padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{student.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                      {student.program} | {student.rollNo}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#EF4444', display: 'block', marginTop: '8px' }}>
                      Current Rate: {student.rate}%
                    </span>
                  </div>
                  <div>
                    <button 
                      onClick={() => handleSendNotice(student.id, student.name, student.email)}
                      className="btn-primary"
                      disabled={student.notified}
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '0.82rem', 
                        background: student.notified ? '#9CA3AF' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        boxShadow: student.notified ? 'none' : '0 4px 15px rgba(239, 68, 68, 0.2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Send size={12} /> {student.notified ? 'Alert Dispatched' : 'Email Warning'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Log Stream */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListOrdered size={20} color="var(--color-primary)" /> Live Terminal Node Streams
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {systemLogs.map(log => (
                <div key={log.id} style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', borderLeft: '3px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{log.event}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{log.stamp}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    User: {log.user} | Terminal: {log.terminal}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
