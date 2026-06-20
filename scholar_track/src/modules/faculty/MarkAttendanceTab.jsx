import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Save, Search, CheckSquare, Square, AlertTriangle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MarkAttendanceTab = () => {
  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  
  const [filters, setFilters] = useState({
    sessionId: '',
    degreeTypeId: '',
    degreeNameId: '',
    semesterId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [matrix, setMatrix] = useState(null);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: { status, classes: { slotId: bool } } }
  
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  const api = useApi();
  const toast = useToast();

  // Load masters for dropdowns
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [sesRes, dtRes, dnRes, semRes] = await Promise.all([
          api.get('/attendance/sessions'),
          api.get('/attendance/masters/degree-types'),
          api.get('/attendance/masters/degree-names'),
          api.get('/attendance/masters/semesters')
        ]);
        setSessions(sesRes.data);
        setDegreeTypes(dtRes.data);
        setDegreeNames(dnRes.data);
        setSemesters(semRes.data);
      } catch (err) {
        toast.error('Failed to load master dropdowns');
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchMasters();
  }, [api, toast]);

  const selectedType = degreeTypes.find(d => d._id === filters.degreeTypeId);
  const isPhD = selectedType?.code?.toUpperCase() === 'PHD';

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!filters.sessionId || !filters.degreeTypeId || !filters.degreeNameId || (!isPhD && !filters.semesterId) || !filters.date) {
      return toast.error('Please select all filters first');
    }

    setLoadingMatrix(true);
    try {
      const queryParams = new URLSearchParams({
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? '' : filters.semesterId,
        date: filters.date
      });
      const res = await api.get(`/attendance/faculty/matrix?${queryParams.toString()}`);
      setMatrix(res.data);

      // Initialize local state for the grid
      const initialData = {};
      res.data.students.forEach(st => {
        const existingRecord = st.record;
        const classSelections = {};
        
        res.data.classes.forEach(c => {
          if (existingRecord && existingRecord.classes) {
            const classRec = existingRecord.classes.find(cc => cc.timetableSlotId === c._id);
            classSelections[c._id] = classRec ? classRec.selected : false;
          } else {
            classSelections[c._id] = true; // Default class checkboxes to true
          }
        });

        initialData[st.student._id] = {
          status: existingRecord ? existingRecord.status : 'PRESENT',
          classes: classSelections
        };
      });
      setAttendanceData(initialData);
    } catch (err) {
      toast.error('Failed to retrieve attendance roster');
      setMatrix(null);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus
      }
    }));
  };

  const handleClassCheckboxChange = (studentId, slotId, checked) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        classes: {
          ...prev[studentId].classes,
          [slotId]: checked
        }
      }
    }));
  };

  // Bulk toggles
  const toggleClassForAll = (slotId, checked) => {
    setAttendanceData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(studentId => {
        // Only toggle for students who are not locked to ON_LEAVE
        if (updated[studentId].status !== 'ON_LEAVE') {
          updated[studentId].classes[slotId] = checked;
        }
      });
      return updated;
    });
  };

  const applyStatusToAll = (status) => {
    setAttendanceData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(studentId => {
        // Don't override approved leave
        const originalStatus = matrix?.students.find(st => st.student._id === studentId)?.record?.status;
        if (originalStatus !== 'ON_LEAVE' && updated[studentId].status !== 'ON_LEAVE') {
          updated[studentId].status = status;
        }
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!matrix) return;
    setSaving(true);
    try {
      const records = Object.keys(attendanceData).map(studentId => {
        const studentInfo = attendanceData[studentId];
        const studentClasses = matrix.classes.map(c => ({
          timetableSlotId: c._id,
          subjectName: c.subjectName,
          selected: !!studentInfo.classes[c._id]
        }));

        return {
          studentId,
          status: studentInfo.status,
          classes: studentClasses
        };
      });

      await api.post(`/attendance/faculty/mark-bulk`, {
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? null : filters.semesterId,
        date: filters.date,
        records
      });

      toast.success('Attendance saved successfully');
      
      // Re-trigger search to reload the latest values (including isLocked flag if applicable)
      const queryParams = new URLSearchParams({
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? '' : filters.semesterId,
        date: filters.date
      });
      const res = await api.get(`/attendance/faculty/matrix?${queryParams.toString()}`);
      setMatrix(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  // Helper to determine if a header select-all class checkbox is checked
  const isClassAllSelected = (slotId) => {
    const studentKeys = Object.keys(attendanceData);
    if (studentKeys.length === 0) return false;
    return studentKeys.every(studentId => {
      if (attendanceData[studentId].status === 'ON_LEAVE') return true; // ignore leave
      return !!attendanceData[studentId].classes[slotId];
    });
  };

  if (loadingFilters) return <SkeletonLoader count={1} height={200} />;

  const availableDegreeNames = degreeNames.filter(d => d.degreeTypeId?._id === filters.degreeTypeId);

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Daily Attendance Register</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Filter by criteria to load student roster and register attendance.</p>
      </div>

      <form onSubmit={handleSearch} className="grid-5 mb-lg" style={{ gap: '16px', alignItems: 'end' }}>
        <div className="form-group">
          <label className="form-label">Session</label>
          <select className="form-input" required value={filters.sessionId} onChange={e => setFilters({...filters, sessionId: e.target.value})}>
            <option value="">Select Session...</option>
            {sessions.map(s => <option key={s._id} value={s._id}>{s.sessionName}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Degree Type</label>
          <select className="form-input" required value={filters.degreeTypeId} onChange={e => setFilters({...filters, degreeTypeId: e.target.value, degreeNameId: '', semesterId: ''})}>
            <option value="">Select Degree Type...</option>
            {degreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Degree Name</label>
          <select className="form-input" required value={filters.degreeNameId} onChange={e => setFilters({...filters, degreeNameId: e.target.value})} disabled={!filters.degreeTypeId}>
            <option value="">Select Degree...</option>
            {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{isPhD ? 'Semester (N/A)' : 'Semester'}</label>
          <select 
            className="form-input" 
            required={!isPhD}
            value={filters.semesterId} 
            onChange={e => setFilters({...filters, semesterId: e.target.value})}
            disabled={!filters.degreeTypeId || isPhD}
            style={{ opacity: isPhD ? 0.3 : 1 }}
          >
            <option value="">{isPhD ? 'N/A' : 'Select Semester...'}</option>
            {!isPhD && semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" required value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} max={new Date().toISOString().split('T')[0]} />
        </div>

        <div style={{ gridColumn: 'span 5', textAlign: 'right', marginTop: '8px' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <Search size={18} style={{ marginRight: '8px' }} /> Fetch Roster Matrix
          </button>
        </div>
      </form>

      {loadingMatrix ? (
        <SkeletonLoader count={5} height={60} />
      ) : matrix ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="matrix-container" style={{ marginTop: '24px' }}>
          
          {/* Lock state alert */}
          <AnimatePresence>
            {matrix.isLocked && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-md p-md mb-lg" 
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171' }}
              >
                <Lock size={20} />
                <div>
                  <strong>Register Locked (Policy Enforcement)</strong>
                  <p style={{ fontSize: '0.85rem', marginTop: '2px', opacity: 0.85 }}>
                    The 48-hour editing window has expired. Student attendance records cannot be changed. Correction requests must be filed by the scholar.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center mb-md" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Enrolled Candidates: <strong style={{ color: 'var(--text-primary)' }}>{matrix.students.length}</strong></span>
            </div>
            {!matrix.isLocked && matrix.students.length > 0 && (
              <div className="flex items-center gap-md">
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Apply Status to All:</span>
                <button type="button" className="btn btn-sm btn-outline" style={{ borderColor: '#10B981', color: '#10B981' }} onClick={() => applyStatusToAll('PRESENT')}>Present</button>
                <button type="button" className="btn btn-sm btn-outline" style={{ borderColor: '#EF4444', color: '#EF4444' }} onClick={() => applyStatusToAll('ABSENT')}>Absent</button>
                <button type="button" className="btn btn-sm btn-outline" style={{ borderColor: '#3B82F6', color: '#3B82F6' }} onClick={() => applyStatusToAll('NOT_APPLICABLE')}>N/A</button>
              </div>
            )}
          </div>

          <div className="data-table-wrapper mb-lg" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Roll No</th>
                  <th style={{ width: '220px' }}>Candidate Name</th>
                  {matrix.classes.map(c => {
                    const allChecked = isClassAllSelected(c._id);
                    return (
                      <th key={c._id} style={{ textAlign: 'center', minWidth: '150px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{c.subjectName}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{c.startTime}-{c.endTime}</span>
                          {!matrix.isLocked && (
                            <button
                              type="button"
                              onClick={() => toggleClassForAll(c._id, !allChecked)}
                              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                              {allChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                              Select All
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  {matrix.classes.length === 0 && !isPhD && (
                    <th style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No Classes Scheduled</th>
                  )}
                  {isPhD && (
                    <th style={{ textAlign: 'center', color: '#10B981', fontSize: '0.85rem' }}>PhD Scholar Log (Daily)</th>
                  )}
                  <th style={{ textAlign: 'center', width: '250px' }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {matrix.students.map((st, sIdx) => {
                  const studentId = st.student._id;
                  const currentData = attendanceData[studentId] || { status: 'PRESENT', classes: {} };
                  const isOnLeave = st.record?.status === 'ON_LEAVE' || currentData.status === 'ON_LEAVE';
                  
                  return (
                    <motion.tr 
                      key={studentId} 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: Math.min(sIdx * 0.05, 0.5) }}
                      style={{ background: isOnLeave ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
                    >
                      <td>{st.student.profile?.enrollmentNumber || 'N/A'}</td>
                      <td>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{st.student.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{st.student.username}</div>
                        {isOnLeave && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginTop: '4px', display: 'inline-block' }}>
                            Approved Leave
                          </span>
                        )}
                      </td>
                      {matrix.classes.map(c => {
                        const isChecked = !!currentData.classes[c._id];
                        return (
                          <td key={c._id} style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              disabled={matrix.isLocked || isOnLeave}
                              checked={isOnLeave ? false : isChecked}
                              onChange={(e) => handleClassCheckboxChange(studentId, c._id, e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: (matrix.isLocked || isOnLeave) ? 'not-allowed' : 'pointer' }}
                            />
                          </td>
                        );
                      })}
                      {matrix.classes.length === 0 && !isPhD && (
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</td>
                      )}
                      {isPhD && (
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Daily Check-In</td>
                      )}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
                          {['PRESENT', 'ABSENT', 'ON_LEAVE', 'NOT_APPLICABLE'].map(s => {
                            // Render On Leave button only if the scholar is actually on leave
                            if (s === 'ON_LEAVE' && !isOnLeave) return null;
                            
                            let label = s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ');
                            if (s === 'NOT_APPLICABLE') label = 'N/A';

                            let activeColor = '#10B981'; // Present
                            if (s === 'ABSENT') activeColor = '#EF4444';
                            if (s === 'ON_LEAVE') activeColor = '#3B82F6';
                            if (s === 'NOT_APPLICABLE') activeColor = 'var(--text-secondary)';

                            const isSelected = currentData.status === s;
                            
                            return (
                              <button
                                key={s}
                                type="button"
                                disabled={matrix.isLocked || isOnLeave}
                                onClick={() => handleStatusChange(studentId, s)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: (matrix.isLocked || isOnLeave) ? 'not-allowed' : 'pointer',
                                  background: isSelected ? activeColor : 'transparent',
                                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                                  fontWeight: isSelected ? 'bold' : 'normal',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {matrix.students.length === 0 && (
                  <tr>
                    <td colSpan={3 + matrix.classes.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No students found matching this criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving || matrix.isLocked || matrix.students.length === 0}
              style={{ padding: '12px 32px', fontSize: '1.05rem', minWidth: '180px' }}
            >
              <Save size={18} style={{ marginRight: '8px' }} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>

        </motion.div>
      ) : (
        <div className="clay-card p-xl text-center" style={{ marginTop: '24px', padding: '60px', color: 'var(--text-secondary)' }}>
          Please select a criteria and date above to load the attendance register roster.
        </div>
      )}
    </div>
  );
};

export default MarkAttendanceTab;
