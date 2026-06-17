import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  FileText, 
  LogOut,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Attendance stats state
  const [attended, setAttended] = useState(92);
  const [total, setTotal] = useState(104);
  const rate = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;

  // Logs state
  const [logs, setLogs] = useState([
    { id: 1, date: '2026-06-17', time: '09:05 AM', type: 'IN', terminal: 'CS Dept Gate 1', status: 'ON TIME' },
    { id: 2, date: '2026-06-16', time: '09:12 AM', type: 'IN', terminal: 'CS Dept Gate 1', status: 'ON TIME' },
    { id: 3, date: '2026-06-15', time: '09:35 AM', type: 'IN', terminal: 'IT Terminal B', status: 'LATE' },
    { id: 4, date: '2026-06-12', time: '09:02 AM', type: 'IN', terminal: 'CS Dept Gate 1', status: 'ON TIME' }
  ]);

  // Leaves state
  const [leaves, setLeaves] = useState([
    { id: 1, startDate: '2026-06-02', endDate: '2026-06-04', reason: 'Medical Checkup', status: 'APPROVED', supervisor: 'Dr. Mahinder Singh' },
    { id: 2, startDate: '2026-05-18', endDate: '2026-05-18', reason: 'Conference Attendance', status: 'APPROVED', supervisor: 'Dr. Rajesh Kumar' }
  ]);

  // Leave Form state
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [supervisor, setSupervisor] = useState('Dr. Mahinder Singh');

  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill in all leave request fields');
      return;
    }

    const newLeave = {
      id: Date.now(),
      startDate,
      endDate,
      reason,
      status: 'PENDING',
      supervisor
    };

    setLeaves(prev => [newLeave, ...prev]);
    toast.success('Leave application submitted successfully for review!');
    setStartDate('');
    setEndDate('');
    setReason('');
    setShowForm(false);
  };

  // Clock-in Simulator
  const handleTerminalClockIn = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateNow = new Date().toISOString().split('T')[0];
    
    // Add checkin log
    const newLog = {
      id: Date.now(),
      date: dateNow,
      time: timeNow,
      type: 'IN',
      terminal: 'Biometric Terminal-4',
      status: 'ON TIME'
    };

    setLogs(prev => [newLog, ...prev]);
    setAttended(prev => prev + 1);
    setTotal(prev => prev + 1);
    
    toast.success(`Biometric swipe success! Checked in at ${timeNow}`);
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
              <Sparkles size={12} /> HPU ScholarTrack Student Dashboard
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome, {user.name}</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
              Department of {user.department || 'Computer Science'} | Role: Student / Scholar
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleTerminalClockIn} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} /> Biometric Swipe
            </button>
            <button onClick={logout} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>

        {/* Shortage Alert Banner */}
        {rate < 75 ? (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
            <AlertTriangle color="#EF4444" size={24} />
            <div>
              <strong style={{ color: '#EF4444' }}>Attendance Defalcation Alert!</strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Your current attendance rate is {rate}%, which is below the mandatory university threshold of 75%. Please submit leave documents.</p>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
            <CheckCircle color="#10B981" size={24} />
            <div>
              <strong style={{ color: '#10B981' }}>Attendance Ratios Compliant</strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Your current attendance rate is {rate}%. You satisfy the HPU 75% registration requirement.</p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          {/* Left Column - Stats and Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Statistics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Attendance Rate</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '10px' }}>{rate}%</div>
                <div style={{ height: '6px', width: '100%', background: 'var(--color-border)', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${rate}%`, background: 'var(--color-primary)', borderRadius: '3px' }}></div>
                </div>
              </div>

              <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Lectures Attended</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0284c7', marginTop: '10px' }}>{attended} / {total}</div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '12px' }}>Check-in success ratio</span>
              </div>
            </div>

            {/* Attendance Logs */}
            <div className="glass-panel" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--color-primary)" /> Recent Biometric Clocks
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '12px' }}>
                      <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Time</th>
                      <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Terminal Node</th>
                      <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '14px 12px', fontSize: '0.9rem', fontWeight: 600 }}>{log.date}</td>
                        <td style={{ padding: '14px 12px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{log.time}</td>
                        <td style={{ padding: '14px 12px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{log.terminal}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: 700, 
                            background: log.status === 'ON TIME' ? '#D1FAE5' : '#FEE2E2', 
                            color: log.status === 'ON TIME' ? '#065F46' : '#991B1B', 
                            padding: '3px 8px', 
                            borderRadius: '12px' 
                          }}>{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column - Leaves Management */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="var(--color-primary)" /> Academic Leaves
                </h3>
                <button 
                  onClick={() => setShowForm(!showForm)} 
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> Apply
                </button>
              </div>

              {/* Leave Application Form */}
              {showForm && (
                <form onSubmit={handleApplyLeave} className="clay-card" style={{ padding: '20px', background: 'var(--color-surface)', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '14px' }}>Submit Leave Request</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Start Date</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="form-input" 
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>End Date</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="form-input" 
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Faculty Guide / HOD Approval</label>
                      <select 
                        value={supervisor} 
                        onChange={(e) => setSupervisor(e.target.value)} 
                        className="form-input"
                        style={{ padding: '8px' }}
                      >
                        <option value="Dr. Mahinder Singh">Dr. Mahinder Singh (CS HOD)</option>
                        <option value="Dr. Rajesh Kumar">Dr. Rajesh Kumar (Faculty Guide)</option>
                        <option value="Dr. Anjali Mehta">Dr. Anjali Mehta (Faculty Guide)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Leave Description</label>
                      <textarea 
                        rows="2" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        placeholder="State reason e.g., Medical leave, Academic workshop..."
                        className="form-input"
                        style={{ padding: '8px', fontFamily: 'inherit', resize: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, padding: '8px' }}>Submit Request</button>
                      <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ flex: 1, padding: '8px' }}>Cancel</button>
                    </div>
                  </div>
                </form>
              )}

              {/* Leaves list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {leaves.map(leave => (
                  <div key={leave.id} style={{ padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                        {leave.startDate} to {leave.endDate}
                      </span>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        background: leave.status === 'APPROVED' ? '#D1FAE5' : leave.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2', 
                        color: leave.status === 'APPROVED' ? '#065F46' : leave.status === 'PENDING' ? '#D97706' : '#991B1B', 
                        padding: '3px 8px', 
                        borderRadius: '10px' 
                      }}>{leave.status}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{leave.reason}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid var(--color-border)', marginTop: '10px', paddingTop: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <FileText size={12} />
                      <span>Reviewer: <strong>{leave.supervisor}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
