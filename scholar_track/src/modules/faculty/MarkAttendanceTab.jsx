import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Save, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const MarkAttendanceTab = () => {
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [matrix, setMatrix] = useState(null);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' }
  
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await api.get('/attendance/timetables/faculty');
        setSlots(res.data);
        if (res.data.length > 0) setSelectedSlotId(res.data[0]._id);
      } catch (err) {
        toast.error('Failed to load classes');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [api, toast]);

  useEffect(() => {
    const fetchMatrix = async () => {
      if (!selectedSlotId || !date) return;
      setLoadingMatrix(true);
      try {
        const slot = slots.find(s => s._id === selectedSlotId);
        if (!slot) return;
        const queryParams = new URLSearchParams({
          sessionId: slot.sessionId || '',
          degreeTypeId: slot.degreeTypeId || '',
          degreeNameId: slot.degreeNameId?._id || slot.degreeNameId || '',
          semesterId: slot.semesterId?._id || slot.semesterId || '',
          date
        });
        const res = await api.get(`/attendance/faculty/matrix?${queryParams.toString()}`);
        setMatrix(res.data);
        
        // Initialize attendance state
        const initialAtt = {};
        res.data.students.forEach(st => {
          initialAtt[st.studentId] = st.status || 'PRESENT'; // Default to Present
        });
        setAttendanceData(initialAtt);
      } catch (err) {
        toast.error('Failed to load attendance matrix');
        setMatrix(null);
      } finally {
        setLoadingMatrix(false);
      }
    };
    fetchMatrix();
  }, [selectedSlotId, date, slots, api, toast]);

  const handleStatusChange = (studentId, status) => {
    // If student is on approved leave, we might not let them change it, but the backend handles logic.
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const updated = { ...attendanceData };
    matrix?.students.forEach(st => {
      if (st.status !== 'ON_LEAVE') { // Don't override approved leave
        updated[st.studentId] = status;
      }
    });
    setAttendanceData(updated);
  };

  const handleSave = async () => {
    if (!matrix) return;
    setSaving(true);
    try {
      const records = Object.keys(attendanceData).map(studentId => ({
        studentId,
        status: attendanceData[studentId]
      }));
      
      const slot = slots.find(s => s._id === selectedSlotId);
      
      await api.post(`/attendance/faculty/mark-bulk`, {
        sessionId: slot.sessionId || '',
        degreeTypeId: slot.degreeTypeId || '',
        degreeNameId: slot.degreeNameId?._id || slot.degreeNameId || '',
        semesterId: slot.semesterId?._id || slot.semesterId || '',
        date,
        records
      });
      toast.success('Attendance saved successfully');
      
      // Refresh to get locked status or updated matrix
      const queryParams = new URLSearchParams({
        sessionId: slot.sessionId || '',
        degreeTypeId: slot.degreeTypeId || '',
        degreeNameId: slot.degreeNameId?._id || slot.degreeNameId || '',
        semesterId: slot.semesterId?._id || slot.semesterId || '',
        date
      });
      const res = await api.get(`/attendance/faculty/matrix?${queryParams.toString()}`);
      setMatrix(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loadingSlots) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Mark Attendance</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select a class and date to mark attendance.</p>
        </div>
      </div>

      <div className="grid-2 mb-lg" style={{ gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Select Class (Timetable Slot)</label>
          <select className="form-input" value={selectedSlotId} onChange={e => setSelectedSlotId(e.target.value)}>
            {slots.map(s => (
              <option key={s._id} value={s._id}>
                {s.dayOfWeek} {s.startTime}-{s.endTime} | {s.subjectName} ({s.degreeNameId?.name || 'N/A'})
              </option>
            ))}
            {slots.length === 0 && <option value="">No classes assigned</option>}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
        </div>
      </div>

      {loadingMatrix ? (
        <SkeletonLoader count={5} height={50} />
      ) : matrix ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="matrix-container">
          
          <div className="flex justify-between items-center mb-md" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', marginRight: '16px' }}>Total Students: <strong style={{ color: 'var(--text-primary)' }}>{matrix.students.length}</strong></span>
              {matrix.isLocked && <span className="badge badge-warning"><AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }}/> Locked (Contact HOD to edit)</span>}
            </div>
            {!matrix.isLocked && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-outline" onClick={() => markAll('PRESENT')}><UserCheck size={16} /> Mark All Present</button>
                <button className="btn btn-sm btn-outline" onClick={() => markAll('ABSENT')}><UserX size={16} /> Mark All Absent</button>
              </div>
            )}
          </div>

          <div className="data-table-wrapper mb-lg">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th style={{ textAlign: 'center' }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {matrix.students.map(st => {
                  const currentStatus = attendanceData[st.studentId] || 'PRESENT';
                  const isOnLeave = currentStatus === 'ON_LEAVE';
                  
                  return (
                    <tr key={st.studentId} style={{ opacity: isOnLeave ? 0.7 : 1 }}>
                      <td>{st.enrollmentNumber || 'N/A'}</td>
                      <td>
                        {st.name}
                        {isOnLeave && <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>Approved Leave</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
                          <button
                            disabled={matrix.isLocked || isOnLeave}
                            onClick={() => handleStatusChange(st.studentId, 'PRESENT')}
                            style={{
                              padding: '6px 16px', border: 'none', borderRadius: '6px', cursor: (matrix.isLocked || isOnLeave) ? 'not-allowed' : 'pointer',
                              background: currentStatus === 'PRESENT' ? '#10B981' : 'transparent',
                              color: currentStatus === 'PRESENT' ? '#fff' : 'var(--text-secondary)',
                              fontWeight: currentStatus === 'PRESENT' ? 'bold' : 'normal',
                              transition: 'all 0.2s'
                            }}
                          >
                            Present
                          </button>
                          <button
                            disabled={matrix.isLocked || isOnLeave}
                            onClick={() => handleStatusChange(st.studentId, 'ABSENT')}
                            style={{
                              padding: '6px 16px', border: 'none', borderRadius: '6px', cursor: (matrix.isLocked || isOnLeave) ? 'not-allowed' : 'pointer',
                              background: currentStatus === 'ABSENT' ? '#EF4444' : 'transparent',
                              color: currentStatus === 'ABSENT' ? '#fff' : 'var(--text-secondary)',
                              fontWeight: currentStatus === 'ABSENT' ? 'bold' : 'normal',
                              transition: 'all 0.2s'
                            }}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {matrix.students.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center' }}>No students found for this class.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving || matrix.isLocked || matrix.students.length === 0}
              style={{ padding: '12px 32px', fontSize: '1.1rem' }}
            >
              <Save size={18} style={{ marginRight: '8px' }} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Select a class and date to view the attendance roster.
        </div>
      )}
    </div>
  );
};

export default MarkAttendanceTab;
