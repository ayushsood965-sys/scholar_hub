import React, { useState, useEffect, useContext } from 'react';
import { 
  CalendarDays, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  History,
  Activity,
  Plus
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import axios from 'axios';

const StudentAttendanceView = ({ activeTab = 'attendance' }) => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [stats, setStats] = useState({
    percentage: 0,
    totalWorkingDays: 0,
    presentDays: 0,
    leaveDays: 0,
    absentDays: 0,
    recentLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchLeaves();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/attendance/student/me');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/api/attendance/leave/me');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return 'var(--color-success)';
    if (percentage >= 65) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      leaveType: formData.get('leaveType'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      totalDays: formData.get('totalDays'),
      reason: formData.get('reason')
    };

    try {
      await axios.post('/api/attendance/leave/apply', data);
      toast.success('Leave application submitted successfully!');
      setShowLeaveModal(false);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to submit leave application.');
    }
  };

  if (loading) return <div style={{ padding: '20px', color: 'var(--color-text)' }}>Loading attendance telemetry...</div>;

  const safeStats = stats || {};
  const pctColor = getStatusColor(safeStats.percentage || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {activeTab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          
          {/* Main Gauge Card */}
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Overall Attendance</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: pctColor }}>
                {safeStats.percentage || 0}%
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Minimum requirement: 75%
              </p>
            </div>
            <Activity size={48} color={pctColor} opacity={0.3} />
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CheckCircle2 color="var(--color-success)" />
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Present Days</span>
              <span style={{ marginLeft: 'auto', fontSize: '1.2rem', fontWeight: 700 }}>{safeStats.presentDays || 0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertTriangle color="var(--color-danger)" />
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Absent Days</span>
              <span style={{ marginLeft: 'auto', fontSize: '1.2rem', fontWeight: 700 }}>{safeStats.absentDays || 0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText color="var(--color-primary)" />
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Approved Leaves</span>
              <span style={{ marginLeft: 'auto', fontSize: '1.2rem', fontWeight: 700 }}>{safeStats.leaveDays || 0}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
             <CalendarDays size={32} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
             <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Leave Management</h3>
             <button 
               onClick={() => setShowLeaveModal(true)}
               style={{
                 background: 'var(--color-primary)',
                 color: '#fff',
                 border: 'none',
                 padding: '10px 20px',
                 borderRadius: '8px',
                 fontWeight: 600,
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px',
                 cursor: 'pointer'
               }}
             >
               <Plus size={16} /> Apply for Leave
             </button>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (safeStats.percentage || 0) < 75 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '16px',
          borderRadius: '12px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          color: '#fca5a5'
        }}>
          <AlertTriangle size={24} />
          <div>
            <strong>Attendance Shortage Warning!</strong>
            <p style={{ fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              Your attendance is below the 75% threshold. If you have valid medical or co-curricular (NCC/NSS) grounds, you may be eligible for condonation up to 65% or 50% respectively. Please contact your HOD.
            </p>
          </div>
        </div>
      )}

      {/* Tables Row */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <History color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Attendance Logs</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Date</th>
                  <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Type</th>
                  <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {!safeStats.recentLogs || safeStats.recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent logs found.</td>
                  </tr>
                ) : (
                  safeStats.recentLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 0' }}>{new Date(log.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 0' }}>{log.type}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: log.status === 'PRESENT' ? 'rgba(16, 185, 129, 0.1)' : log.status === 'ABSENT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: log.status === 'PRESENT' ? '#34d399' : log.status === 'ABSENT' ? '#f87171' : '#60a5fa'
                        }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <FileText color="var(--color-primary)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Leave Applications</h3>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Leave Type</th>
                    <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Duration</th>
                    <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!leaves || leaves.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>No leave applications.</td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 0', fontWeight: 600 }}>{leave.leaveType}</td>
                        <td style={{ padding: '12px 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          <br/>({leave.totalDays} days)
                        </td>
                        <td style={{ padding: '12px 0' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: leave.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : leave.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: leave.status === 'APPROVED' ? '#34d399' : leave.status === 'REJECTED' ? '#f87171' : '#fbbf24'
                          }}>
                            {leave.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Apply for Leave</h2>
            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Leave Type</label>
                <select name="leaveType" required style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)' }}>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="MEDICAL">Medical Leave (Condonation Eligible)</option>
                  <option value="CO_CURRICULAR">Co-Curricular / NCC / NSS (Condonation Eligible)</option>
                  <option value="DUTY">Duty / Conference Leave</option>
                  <option value="MATERNITY">Maternity Leave (Max 240 days)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Start Date</label>
                  <input type="date" name="startDate" required style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>End Date</label>
                  <input type="date" name="endDate" required style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Total Days</label>
                <input type="number" name="totalDays" min="1" max="240" required style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Reason / Remarks</label>
                <textarea name="reason" rows="3" required style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)', resize: 'none' }}></textarea>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Submit Application</button>
                <button type="button" onClick={() => setShowLeaveModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentAttendanceView;
