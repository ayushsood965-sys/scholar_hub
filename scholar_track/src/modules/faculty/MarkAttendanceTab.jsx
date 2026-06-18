import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../hooks/useApi';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

const MarkAttendanceTab = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/auth/department-users?department=${encodeURIComponent(user?.department ?? '')}&role=STUDENT`);
        setStudents(data ?? []);
        const defaultRecs = {};
        (data ?? []).forEach(s => { defaultRecs[s._id] = 'PRESENT'; });
        setRecords(defaultRecs);
      } catch (err) {
        // Fallback: just show empty
        console.error('Could not fetch students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.department]);

  const setStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (students.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        date,
        courseCode: 'DAILY',
        courseName: 'Daily Check-In',
        records: students.map(s => ({
          studentId: s._id,
          status: records[s._id] ?? 'PRESENT',
          remarks: ''
        }))
      };
      await api.post('/attendance/faculty/mark-bulk', payload);
      toast.success(`Attendance submitted for ${students.length} scholars!`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonLoader type="table" count={6} />;

  const statuses = ['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE'];

  return (
    <div>
      <div className="flex items-center justify-between mb-lg" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mark Daily Attendance</h2>
          <p className="text-sm text-muted">Select date and set status for each scholar</p>
        </div>
        <div className="flex items-center gap-md">
          <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '180px' }} />
          <motion.button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Send size={16} /> {submitting ? 'Submitting...' : 'Submit All'}
          </motion.button>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState title="No scholars found" message="No students found in your department to mark attendance for." />
      ) : (
        <div className="roster-grid">
          {students.map((student, i) => (
            <motion.div
              key={student._id}
              className="roster-row"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <div className="flex items-center gap-sm">
                <div style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.82rem', flexShrink: 0
                }}>
                  {student.name?.[0]?.toUpperCase() ?? 'S'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{student.profile?.enrollmentNumber ?? student.username}</div>
                </div>
              </div>

              <div className="status-toggle-group">
                {statuses.map(st => (
                  <button
                    key={st}
                    className={`status-toggle-btn ${records[student._id] === st ? `selected-${st.toLowerCase().replace('on_', '')}` : ''}`}
                    onClick={() => setStatus(student._id, st)}
                  >
                    {st === 'ON_LEAVE' ? 'Leave' : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div style={{ textAlign: 'right' }}>
                {records[student._id] === 'PRESENT' && <CheckCircle size={18} style={{ color: 'var(--status-present)' }} />}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkAttendanceTab;
