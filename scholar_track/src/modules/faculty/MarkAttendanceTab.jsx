import React, { useState, useEffect, useMemo, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Save, Search, Check, ClipboardList, Lock, Users, Clock, BookOpen, ChevronDown, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [savedClasses, setSavedClasses] = useState({});
  const [openLeaveDropdownStudentId, setOpenLeaveDropdownStudentId] = useState(null);
  const [hasPartialMapping, setHasPartialMapping] = useState(false);
  
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  const api = useApi();
  const toast = useToast();
  const { user } = useContext(AuthContext);

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
      setHasPartialMapping(res.data.hasPartialMapping);
      const initialSelectedSubjects = {};
      const initialSavedClasses = {};
      const firstStudentRec = res.data.students[0]?.record;
      res.data.classes.forEach(c => {
        const isSaved = res.data.students.some(st =>
          st.record && (st.record.classes || []).some(cc =>
            cc.timetableSlotId === c._id && cc.selected
          )
        );
        initialSavedClasses[c._id] = isSaved;
        if (isSaved) {
          initialSelectedSubjects[c._id] = false;
        } else {
          if (firstStudentRec && firstStudentRec.classes) {
            const classRec = firstStudentRec.classes.find(cc => cc.timetableSlotId === c._id);
            initialSelectedSubjects[c._id] = classRec ? classRec.selected : false;
          } else {
            // Only auto-select subjects that have no partial mapping conflict
            if (res.data.hasPartialMapping) {
              // If partial mapping exists, leave all unselected initially 
              initialSelectedSubjects[c._id] = false;
            } else {
              initialSelectedSubjects[c._id] = true;
            }
          }
        }
      });
      setSelectedSubjects(initialSelectedSubjects);
      setSavedClasses(initialSavedClasses);
      const initialData = {};
      res.data.students.forEach(st => {
        const existingRecord = st.record;
        const leaveInfo = st.leave;
        let initialStatus = '';
        let initialLeaveType = '';
        let initialLeaveRequestId = null;
        let initialLeaveStatus = '';
        if (existingRecord) {
          const hasAnyLeave = (leaveInfo && ['APPROVED', 'PENDING_HOD', 'PENDING_SUPERVISOR'].includes(leaveInfo.status)) || existingRecord.status === 'ON_LEAVE';
          if (hasAnyLeave) {
            initialStatus = 'ON_LEAVE';
            initialLeaveType = existingRecord.leaveType || leaveInfo?.leaveType || '';
            initialLeaveRequestId = existingRecord.leaveRequestId || leaveInfo?._id || null;
            initialLeaveStatus = leaveInfo?.status || 'APPROVED';
          } else {
            initialStatus = '';
          }
        } else if (leaveInfo) {
          if (['APPROVED', 'PENDING_HOD', 'PENDING_SUPERVISOR'].includes(leaveInfo.status)) {
            initialStatus = 'ON_LEAVE';
            initialLeaveType = leaveInfo.leaveType;
            initialLeaveRequestId = leaveInfo._id;
            initialLeaveStatus = leaveInfo.status;
          }
        }
        initialData[st.student._id] = { status: initialStatus, leaveType: initialLeaveType, leaveRequestId: initialLeaveRequestId, leaveStatus: initialLeaveStatus };
      });
      setAttendanceData(initialData);
    } catch (err) {
      toast.error('Failed to retrieve attendance roster');
      setMatrix(null);
    } finally {
      setLoadingMatrix(false);
    }
  };

  // ── Compute displayed students based on selected subjects ──
  // Only students mapped to all selected subjects via StudentSemesterMapping are shown
  const displayedStudents = useMemo(() => {
    if (!matrix || isPhD) return matrix?.students || [];

    const selectedSubIds = Object.entries(selectedSubjects)
      .filter(([, val]) => val)
      .map(([id]) => id);

    if (selectedSubIds.length === 0) return [];

    // Get the set of students mapped to ALL selected subjects (intersection)
    const mappedSets = selectedSubIds.map(subId => {
      const cls = matrix.classes.find(c => c._id === subId);
      return new Set(cls?.mappedStudentIds || []);
    });

    // Compute intersection of all mapped sets
    const commonIds = new Set();
    if (mappedSets.length > 0) {
      mappedSets[0].forEach(id => {
        const inAll = mappedSets.every(set => set.has(id));
        if (inAll) commonIds.add(id);
      });
    }

    return (matrix.students || []).filter(st => commonIds.has(st.student._id));
  }, [selectedSubjects, matrix, isPhD]);

  // ── Check if selected subjects include a partially-mapped one ──
  const hasSelectedPartial = useMemo(() => {
    if (!matrix || !hasPartialMapping) return false;
    const selectedSubIds = Object.entries(selectedSubjects)
      .filter(([, val]) => val)
      .map(([id]) => id);
    if (selectedSubIds.length === 0) return false;

    // Check if all selected subjects have the same studentSetKey
    const selectedClasses = matrix.classes.filter(c => selectedSubIds.includes(c._id));
    const uniqueKeys = new Set(selectedClasses.map(c => c.studentSetKey));
    return uniqueKeys.size > 1;
  }, [selectedSubjects, matrix, hasPartialMapping]);

  // ── Subject toggle: enforce single-select for partial mapping ──
  const handleSubjectToggle = (subjectId) => {
    if (!matrix || matrix.isLocked) return;
    const isSaved = isClassSaved(subjectId);
    if (isSaved) return;

    if (hasPartialMapping) {
      // Single-subject selection mode: deselect all, select only this one
      const updated = {};
      matrix.classes.forEach(c => { updated[c._id] = false; });
      updated[subjectId] = !selectedSubjects[subjectId];
      setSelectedSubjects(updated);
      return;
    }

    setSelectedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const handleSelectAllSubjects = () => {
    if (!matrix || hasPartialMapping) return;
    const nonSavedSubjects = matrix.classes.filter(c => !isClassSaved(c._id));
    const allSelected = nonSavedSubjects.every(c => selectedSubjects[c._id]);
    const updated = {};
    matrix.classes.forEach(c => {
      updated[c._id] = isClassSaved(c._id) ? false : !allSelected;
    });
    setSelectedSubjects(updated);
  };

  const handleStatusChange = (studentId, newStatus, extraData = {}) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status: newStatus, ...extraData }
    }));
  };

  const applyStatusToAll = (status) => {
    setAttendanceData(prev => {
      const updated = { ...prev };
      displayedStudents.forEach(st => {
        const studentId = st.student._id;
        const originalStatus = st.record?.status;
        const studentLeave = st.leave;
        const hasAnyLeave = studentLeave && ['APPROVED', 'PENDING_HOD', 'PENDING_SUPERVISOR'].includes(studentLeave.status);
        const isLeaveOverride = hasAnyLeave || originalStatus === 'ON_LEAVE';
        if (!isLeaveOverride && updated[studentId]?.status !== 'ON_LEAVE') {
          updated[studentId] = { ...updated[studentId], status, leaveType: '', leaveRequestId: null, leaveStatus: '' };
        }
      });
      return updated;
    });
  };

  const isClassSaved = (classId) => {
    return !!savedClasses[classId];
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
      const hasAnyLeave = st.leave && ['APPROVED', 'PENDING_HOD', 'PENDING_SUPERVISOR'].includes(st.leave.status);
      if (!hasAnyLeave && (!currentData || currentData.status === '')) {
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
      const markedRecords = unmarkedStudents.map(st => {
        const studentId = st.student._id;
        const studentInfo = attendanceData[studentId];
        const studentClasses = matrix.classes.map(c => ({
          timetableSlotId: c._id,
          subjectName: c.subjectName,
          selected: !!selectedSubjects[c._id]
        }));
        return { studentId, status: studentInfo.status, leaveType: studentInfo.leaveType || '', leaveRequestId: studentInfo.leaveRequestId || null, classes: studentClasses };
      });
      await api.post('/attendance/faculty/mark-bulk', {
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

  // ── unmarkedStudents: only includes displayedStudents who haven't been marked yet ──
  const unmarkedStudents = displayedStudents.filter(st => {
    if (isPhD) return !st.record;
    if (!st.record) return true;
    const activeClassIds = matrix.classes.filter(c => !isClassSaved(c._id) && selectedSubjects[c._id]).map(c => c._id);
    if (activeClassIds.length === 0) return false;
    const hasMarkedForActiveClass = activeClassIds.some(cid => {
      const classRec = (st.record.classes || []).find(cc => cc.timetableSlotId === cid);
      return classRec && classRec.selected;
    });
    return !hasMarkedForActiveClass;
  });

  const allClassesSaved = !isPhD && matrix?.classes.length > 0 && matrix.classes.every(c => isClassSaved(c._id));
  const hasUnsavedClasses = !isPhD && matrix?.classes.length > 0 && matrix.classes.some(c => !isClassSaved(c._id));

  if (loadingFilters) return <SkeletonLoader count={1} height={200} />;

  const availableDegreeNames = degreeNames.filter(d => {
    const matchType = d.degreeTypeId?._id === filters.degreeTypeId;
    const matchDept = !user?.departmentId || !d.departmentId?._id || d.departmentId._id === user.departmentId;
    return matchType && matchDept;
  });

  // Derive available degree types from department-filtered degree names
  const departmentDegreeNames = degreeNames.filter(d => {
    return !user?.departmentId || !d.departmentId?._id || d.departmentId._id === user.departmentId;
  });
  const availableDegreeTypes = [...new Map(departmentDegreeNames.filter(d => d.degreeTypeId).map(d => [d.degreeTypeId._id, d.degreeTypeId])).values()];
  const finalLeaveTypes = leaveTypes.length > 0
    ? leaveTypes.map(lt => lt.leaveName)
    : ['Casual Leave', 'Medical Leave', 'Duty Leave', 'Earned Leave', 'Maternity Leave', 'Special Leave'];

  return (
    <div className="mark-attendance-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">
          <ClipboardList size={14} />
          ATTENDANCE
        </div>
        <h2 className="welcome-title">Daily Attendance Register</h2>
        <p className="welcome-subtitle">Filter by criteria to load student roster and mark attendance.</p>
      </div>

      <div className="glass-panel p-xl mb-lg">
        <form onSubmit={handleSearch}>
          <div className="grid-3 mb-lg">
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
                {availableDegreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Degree Name</label>
              <select className="form-input" required value={filters.degreeNameId} onChange={e => setFilters({...filters, degreeNameId: e.target.value})} disabled={!filters.degreeTypeId}>
                <option value="">Select Degree...</option>
                {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-3 mb-sm" style={{ alignItems: 'end' }}>
            {!isPhD && (
              <div className="form-group mb-sm">
                <label className="form-label">Semester</label>
                <select className="form-input" required value={filters.semesterId} onChange={e => setFilters({...filters, semesterId: e.target.value})} disabled={!filters.degreeTypeId}>
                  <option value="">Select Semester...</option>
                  {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group mb-sm">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" required value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary w-full" style={{ height: '46px' }}>
                <Search size={16} /> Fetch Roster
              </button>
            </div>
          </div>
        </form>
      </div>

      {loadingMatrix ? (
        <div className="mt-lg"><SkeletonLoader count={5} height={60} /></div>
      ) : matrix ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
          <AnimatePresence>
            {matrix.isLocked && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel p-lg mb-lg" style={{ borderLeft: '4px solid var(--status-warning)' }}>
                <div className="flex items-center gap-md">
                  <Lock size={20} style={{ color: 'var(--status-warning)' }} />
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Register Locked (Policy Enforcement)</span>
                    <p className="text-sm text-muted" style={{ marginTop: '4px' }}>The 48-hour editing window has expired. Student attendance records cannot be changed.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Partial Mapping Warning Banner ── */}
          {hasPartialMapping && (
            <div className="glass-panel p-lg mb-lg" style={{ borderLeft: '4px solid var(--status-warning)' }}>
              <div className="flex items-center gap-md">
                <AlertTriangle size={20} style={{ color: '#D97706', flexShrink: 0 }} />
                <div>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>Partial Student Mapping Detected</span>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    The selected subjects have <strong>different sets of students</strong> mapped to them. Please select subjects individually. Multiple subjects can only be selected together when they share the same mapped students.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isPhD && matrix.classes.length > 0 && (
            <div className="glass-panel p-xl mb-lg">
              <div className="flex justify-between items-center mb-lg">
                <h3 className="flex items-center gap-sm" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
                  Select Scheduled Courses for Register
                </h3>
                <div className="flex gap-sm">
                  <button type="button" className="btn btn-sm btn-outline" onClick={handleSelectAllSubjects}>Select All</button>
                  <button type="button" className="btn btn-sm btn-outline" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }} onClick={() => {
                    const updated = {};
                    matrix.classes.forEach(c => { updated[c._id] = false; });
                    setSelectedSubjects(updated);
                  }}>Deselect All</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {matrix.classes.map((c, idx) => {
                  const isSaved = isClassSaved(c._id);
                  const isChecked = !isSaved && !!selectedSubjects[c._id];
                  return (
                    <motion.div key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                      onClick={() => handleSubjectToggle(c._id)}
                      className="glass-card" style={{ padding: '14px 16px', cursor: (matrix.isLocked || isSaved) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '12px', opacity: isSaved ? 0.6 : 1, border: isChecked ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.2)' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: isChecked ? 'none' : '2px solid var(--color-border-solid)', background: isChecked ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isChecked && <Check size={14} color="#fff" strokeWidth={3} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{c.subjectName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Code: {c.subjectCode}</div>
                        <div className="flex items-center gap-xs" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          <Clock size={12} /> {c.startTime} - {c.endTime}
                        </div>
                        {c.facultyId?.name && (
                          <div className="flex items-center gap-xs" style={{ fontSize: '0.7rem', color: '#818CF8', marginTop: '4px', fontWeight: 500 }}>
                            👤 {c.facultyId.name}
                          </div>
                        )}
                      </div>
                      {isSaved && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Marked</span>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {!isPhD && matrix.classes.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-xl mb-lg" style={{ textAlign: 'center', borderLeft: '4px solid var(--status-warning)' }}>
              <div style={{ marginBottom: '12px' }}>
                <Clock size={40} style={{ margin: '0 auto', color: 'var(--status-warning)', opacity: 0.7 }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                No Classes Scheduled
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                No classes are scheduled on <strong style={{ color: 'var(--color-text-primary)' }}>{new Date(filters.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> ({new Date(filters.date).toLocaleDateString('en-IN', { weekday: 'long' })}).
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                Please select a different date to mark attendance.
              </p>
            </motion.div>
          )}

          {isPhD && matrix.students.length > 0 && unmarkedStudents.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-xl mb-lg" style={{ textAlign: 'center', borderLeft: '4px solid var(--status-present)' }}>
              <div style={{ marginBottom: '12px' }}>
                <Check size={40} style={{ margin: '0 auto', color: 'var(--status-present)', opacity: 0.7 }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Attendance Already Marked
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                Attendance has already been marked for <strong style={{ color: 'var(--color-text-primary)' }}>{new Date(filters.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> ({new Date(filters.date).toLocaleDateString('en-IN', { weekday: 'long' })}).
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                All students have been marked for this date.
              </p>
            </motion.div>
          )}

          {!isPhD && allClassesSaved && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-xl mb-lg" style={{ textAlign: 'center', borderLeft: '4px solid var(--status-present)' }}>
              <div style={{ marginBottom: '12px' }}>
                <Check size={40} style={{ margin: '0 auto', color: 'var(--status-present)', opacity: 0.7 }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Attendance Already Marked
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                Attendance for all the classes scheduled on <strong style={{ color: 'var(--color-text-primary)' }}>{new Date(filters.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> ({new Date(filters.date).toLocaleDateString('en-IN', { weekday: 'long' })}) has already been marked.
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                All students have been marked for the scheduled course(s) on this date.
              </p>
            </motion.div>
          )}

          {((!isPhD && hasUnsavedClasses) || (isPhD && matrix.students.length > 0)) && unmarkedStudents.length > 0 && (
            <div className="glass-panel p-lg mb-lg">
              <div className="flex justify-between items-center flex-wrap gap-md">
                <div className="flex items-center gap-sm" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  <Users size={18} style={{ color: 'var(--color-primary)' }} />
                  Unmarked Candidates: <strong style={{ color: 'var(--color-text-primary)' }}>{unmarkedStudents.length}</strong>
                </div>
                {!matrix.isLocked && unmarkedStudents.length > 0 && (
                  <div className="flex items-center gap-sm flex-wrap">
                    <span className="text-sm text-muted">Apply Status to All:</span>
                    <button type="button" className="btn btn-sm" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-present)', border: '1px solid rgba(16, 185, 129, 0.2)' }} onClick={() => applyStatusToAll('PRESENT')}>Present</button>
                    <button type="button" className="btn btn-sm" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--status-absent)', border: '1px solid rgba(239, 68, 68, 0.15)' }} onClick={() => applyStatusToAll('ABSENT')}>Absent</button>
                    <button type="button" className="btn btn-sm" style={{ background: 'rgba(107, 114, 128, 0.08)', color: 'var(--color-text-muted)', border: '1px solid rgba(107, 114, 128, 0.12)' }} onClick={() => applyStatusToAll('NOT_APPLICABLE')}>N/A</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {((!isPhD && hasUnsavedClasses) || (isPhD && matrix.students.length > 0)) && unmarkedStudents.length > 0 && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th style={{ width: '110px' }}>Sh. No.</th>
                    <th>Student Name</th>
                    <th>Father's Name</th>
                    <th style={{ width: '360px' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unmarkedStudents.map((st, sIdx) => {
                    const studentId = st.student._id;
                    const currentData = attendanceData[studentId] || { status: '', leaveType: '', leaveRequestId: null, leaveStatus: '' };
                    const isLeave = currentData.status === 'ON_LEAVE';
                    const isPendingLeave = st.leave && ['PENDING_HOD', 'PENDING_SUPERVISOR'].includes(st.leave.status);
                    const isApprovedLeave = st.leave && st.leave.status === 'APPROVED';
                    const hasAnyLeave = st.leave && ['APPROVED', 'PENDING_HOD', 'PENDING_SUPERVISOR'].includes(st.leave.status);
                    return (
                      <motion.tr key={studentId} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(sIdx * 0.03, 0.5) }} style={isPendingLeave ? { background: 'rgba(255, 193, 7, 0.08)' } : {}}>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>{sIdx + 1}</td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{st.student.profile?.shNo || 'N/A'}</td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{st.student.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{st.student.username}</div>
                            {isLeave && (
                              <span className="badge badge-leave" style={{ fontSize: '0.62rem', marginTop: '4px', display: 'inline-flex' }}>
                                <AlertTriangle size={10} />
                                {isApprovedLeave ? 'Approved Leave' : 'Manual Leave'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{st.student.profile?.fatherName || '—'}</td>
                        <td>
                          <div className="flex gap-xs flex-wrap">
                            <button type="button" disabled={matrix.isLocked || hasAnyLeave} onClick={() => handleStatusChange(studentId, 'PRESENT', { leaveType: '', leaveRequestId: null })} className={`status-toggle-btn ${currentData.status === 'PRESENT' ? 'selected-present' : ''}`}>Present</button>
                            <button type="button" disabled={matrix.isLocked || hasAnyLeave} onClick={() => handleStatusChange(studentId, 'ABSENT', { leaveType: '', leaveRequestId: null })} className={`status-toggle-btn ${currentData.status === 'ABSENT' ? 'selected-absent' : ''}`}>Absent</button>
                            <button type="button" disabled={matrix.isLocked || hasAnyLeave} onClick={() => handleStatusChange(studentId, 'NOT_APPLICABLE', { leaveType: '', leaveRequestId: null })} className={`status-toggle-btn ${currentData.status === 'NOT_APPLICABLE' ? 'selected-na' : ''}`} style={{ background: currentData.status === 'NOT_APPLICABLE' ? 'var(--color-text-muted)' : 'transparent', color: currentData.status === 'NOT_APPLICABLE' ? '#fff' : 'inherit' }}>N/A</button>
                            {st.leave ? (
                              isApprovedLeave ? (
                                <span className="badge badge-leave">Leave - {st.leave.leaveType}</span>
                              ) : (
                                <span className="badge" style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(255, 193, 7, 0.15)', color: '#b7791f', border: '1px solid rgba(255, 193, 7, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <AlertTriangle size={12} /> Leave Applied
                                </span>
                              )
                            ) : (
                              currentData.status === 'ON_LEAVE' ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <button type="button" disabled={matrix.isLocked} onClick={() => setOpenLeaveDropdownStudentId(openLeaveDropdownStudentId === studentId ? null : studentId)} className="badge badge-leave">Leave - {currentData.leaveType || finalLeaveTypes[0]} <ChevronDown size={12} /></button>
                                  {openLeaveDropdownStudentId === studentId && (
                                    <>
                                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 105 }} onClick={() => setOpenLeaveDropdownStudentId(null)} />
                                      <div className="glass-card" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', minWidth: '180px', zIndex: 110, padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {finalLeaveTypes.map(ltName => (
                                          <button key={ltName} type="button" onClick={() => { handleStatusChange(studentId, 'ON_LEAVE', { leaveType: ltName, leaveRequestId: null }); setOpenLeaveDropdownStudentId(null); }} className="text-sm" style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'left', color: currentData.leaveType === ltName ? 'var(--color-primary)' : 'var(--color-text-primary)', background: currentData.leaveType === ltName ? 'rgba(var(--color-primary-rgb), 0.06)' : 'transparent', fontWeight: currentData.leaveType === ltName ? 600 : 400 }}>{ltName}</button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <button type="button" disabled={matrix.isLocked} onClick={() => handleStatusChange(studentId, 'ON_LEAVE', { leaveType: finalLeaveTypes[0], leaveRequestId: null })} className={`status-toggle-btn ${currentData.status === 'ON_LEAVE' ? 'selected-leave' : ''}`}>Leave</button>
                              )
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {matrix.classes.length > 0 && unmarkedStudents.length === 0 && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th style={{ width: '110px' }}>Sh. No.</th>
                    <th>Student Name</th>
                    <th>Father's Name</th>
                    <th style={{ width: '360px' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ color: 'var(--color-text-muted)' }}>
                        <Check size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                        No unmarked students found matching this criteria.
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {unmarkedStudents.length > 0 && (isPhD || hasUnsavedClasses) && (
            <div className="flex justify-end mt-lg">
              <button type="button" className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving || matrix.isLocked}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <ClipboardList size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Please select a criteria and date above to load the attendance register roster.</p>
        </div>
      )}
    </div>
  );
};

export default MarkAttendanceTab;