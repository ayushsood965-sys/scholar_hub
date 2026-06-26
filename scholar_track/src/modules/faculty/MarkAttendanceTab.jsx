import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Save, Search, Check, ClipboardList, Lock, Users, Clock, BookOpen, ChevronDown, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MarkAttendanceTab.css';

const MarkAttendanceTab = () => {
  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  
  const [filters, setFilters] = useState({
    sessionId: '',
    degreeTypeId: '',
    degreeNameId: '',
    semesterId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [matrix, setMatrix] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [openLeaveDropdownStudentId, setOpenLeaveDropdownStudentId] = useState(null);
  
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  const api = useApi();
  const toast = useToast();

  // Load masters for dropdowns
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [sesRes, dtRes, dnRes, semRes, ltRes] = await Promise.all([
          api.get('/attendance/sessions'),
          api.get('/attendance/masters/degree-types'),
          api.get('/attendance/masters/degree-names'),
          api.get('/attendance/masters/semesters'),
          api.get('/attendance/leave-types')
        ]);
        setSessions(sesRes.data);
        setDegreeTypes(dtRes.data);
        setDegreeNames(dnRes.data);
        setSemesters(semRes.data);
        setLeaveTypes(ltRes.data);
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

      // Initialize global selected subjects
      const initialSelectedSubjects = {};
      const firstStudentRec = res.data.students[0]?.record;
      res.data.classes.forEach(c => {
        const isSaved = res.data.students.some(st => 
          st.record && (st.record.classes || []).some(cc => 
            cc.timetableSlotId === c._id && cc.selected
          )
        );

        if (isSaved) {
          initialSelectedSubjects[c._id] = false;
        } else {
          if (firstStudentRec && firstStudentRec.classes) {
            const classRec = firstStudentRec.classes.find(cc => cc.timetableSlotId === c._id);
            initialSelectedSubjects[c._id] = classRec ? classRec.selected : false;
          } else {
            initialSelectedSubjects[c._id] = true;
          }
        }
      });
      setSelectedSubjects(initialSelectedSubjects);

      // Initialize local state for the grid
      const initialData = {};
      res.data.students.forEach(st => {
        const existingRecord = st.record;
        const leaveInfo = st.leave;
        
        let initialStatus = '';
        let initialLeaveType = '';
        let initialLeaveRequestId = null;

        if (existingRecord) {
          const isApprovedLeave = (leaveInfo && leaveInfo.status === 'APPROVED') || existingRecord.status === 'ON_LEAVE';
          if (isApprovedLeave) {
            initialStatus = 'ON_LEAVE';
            initialLeaveType = existingRecord.leaveType || leaveInfo?.leaveType || '';
            initialLeaveRequestId = existingRecord.leaveRequestId || leaveInfo?._id || null;
          } else {
            initialStatus = '';
          }
        } else if (leaveInfo) {
          initialStatus = 'ON_LEAVE';
          initialLeaveType = leaveInfo.leaveType;
          initialLeaveRequestId = leaveInfo._id;
        }

        initialData[st.student._id] = {
          status: initialStatus,
          leaveType: initialLeaveType,
          leaveRequestId: initialLeaveRequestId
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

  const handleStatusChange = (studentId, newStatus, extraData = {}) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
        ...extraData
      }
    }));
  };

  const applyStatusToAll = (status) => {
    setAttendanceData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(studentId => {
        const originalStatus = matrix?.students.find(st => st.student._id === studentId)?.record?.status;
        const studentLeave = matrix?.students.find(st => st.student._id === studentId)?.leave;
        const isApprovedLeave = studentLeave?.status === 'APPROVED' || originalStatus === 'ON_LEAVE';

        if (!isApprovedLeave && updated[studentId].status !== 'ON_LEAVE') {
          updated[studentId].status = status;
        }
      });
      return updated;
    });
  };

  const isClassSaved = (classId) => {
    return (matrix?.students || []).some(st => 
      st.record && (st.record.classes || []).some(cc => 
        cc.timetableSlotId === classId && cc.selected
      )
    );
  };

  const handleSave = async () => {
    if (!matrix) return;

    if (!isPhD && matrix.classes.length > 0) {
      const hasSelectedClass = Object.values(selectedSubjects).some(v => v === true);
      if (!hasSelectedClass) {
        return toast.error('Please select at least one scheduled course from the course selector above before saving attendance.');
      }
    }

    const unmarkedNames = [];
    unmarkedStudents.forEach(st => {
      const studentId = st.student._id;
      const currentData = attendanceData[studentId];
      const isApprovedLeave = st.leave && st.leave.status === 'APPROVED';
      
      if (!isApprovedLeave && (!currentData || currentData.status === '')) {
        unmarkedNames.push(st.student.name);
      }
    });

    if (unmarkedNames.length > 0) {
      if (unmarkedNames.length > 3) {
        return toast.error('Please select an attendance status (Present, Absent, N/A, or Leave) for all candidates in the register grid before saving.');
      } else {
        return toast.error(`Please mark attendance status for: ${unmarkedNames.join(', ')}`);
      }
    }

    setSaving(true);
    try {
      const markedRecords = unmarkedStudents
        .map(st => {
          const studentId = st.student._id;
          const studentInfo = attendanceData[studentId];
          const studentClasses = matrix.classes.map(c => ({
            timetableSlotId: c._id,
            subjectName: c.subjectName,
            selected: !!selectedSubjects[c._id]
          }));

          return {
            studentId,
            status: studentInfo.status,
            leaveType: studentInfo.leaveType || '',
            leaveRequestId: studentInfo.leaveRequestId || null,
            classes: studentClasses
          };
        });

      await api.post(`/attendance/faculty/mark-bulk`, {
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? null : filters.semesterId,
        date: filters.date,
        records: markedRecords
      });

      toast.success('Attendance saved successfully');
      
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

  const unmarkedStudents = (matrix?.students || []).filter(st => {
    if (isPhD) {
      return !st.record;
    }
    if (!st.record) return true;
    const hasAnySelectedCheckedClass = (st.record.classes || []).some(c => 
      selectedSubjects[c.timetableSlotId] && c.selected
    );
    return !hasAnySelectedCheckedClass;
  });

  if (loadingFilters) return <SkeletonLoader count={1} height={200} />;

  const availableDegreeNames = degreeNames.filter(d => d.degreeTypeId?._id === filters.degreeTypeId);
  const finalLeaveTypes = leaveTypes.length > 0
    ? leaveTypes.map(lt => lt.leaveName)
    : ['Casual Leave', 'Medical Leave', 'Duty Leave', 'Earned Leave', 'Maternity Leave', 'Special Leave'];

  return (
    <div className="att-container">

      {/* ============================================ */}
      {/* Daily Attendance Register                     */}
      {/* ============================================ */}
      <div className="att-glass-card">
        <div className="att-top-bar" />
        <div className="att-card-header">
          <div className="att-card-icon att-card-icon-mark">
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className="att-card-title">Daily Attendance Register</h2>
            <p className="att-card-subtitle">Filter by criteria to load student roster and mark attendance.</p>
          </div>
        </div>
        <div className="att-card-body">

          {/* ─── Filter Form ─── */}
          <form onSubmit={handleSearch}>
            <div className="att-filters-wrapper">
              <div className="att-filter-grid">
                <div className="att-filter-group">
                  <label className="att-filter-label">Session</label>
                  <select className="att-filter-select" required value={filters.sessionId} onChange={e => setFilters({...filters, sessionId: e.target.value})}>
                    <option value="">Select Session...</option>
                    {sessions.map(s => <option key={s._id} value={s._id}>{s.sessionName}</option>)}
                  </select>
                </div>

                <div className="att-filter-group">
                  <label className="att-filter-label">Degree Type</label>
                  <select className="att-filter-select" required value={filters.degreeTypeId} onChange={e => setFilters({...filters, degreeTypeId: e.target.value, degreeNameId: '', semesterId: ''})}>
                    <option value="">Select Degree Type...</option>
                    {degreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="att-filter-group">
                  <label className="att-filter-label">Degree Name</label>
                  <select className="att-filter-select" required value={filters.degreeNameId} onChange={e => setFilters({...filters, degreeNameId: e.target.value})} disabled={!filters.degreeTypeId}>
                    <option value="">Select Degree...</option>
                    {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="att-filter-grid-2">
                <div className="att-filter-group">
                  <label className="att-filter-label">{isPhD ? 'Semester (N/A)' : 'Semester'}</label>
                  <select 
                    className="att-filter-select" 
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

                <div className="att-filter-group">
                  <label className="att-filter-label">Date</label>
                  <input type="date" className="att-filter-input" required value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} max={new Date().toISOString().split('T')[0]} />
                </div>

                <button type="submit" className="att-search-btn">
                  <Search size={16} /> Fetch Roster
                </button>
              </div>
            </div>
          </form>

          {/* ─── Matrix / Roster Section ─── */}
          {loadingMatrix ? (
            <div style={{ marginTop: '24px' }}>
              <SkeletonLoader count={5} height={60} />
            </div>
          ) : matrix ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ marginTop: '24px' }}
            >
              {/* Lock state alert */}
              <AnimatePresence>
                {matrix.isLocked && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="att-alert att-alert-locked"
                  >
                    <Lock size={18} className="att-alert-icon" />
                    <div>
                      <span className="att-alert-title">Register Locked (Policy Enforcement)</span>
                      <p className="att-alert-text">
                        The 48-hour editing window has expired. Student attendance records cannot be changed. Correction requests must be filed by the scholar.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── Scheduled Courses Selection ─── */}
              {!isPhD && matrix.classes.length > 0 && (
                <div className="att-courses-section">
                  <div className="att-courses-header">
                    <h3 className="att-courses-title">
                      <BookOpen size={16} />
                      Select Scheduled Courses for Register
                    </h3>
                    <div className="att-courses-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ padding: '5px 14px', fontSize: '0.72rem' }}
                        onClick={() => {
                          const updated = {};
                          matrix.classes.forEach(c => {
                            const isSaved = isClassSaved(c._id);
                            if (!isSaved) {
                              updated[c._id] = true;
                            } else {
                              updated[c._id] = false;
                            }
                          });
                          setSelectedSubjects(updated);
                        }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ padding: '5px 14px', fontSize: '0.72rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                        onClick={() => {
                          const updated = {};
                          matrix.classes.forEach(c => { updated[c._id] = false; });
                          setSelectedSubjects(updated);
                        }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {matrix.classes.map((c, idx) => {
                      const isSaved = isClassSaved(c._id);
                      const isChecked = !isSaved && !!selectedSubjects[c._id];
                      return (
                        <motion.div
                          key={c._id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                          className={`att-course-chip ${isChecked ? 'att-course-chip-selected' : ''} ${isSaved ? 'att-course-chip-saved' : ''}`}
                          onClick={() => {
                            if (matrix.isLocked || isSaved) return;
                            setSelectedSubjects(prev => ({ ...prev, [c._id]: !isChecked }));
                          }}
                        >
                          <div className="att-course-checkbox">
                            <Check size={14} strokeWidth={3} />
                          </div>
                          <div className="att-course-info">
                            <span className="att-course-name">{c.subjectName}</span>
                            <span className="att-course-code">Code: {c.subjectCode}</span>
                            <span className="att-course-time">
                              <Clock size={12} /> {c.startTime} - {c.endTime}
                            </span>
                          </div>
                          {isSaved && (
                            <span className="att-course-badge-marked">Marked</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── Stats Bar ─── */}
              <div className="att-stats-bar">
                <div className="att-stats-count">
                  <Users size={16} />
                  Unmarked Candidates: <strong>{unmarkedStudents.length}</strong>
                </div>
                {!matrix.isLocked && unmarkedStudents.length > 0 && (
                  <div className="att-bulk-actions">
                    <span className="att-bulk-label">Apply Status to All:</span>
                    <button type="button" className="att-bulk-btn att-bulk-btn-present" onClick={() => applyStatusToAll('PRESENT')}>Present</button>
                    <button type="button" className="att-bulk-btn att-bulk-btn-absent" onClick={() => applyStatusToAll('ABSENT')}>Absent</button>
                    <button type="button" className="att-bulk-btn att-bulk-btn-na" onClick={() => applyStatusToAll('NOT_APPLICABLE')}>N/A</button>
                  </div>
                )}
              </div>

              {/* ─── Student Table ─── */}
              <div className="att-table-wrapper">
                <table className="att-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }} className="att-th-center">#</th>
                      <th style={{ width: '110px' }}>Sh. No.</th>
                      <th>Student Name</th>
                      <th>Father's Name</th>
                      <th style={{ width: '360px' }} className="att-th-center">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmarkedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="att-empty-state" style={{ padding: '40px' }}>
                          <div className="att-empty-icon">✓</div>
                          No unmarked students found matching this criteria.
                        </td>
                      </tr>
                    ) : (
                      unmarkedStudents.map((st, sIdx) => {
                        const studentId = st.student._id;
                        const currentData = attendanceData[studentId] || { status: '', leaveType: '', leaveRequestId: null };
                        const isLeave = currentData.status === 'ON_LEAVE';

                        return (
                          <motion.tr 
                            key={studentId} 
                            initial={{ opacity: 0, y: 4 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: Math.min(sIdx * 0.03, 0.5) }}
                          >
                            <td className="att-cell-center" style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{sIdx + 1}</td>
                            <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{st.student.profile?.shNo || 'N/A'}</td>
                            <td>
                              <div className="att-student-cell">
                                <span className="att-student-name">{st.student.name}</span>
                                <span className="att-student-username">{st.student.username}</span>
                                {isLeave && (
                                  <span className="att-leave-badge att-leave-badge-pending" style={{ fontSize: '0.62rem', marginTop: '4px', padding: '3px 8px' }}>
                                    <AlertTriangle size={10} />
                                    {st.leave?.status === 'APPROVED' ? 'Approved Leave' : 'Manual Leave'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="att-father-name">{st.student.profile?.fatherName || '—'}</td>
                            <td className="att-cell-center">
                              <div className="att-status-group">
                                <button
                                  type="button"
                                  disabled={matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')}
                                  onClick={() => handleStatusChange(studentId, 'PRESENT', { leaveType: '', leaveRequestId: null })}
                                  className={`att-status-pill att-status-present ${currentData.status === 'PRESENT' ? 'att-status-active' : ''}`}
                                >
                                  Present
                                </button>

                                <button
                                  type="button"
                                  disabled={matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')}
                                  onClick={() => handleStatusChange(studentId, 'ABSENT', { leaveType: '', leaveRequestId: null })}
                                  className={`att-status-pill att-status-absent ${currentData.status === 'ABSENT' ? 'att-status-active' : ''}`}
                                >
                                  Absent
                                </button>

                                <button
                                  type="button"
                                  disabled={matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')}
                                  onClick={() => handleStatusChange(studentId, 'NOT_APPLICABLE', { leaveType: '', leaveRequestId: null })}
                                  className={`att-status-pill att-status-na ${currentData.status === 'NOT_APPLICABLE' ? 'att-status-active' : ''}`}
                                >
                                  N/A
                                </button>

                                {st.leave ? (
                                  st.leave.status === 'APPROVED' ? (
                                    <div className="att-leave-badge att-leave-badge-approved">
                                      Leave - {st.leave.leaveType}
                                    </div>
                                  ) : (
                                    <div className="att-leave-badge att-leave-badge-pending">
                                      <AlertTriangle size={12} />
                                      Leave - {st.leave.leaveType}
                                    </div>
                                  )
                                ) : (
                                  currentData.status === 'ON_LEAVE' ? (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                      <button
                                        type="button"
                                        disabled={matrix.isLocked}
                                        onClick={() => setOpenLeaveDropdownStudentId(openLeaveDropdownStudentId === studentId ? null : studentId)}
                                        className="att-leave-badge att-leave-badge-manual"
                                      >
                                        Leave - {currentData.leaveType || finalLeaveTypes[0]}
                                        <ChevronDown size={12} />
                                      </button>
                                      
                                      {openLeaveDropdownStudentId === studentId && (
                                        <>
                                          <div 
                                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 105 }} 
                                            onClick={() => setOpenLeaveDropdownStudentId(null)}
                                          />
                                          <div className="att-leave-dropdown">
                                            {finalLeaveTypes.map(ltName => (
                                              <button
                                                key={ltName}
                                                type="button"
                                                onClick={() => {
                                                  handleStatusChange(studentId, 'ON_LEAVE', { leaveType: ltName, leaveRequestId: null });
                                                  setOpenLeaveDropdownStudentId(null);
                                                }}
                                                className={`att-leave-option ${currentData.leaveType === ltName ? 'att-leave-option-active' : ''}`}
                                              >
                                                {ltName}
                                              </button>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={matrix.isLocked}
                                      onClick={() => handleStatusChange(studentId, 'ON_LEAVE', { leaveType: finalLeaveTypes[0], leaveRequestId: null })}
                                      className={`att-status-pill att-status-leave ${currentData.status === 'ON_LEAVE' ? 'att-status-active' : ''}`}
                                    >
                                      Leave
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ─── Save Button ─── */}
              <div className="att-save-btn-wrapper">
                <button 
                  type="button" 
                  className="att-save-btn"
                  onClick={handleSave}
                  disabled={saving || matrix.isLocked || unmarkedStudents.length === 0}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>

            </motion.div>
          ) : (
            <div className="att-empty-state" style={{ marginTop: '24px' }}>
              <div className="att-empty-icon">
                <ClipboardList size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
              </div>
              Please select a criteria and date above to load the attendance register roster.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceTab;
