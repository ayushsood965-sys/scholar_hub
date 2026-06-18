import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Search, FileText } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const FacultyAttendanceView = ({ activeTab = 'attendance' }) => {
  const toast = useToast();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock scholars for demonstration; ideally fetched from an API
  const [scholars, setScholars] = useState([
    { id: '1', name: 'Ayush Sood', roll: '2023-PHD-CS-001', status: 'PRESENT' },
    { id: '2', name: 'Rohan Das', roll: '2023-PHD-CS-002', status: 'PRESENT' },
    { id: '3', name: 'Sneha Patel', roll: '2023-PHD-CS-003', status: 'PRESENT' }
  ]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    try {
      const res = await axios.get('/api/attendance/leave/pending');
      setPendingLeaves(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionLeave = async (leaveId, action) => {
    try {
      await axios.put(`/api/attendance/leave/${leaveId}/action`, { action, remarks: 'Processed by Faculty' });
      toast.success(`Leave ${action.toLowerCase()}ed successfully.`);
      fetchPendingLeaves();
    } catch (err) {
      toast.error('Failed to process leave action.');
    }
  };

  const submitAttendance = async () => {
    try {
      const records = scholars.map(s => ({ studentId: s.id, status: s.status }));
      // Using a mock endpoint format. Since scholar IDs above are mock, it will error in backend without real IDs. 
      // In a real scenario, scholars state would be populated via fetch API.
      // await axios.post('/api/attendance/mark', { date: attendanceDate, type: 'DAILY', records });
      toast.success('Attendance submitted successfully. (Mock action)');
    } catch (err) {
      toast.error('Failed to submit attendance.');
    }
  };

  const toggleStatus = (id) => {
    setScholars(scholars.map(s => s.id === id ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } : s));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Mark Attendance Section */}
      {activeTab === 'attendance' && (
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mark Daily Attendance</h2>
          <input 
            type="date" 
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Student Name</th>
                <th style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>Roll / Reg. No.</th>
                <th style={{ padding: '12px 0', color: 'var(--color-text-muted)', textAlign: 'right' }}>Status Toggle</th>
              </tr>
            </thead>
            <tbody>
              {scholars.map(scholar => (
                <tr key={scholar.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>{scholar.name}</td>
                  <td style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>{scholar.roll}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleStatus(scholar.id)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: scholar.status === 'PRESENT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: scholar.status === 'PRESENT' ? '#34d399' : '#f87171'
                      }}
                    >
                      {scholar.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={submitAttendance} style={{ padding: '10px 24px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Submit Attendance
          </button>
        </div>
      </div>
      )}

      {/* Pending Leave Actions */}
      {activeTab === 'leave' && (
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText color="var(--color-primary)" />
          Pending Leave Recommendations
        </h2>
        
        {pendingLeaves.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No leaves pending your recommendation.</p>
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
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleActionLeave(leave._id, 'RECOMMEND')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-success)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={16} /> Recommend
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

    </div>
  );
};

export default FacultyAttendanceView;
