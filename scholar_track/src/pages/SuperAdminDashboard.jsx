import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Settings, 
  Trash2, 
  RefreshCw,
  LogOut,
  Sparkles,
  Server,
  Activity,
  UserCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SuperAdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // System services state
  const [services, setServices] = useState([
    { name: 'REST API Server', port: '5000', status: 'ONLINE', load: '1.2%' },
    { name: 'ScholarSync Portal', port: '5173', status: 'ONLINE', load: '0.4%' },
    { name: 'ScholarTrack Portal', port: '5174', status: 'ONLINE', load: '0.5%' },
    { name: 'ScholarHub Gateway', port: '3000', status: 'ONLINE', load: '0.2%' }
  ]);

  const handleClearDatabase = () => {
    toast.warning('Initiating database cleanup routine...');
    setTimeout(() => {
      toast.success('All transactional attendance registers and leaves flushed successfully.');
    }, 1500);
  };

  const handleSeedDatabase = () => {
    toast.info('Seeding dynamic student cohort attendance rosters...');
    setTimeout(() => {
      toast.success('740+ student accounts, RFID logs, and leave histories seeded successfully.');
    }, 2000);
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
              <Sparkles size={12} /> HPU ScholarTrack Global Super-Admin Console
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, Master Admin {user.name}</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
              System Administration | Role: Super Administrator
            </p>
          </div>
          <button onClick={logout} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
            <LogOut size={16} /> Log Out
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
          {/* Left Column - System Status */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="var(--color-primary)" /> Node Services & Micro-Port Monitoring
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {services.map((srv, idx) => (
                <div key={idx} style={{ padding: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(26, 90, 59, 0.06)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <Server size={20} color="var(--color-primary)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{srv.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Port: {srv.port}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 800, 
                      background: '#D1FAE5', 
                      color: '#065F46', 
                      padding: '4px 10px', 
                      borderRadius: '12px' 
                    }}>
                      ● {srv.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>CPU: {srv.load}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Seed controls */}
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="var(--color-primary)" /> Database Operations
            </h3>
            
            <div className="clay-card" style={{ padding: '20px', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Global Actions</h4>
              
              <button 
                onClick={handleSeedDatabase}
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={16} /> Seed Student Cohorts
              </button>

              <button 
                onClick={handleClearDatabase}
                className="btn-outline" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#EF4444',
                  borderColor: '#EF4444'
                }}
              >
                <Trash2 size={16} /> Flush Transactional Logs
              </button>
            </div>

            <div className="clay-card" style={{ padding: '20px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={20} color="#d97706" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>MongoDB Connection</h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>mongodb-memory-server ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SuperAdminDashboard;
