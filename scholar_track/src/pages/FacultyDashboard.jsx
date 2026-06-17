import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Check, 
  X as CloseIcon, 
  Clock, 
  Calendar, 
  LogOut,
  Sparkles,
  BarChart3,
  Search
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FacultyDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Leave requests state
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, studentName: 'Piyush Sharma', program: 'PhD Scholar', startDate: '2026-06-20', endDate: '2026-06-22', reason: 'Field research and survey collection outside Shimla', status: 'PENDING' },
    { id: 2, studentName: 'Sneha Patel', program: 'PhD Scholar', startDate: '2026-06-24', endDate: '2026-06-24', reason: 'Dental appointment and checkup', status: 'PENDING' },
    { id: 3, studentName: 'Aditya Verma', program: 'M.Tech PG', startDate: '2026-06-12', endDate: '2026-06-15', reason: 'Family medical emergency', status: 'APPROVED' }
  ]);

  // Student roster state
  const [roster, setRoster] = useState([
    { id: 1, name: 'Piyush Sharma', program: 'PhD (CSE)', attended: 98, total: 104, rate: 94.2 },
    { id: 2, name: 'Sneha Patel', program: 'PhD (Chem)', attended: 91, total: 104, rate: 87.5 },
    { id: 3, name: 'Aditya Verma', program: 'M.Tech (IT)', attended: 71, total: 104, rate: 68.2 },
    { id: 4, name: 'Rohan Das', program: 'PhD (Data Science)', attended: 101, total: 104, rate: 97.1 }
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const handleApprove = (id, studentName) => {
    setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'APPROVED' } : req));
    toast.success(`Leave request for ${studentName} approved!`);
  };

  const handleReject = (id, studentName) => {
    setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'REJECTED' } : req));
    toast.warning(`Leave request for ${studentName} rejected.`);
  };

  if (!user) return null;

  const filteredRoster = roster.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Sparkles size={12} /> HPU ScholarTrack Faculty Dashboard
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, {user.name}</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
              Department of {user.department || 'Computer Science'} | Role: Faculty Guide / Supervisor
            </p>
          </div>
          <button onClick={logout} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
            <LogOut size={16} /> Log Out
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '30px' }}>
          <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Supervised Scholars</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={32} /> 4 Scholars
            </div>
          </div>
          <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Average Cohort Attendance</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0284c7', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={32} /> 86.8%
            </div>
          </div>
          <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Pending Approvals</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={32} /> {leaveRequests.filter(r => r.status === 'PENDING').length} Requests
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Leave Requests list */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="var(--color-primary)" /> Scholar Leave Approvals
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {leaveRequests.length > 0 ? (
                leaveRequests.map(req => (
                  <div key={req.id} style={{ padding: '20px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{req.studentName}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{req.program}</span>
                      </div>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        background: req.status === 'APPROVED' ? '#D1FAE5' : req.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2', 
                        color: req.status === 'APPROVED' ? '#065F46' : req.status === 'PENDING' ? '#D97706' : '#991B1B', 
                        padding: '3px 8px', 
                        borderRadius: '10px' 
                      }}>{req.status}</span>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
                      <strong>Dates:</strong> {req.startDate} to {req.endDate}<br/>
                      <strong>Reason:</strong> {req.reason}
                    </p>

                    {req.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleApprove(req.id, req.studentName)} 
                          className="btn-primary" 
                          style={{ flex: 1, padding: '8px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Check size={14} /> Approve Leave
                        </button>
                        <button 
                          onClick={() => handleReject(req.id, req.studentName)} 
                          className="btn-outline" 
                          style={{ flex: 1, padding: '8px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#EF4444', borderColor: '#EF4444' }}
                        >
                          <CloseIcon size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No leave requests log logged.</div>
              )}
            </div>
          </div>

          {/* Student Roster status */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--color-primary)" /> Roster & Attendance Ratios
              </h3>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text"
                  placeholder="Search scholars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 30px',
                    borderRadius: '14px',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    fontSize: '0.82rem',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredRoster.map(s => (
                <div key={s.id} style={{ padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{s.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.program}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 800, 
                      color: s.rate < 75 ? '#EF4444' : 'var(--color-primary)' 
                    }}>
                      {s.rate}%
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {s.attended} / {s.total} lectures
                    </span>
                  </div>
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

export default FacultyDashboard;
