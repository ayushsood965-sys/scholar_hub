import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, FileText, AlertTriangle, Users } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const HodAttendanceView = ({ activeTab = 'attendance' }) => {
  const toast = useToast();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [deptStats, setDeptStats] = useState({ totalStudents: 0, defaulters: [], stats: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingLeaves();
    fetchDeptStats();
  }, []);

  const fetchPendingLeaves = async () => {
    try {
      const res = await axios.get('/api/attendance/leave/pending');
      setPendingLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeptStats = async () => {
    try {
      const res = await axios.get('/api/attendance/department/stats');
      setDeptStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionLeave = async (leaveId, action) => {
    try {
      await axios.put(`/api/attendance/leave/${leaveId}/action`, { action, remarks: 'Processed by HOD' });
      toast.success(`Leave ${action.toLowerCase()}d successfully.`);
      fetchPendingLeaves();
      fetchDeptStats(); // Recalculate stats as leave might be credited
    } catch (err) {
      toast.error('Failed to process leave action.');
    }
  };

  if (loading) return <div>Loading department statistics...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Department Overview Cards */}
      {activeTab === 'attendance' && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Total Enrolled Students</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{deptStats.totalStudents}</div>
          </div>
          <Users size={48} color="var(--color-primary)" opacity={0.3} />
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Attendance Defaulters (&lt;75%)</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-danger)' }}>{deptStats.defaulters.length}</div>
          </div>
          <AlertTriangle size={48} color="var(--color-danger)" opacity={0.3} />
        </div>
      </div>
      )}

      {/* Pending Leave Approvals */}
      {activeTab === 'leave' && (
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText color="var(--color-warning)" />
          Pending HOD Approvals (Leaves)
        </h2>
        
        {pendingLeaves.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No leaves pending your approval.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingLeaves.map(leave => (
              <div key={leave._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{leave.studentId?.name || 'Student'}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    {leave.leaveType} Leave • {leave.totalDays} Days ({new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()})
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Reason: {leave.reason}
                  </p>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Recommended by Supervisor
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleActionLeave(leave._id, 'APPROVE')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-success)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={16} /> Approve
                  </button>
                  <button onClick={() => handleActionLeave(leave._id, 'REJECT')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Defaulters List */}
      {activeTab === 'attendance' && (
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle color="var(--color-danger)" />
          Attendance Defaulter List
        </h2>
        
        {deptStats.defaulters.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No defaulters currently.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Student Name</th>
                  <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Program</th>
                  <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Attendance %</th>
                  <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {deptStats.defaulters.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 0', fontWeight: 600 }}>{student.name}</td>
                    <td style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>{student.program}</td>
                    <td style={{ padding: '12px 0', fontWeight: 700, color: 'var(--color-danger)' }}>{student.percentage}%</td>
                    <td style={{ padding: '12px 0' }}>
                      {student.percentage >= 65 ? (
                        <span style={{ padding: '4px 10px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Condonation Eligible (Medical)
                        </span>
                      ) : student.percentage >= 50 ? (
                        <span style={{ padding: '4px 10px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Condonation Eligible (Co-Curricular)
                        </span>
                      ) : (
                        <span style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                          Critical Defaulter
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

    </div>
  );
};

export default HodAttendanceView;
