import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Save, Search, CheckSquare, Square, AlertTriangle, Lock, ClipboardList, History } from 'lucide-react';
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
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: { status, leaveType, leaveRequestId } }
  const [selectedSubjects, setSelectedSubjects] = useState({}); // { slotId: bool }
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [openLeaveDropdownStudentId, setOpenLeaveDropdownStudentId] = useState(null);
  
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);

  const [historyFilters, setHistoryFilters] = useState({ sessionId: '', degreeTypeId: '', degreeNameId: '', semesterId: '', timetableSlotId: '', date: new Date().toISOString().split('T')[0] });
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStatus, setEditingStatus] = useState({ status: '', leaveType: '', leaveRequestId: null });
  const [historyClasses, setHistoryClasses] = useState([]);
  const [openHistoryLeaveDropdownStudentId, setOpenHistoryLeaveDropdownStudentId] = useState(null);

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

  // Load faculty classes for the history search dropdown
  const fetchFacultyClasses = async () => {
    try {
      const res = await api.get('/attendance/timetables/faculty');
      setHistoryClasses(res.data);
    } catch (err) {
      console.error('Failed to load faculty timetables', err);
    }
  };

  useEffect(() => {
    fetchFacultyClasses();
  }, [api]);

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
            initialSelectedSubjects[c._id] = true; // default all to checked
          }
        }
      });
      setSelectedSubjects(initialSelectedSubjects);

      // Initialize local state for the grid
      const initialData = {};
      res.data.students.forEach(st => {
        const existingRecord = st.record;
        const leaveInfo = st.leave;
        
        let initialStatus = ''; // Default status is empty (no default)
        let initialLeaveType = '';
        let initialLeaveRequestId = null;

        if (existingRecord) {
          const isApprovedLeave = (leaveInfo && leaveInfo.status === 'APPROVED') || existingRecord.status === 'ON_LEAVE';
          if (isApprovedLeave) {
            initialStatus = 'ON_LEAVE';
            initialLeaveType = existingRecord.leaveType || leaveInfo?.leaveType || '';
            initialLeaveRequestId = existingRecord.leaveRequestId || leaveInfo?._id || null;
          } else {
            initialStatus = ''; // Force empty so faculty has to mark them
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
        // Don't override approved leave
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

  const handleSearchHistory = async () => {
    if (!historyFilters.sessionId) {
      return toast.error('Please select a session to search attendance records.');
    }
    if (!historyFilters.degreeTypeId) {
      return toast.error('Please select a degree type to search attendance records.');
    }
    if (!historyFilters.degreeNameId) {
      return toast.error('Please select a degree name to search attendance records.');
    }
    const historyDegreeType = degreeTypes.find(d => d._id === historyFilters.degreeTypeId);
    const isHistoryPhD = historyDegreeType?.code?.toUpperCase() === 'PHD';
    if (!isHistoryPhD && !historyFilters.semesterId) {
      return toast.error('Please select a semester to search attendance records.');
    }
    if (!historyFilters.date) {
      return toast.error('Please select a date to search attendance records.');
    }
    if (!historyFilters.timetableSlotId && !isHistoryPhD) {
      return toast.error('Please select a subject to search attendance records.');
    }

    setHistoryLoading(true);
    try {
      const queryParams = new URLSearchParams({
        sessionId: historyFilters.sessionId,
        timetableSlotId: historyFilters.timetableSlotId || '',
        date: historyFilters.date
      });
      const res = await api.get(`/attendance/faculty/marked?${queryParams.toString()}`);
      setHistoryList(res.data);
    } catch (err) {
      toast.error('Failed to retrieve marked attendance history');
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdateHistoryEntry = async (record) => {
    try {
      const updatedRecordPayload = {
        studentId: record.studentId?._id,
        status: editingStatus.status,
        leaveType: editingStatus.leaveType || '',
        leaveRequestId: editingStatus.leaveRequestId || null,
        classes: record.classes
      };

      await api.post(`/attendance/faculty/mark-bulk`, {
        sessionId: record.sessionId,
        degreeTypeId: record.degreeTypeId,
        degreeNameId: record.degreeNameId,
        semesterId: record.semesterId,
        date: historyFilters.date,
        records: [updatedRecordPayload]
      });

      toast.success('Attendance updated successfully');
      setEditingStudentId(null);
      
      // Refresh list
      handleSearchHistory();
      
      // Refresh top register matrix too
      if (matrix) {
        const queryParams = new URLSearchParams({
          sessionId: filters.sessionId,
          degreeTypeId: filters.degreeTypeId,
          degreeNameId: filters.degreeNameId,
          semesterId: isPhD ? '' : filters.semesterId,
          date: filters.date
        });
        const res = await api.get(`/attendance/faculty/matrix?${queryParams.toString()}`);
        setMatrix(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    }
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

    // Validation 1: At least one class must be selected (non-PhD only)
    if (!isPhD && matrix.classes.length > 0) {
      const hasSelectedClass = Object.values(selectedSubjects).some(v => v === true);
      if (!hasSelectedClass) {
        return toast.error('Please select at least one scheduled course from the course selector above before saving attendance.');
      }
    }

    // Validation 2: Attendance status must be marked for ALL students in the grid
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

      if (historyFilters.timetableSlotId) {
        handleSearchHistory();
      }
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

  const combinedClasses = [];
  const addedIds = new Set();
  if (matrix?.classes) {
    matrix.classes.forEach(c => {
      combinedClasses.push(c);
      addedIds.add(c._id);
    });
  }
  historyClasses.forEach(c => {
    if (!addedIds.has(c._id)) {
      combinedClasses.push(c);
      addedIds.add(c._id);
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <style>{`
        .hover-bg-select:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .att-section-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .att-section-topbar {
          height: 4px;
          width: 100%;
        }
        .att-section-topbar-mark {
          background: linear-gradient(90deg, #10B981 0%, #06B6D4 50%, #3B82F6 100%);
        }
        .att-section-topbar-history {
          background: linear-gradient(90deg, #8B5CF6 0%, #A855F7 50%, #6366F1 100%);
        }
        .att-section-header {
          padding: 24px 32px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .att-section-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .att-section-icon-mark {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.12));
          color: #34D399;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
        }
        .att-section-icon-history {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.12));
          color: #A78BFA;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
        }
        .att-section-body {
          padding: 24px 32px 32px;
        }
        .att-filter-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          align-items: end;
        }
        .att-filter-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 16px;
          align-items: end;
          margin-top: 16px;
        }
      `}</style>

      {/* ============================================ */}
      {/* SECTION 1: Daily Attendance Register */}
      {/* ============================================ */}
      <div className="att-section-card">
        <div className="att-section-topbar att-section-topbar-mark" />
        <div className="att-section-header">
          <div className="att-section-icon att-section-icon-mark">
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '3px', fontSize: '1.2rem', fontWeight: 700 }}>Daily Attendance Register</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, opacity: 0.8 }}>Filter by criteria to load student roster and mark attendance.</p>
          </div>
        </div>
        <div className="att-section-body">

      <form onSubmit={handleSearch}>
        <div className="att-filter-grid">
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
        </div>

        <div className="att-filter-grid-2">
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

          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', whiteSpace: 'nowrap' }}>
            <Search size={18} style={{ marginRight: '8px' }} /> Fetch Roster
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

          {/* Scheduled Timetabled Courses Selection Section */}
          {!isPhD && matrix.classes.length > 0 && (
            <div className="mb-lg p-md" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div className="mb-sm flex justify-between items-center" style={{ gap: '16px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                  Select Scheduled Courses for Register
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
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
                    style={{ padding: '4px 12px', fontSize: '0.75rem', borderColor: '#EF4444', color: '#EF4444' }}
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
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginTop: '12px' }}>
                {matrix.classes.map(c => {
                  const isSaved = isClassSaved(c._id);
                  const isChecked = !isSaved && !!selectedSubjects[c._id];
                  return (
                    <div
                      key={c._id}
                      onClick={() => {
                        if (matrix.isLocked || isSaved) return;
                        setSelectedSubjects(prev => ({ ...prev, [c._id]: !isChecked }));
                      }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: isSaved
                          ? '1px dashed rgba(255, 255, 255, 0.15)'
                          : isChecked
                          ? '1px solid var(--color-primary)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSaved
                          ? 'rgba(255, 255, 255, 0.02)'
                          : isChecked
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(255, 255, 255, 0.01)',
                        cursor: (matrix.isLocked || isSaved) ? 'not-allowed' : 'pointer',
                        opacity: isSaved ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s',
                        boxShadow: isChecked ? '0 0 8px rgba(16, 185, 129, 0.2)' : 'none'
                      }}
                      className={isSaved ? "" : "hover-bg-select"}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={matrix.isLocked || isSaved}
                        readOnly
                        style={{ width: '18px', height: '18px', cursor: (matrix.isLocked || isSaved) ? 'not-allowed' : 'pointer' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span style={{ fontSize: '0.85rem', color: isSaved ? 'var(--text-muted)' : isChecked ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                            {c.subjectName}
                          </span>
                          {isSaved && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 'bold' }}>
                              Marked
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Code: {c.subjectCode}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          ⏰ {c.startTime} - {c.endTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-md" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Unmarked Candidates: <strong style={{ color: 'var(--text-primary)' }}>{unmarkedStudents.length}</strong></span>
            </div>
            {!matrix.isLocked && unmarkedStudents.length > 0 && (
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
                  <th style={{ width: '60px', textAlign: 'center' }}>S. No.</th>
                  <th style={{ width: '140px' }}>Sh. No.</th>
                  <th>Student Name</th>
                  <th>Father's Name</th>
                  <th style={{ textAlign: 'center', width: '380px' }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {unmarkedStudents.map((st, sIdx) => {
                  const studentId = st.student._id;
                  const currentData = attendanceData[studentId] || { status: '', leaveType: '', leaveRequestId: null };
                  
                  // Setup row background colors:
                  // ON_LEAVE gets subtle background
                  const isLeave = currentData.status === 'ON_LEAVE';
                  
                  let rowBackground = 'transparent';
                  if (isLeave) {
                    rowBackground = 'rgba(59, 130, 246, 0.03)';
                  }

                  return (
                    <motion.tr 
                      key={studentId} 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: Math.min(sIdx * 0.05, 0.5) }}
                      style={{ background: rowBackground }}
                    >
                      <td style={{ textAlign: 'center' }}>{sIdx + 1}</td>
                      <td>{st.student.profile?.shNo || 'N/A'}</td>
                      <td>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{st.student.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{st.student.username}</div>
                        {isLeave && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginTop: '4px', display: 'inline-block' }}>
                            {st.leave?.status === 'APPROVED' ? 'Approved Leave' : 'Manual Leave'}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{st.student.profile?.fatherName || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px', gap: '8px', position: 'relative' }}>
                          
                          {/* Present Button */}
                          <button
                            type="button"
                            disabled={matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')}
                            onClick={() => handleStatusChange(studentId, 'PRESENT', { leaveType: '', leaveRequestId: null })}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: (matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')) ? 'not-allowed' : 'pointer',
                              background: currentData.status === 'PRESENT' ? '#10B981' : 'transparent',
                              color: currentData.status === 'PRESENT' ? '#fff' : 'var(--text-secondary)',
                              fontWeight: currentData.status === 'PRESENT' ? 'bold' : 'normal',
                              transition: 'all 0.2s'
                            }}
                          >
                            Present
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            disabled={matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')}
                            onClick={() => handleStatusChange(studentId, 'ABSENT', { leaveType: '', leaveRequestId: null })}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: (matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')) ? 'not-allowed' : 'pointer',
                              background: currentData.status === 'ABSENT' ? '#EF4444' : 'transparent',
                              color: currentData.status === 'ABSENT' ? '#fff' : 'var(--text-secondary)',
                              fontWeight: currentData.status === 'ABSENT' ? 'bold' : 'normal',
                              transition: 'all 0.2s'
                            }}
                          >
                            Absent
                          </button>

                          {/* N/A Button */}
                          <button
                            type="button"
                            disabled={matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')}
                            onClick={() => handleStatusChange(studentId, 'NOT_APPLICABLE', { leaveType: '', leaveRequestId: null })}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: (matrix.isLocked || (st.leave && st.leave.status === 'APPROVED')) ? 'not-allowed' : 'pointer',
                              background: currentData.status === 'NOT_APPLICABLE' ? '#3B82F6' : 'transparent',
                              color: currentData.status === 'NOT_APPLICABLE' ? '#fff' : 'var(--text-secondary)',
                              fontWeight: currentData.status === 'NOT_APPLICABLE' ? 'bold' : 'normal',
                              transition: 'all 0.2s'
                            }}
                          >
                            N/A
                          </button>

                          {/* Leave options and dropdown */}
                          {st.leave ? (
                            st.leave.status === 'APPROVED' ? (
                              // Verified Approved Leave (Red box)
                              <div
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.25)',
                                  border: '1px solid #ef4444',
                                  color: '#f87171',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                Leave - {st.leave.leaveType}
                              </div>
                            ) : (
                              // Unverified Pending Leave (Orange box with warning)
                              <div
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  borderRadius: '6px',
                                  background: 'rgba(249, 115, 22, 0.25)',
                                  border: '1px solid #f97316',
                                  color: '#fb923c',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>⚠️ Leave - {st.leave.leaveType}</span>
                              </div>
                            )
                          ) : (
                            currentData.status === 'ON_LEAVE' ? (
                              // Active dropdown state for manual leave (unverified -> orange with warning)
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  type="button"
                                  disabled={matrix.isLocked}
                                  onClick={() => setOpenLeaveDropdownStudentId(openLeaveDropdownStudentId === studentId ? null : studentId)}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.75rem',
                                    borderRadius: '6px',
                                    background: 'rgba(249, 115, 22, 0.25)',
                                    border: '1px solid #f97316',
                                    color: '#fb923c',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <span>⚠️ Leave - {currentData.leaveType || finalLeaveTypes[0]}</span>
                                  <span style={{ fontSize: '0.7rem' }}>▼</span>
                                </button>
                                
                                {openLeaveDropdownStudentId === studentId && (
                                  <>
                                    <div 
                                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 105 }} 
                                      onClick={() => setOpenLeaveDropdownStudentId(null)}
                                    />
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        zIndex: 110,
                                        background: '#1e1e2e',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                        padding: '6px',
                                        minWidth: '180px',
                                        marginTop: '4px'
                                      }}
                                    >
                                      {finalLeaveTypes.map(ltName => (
                                        <button
                                          key={ltName}
                                          type="button"
                                          onClick={() => {
                                            handleStatusChange(studentId, 'ON_LEAVE', { leaveType: ltName, leaveRequestId: null });
                                            setOpenLeaveDropdownStudentId(null);
                                          }}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontSize: '0.75rem',
                                            textAlign: 'left',
                                            background: currentData.leaveType === ltName ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                                            color: currentData.leaveType === ltName ? '#fb923c' : 'var(--text-primary)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                          }}
                                          className="hover-bg-select"
                                        >
                                          {ltName}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              // Default inactive Leave button (click to set leave status)
                              <button
                                type="button"
                                disabled={matrix.isLocked}
                                onClick={() => handleStatusChange(studentId, 'ON_LEAVE', { leaveType: finalLeaveTypes[0], leaveRequestId: null })}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: matrix.isLocked ? 'not-allowed' : 'pointer',
                                  background: 'transparent',
                                  color: 'var(--text-secondary)',
                                  fontWeight: 'normal',
                                  transition: 'all 0.2s'
                                }}
                              >
                                Leave
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {unmarkedStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No unmarked students found matching this criteria.
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
              disabled={saving || matrix.isLocked || unmarkedStudents.length === 0}
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
        </div>{/* end section-body */}
      </div>{/* end section-card (mark attendance) */}

      {/* ============================================ */}
      {/* SECTION 2: Marked Attendance Records & Editor */}
      {/* ============================================ */}
      <div className="section-card">
        <div className="section-header section-header-history">
          <div className="section-icon section-icon-history">
            <History size={22} />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '2px', fontSize: '1.25rem' }}>Marked Attendance Records &amp; Editor</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Search and manage previously saved student attendance logs.</p>
          </div>
        </div>
        <div className="section-body">

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'end' }} className="mb-md">
        <div className="form-group">
          <label className="form-label">Session</label>
          <select className="form-input" value={historyFilters.sessionId} onChange={e => setHistoryFilters({ ...historyFilters, sessionId: e.target.value })}>
            <option value="">Select Session...</option>
            {sessions.map(s => <option key={s._id} value={s._id}>{s.sessionName}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Degree Type</label>
          <select className="form-input" value={historyFilters.degreeTypeId} onChange={e => setHistoryFilters({ ...historyFilters, degreeTypeId: e.target.value, degreeNameId: '', semesterId: '', timetableSlotId: '' })}>
            <option value="">Select Degree Type...</option>
            {degreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Degree Name</label>
          <select className="form-input" value={historyFilters.degreeNameId} onChange={e => setHistoryFilters({ ...historyFilters, degreeNameId: e.target.value })} disabled={!historyFilters.degreeTypeId}>
            <option value="">Select Degree...</option>
            {degreeNames.filter(d => d.degreeTypeId?._id === historyFilters.degreeTypeId).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }} className="mb-lg">
        {(() => {
          const historyDegreeType = degreeTypes.find(d => d._id === historyFilters.degreeTypeId);
          const isHistoryPhD = historyDegreeType?.code?.toUpperCase() === 'PHD';
          return (
            <div className="form-group">
              <label className="form-label">{isHistoryPhD ? 'Semester (N/A)' : 'Semester'}</label>
              <select 
                className="form-input" 
                value={historyFilters.semesterId} 
                onChange={e => setHistoryFilters({ ...historyFilters, semesterId: e.target.value })}
                disabled={!historyFilters.degreeTypeId || isHistoryPhD}
                style={{ opacity: isHistoryPhD ? 0.3 : 1 }}
              >
                <option value="">{isHistoryPhD ? 'N/A' : 'Select Semester...'}</option>
                {!isHistoryPhD && semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          );
        })()}

        <div className="form-group">
          <label className="form-label">Date</label>
          <input 
            type="date" 
            className="form-input" 
            value={historyFilters.date} 
            onChange={e => setHistoryFilters({ ...historyFilters, date: e.target.value, timetableSlotId: '' })} 
            max={new Date().toISOString().split('T')[0]} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subject</label>
          <select 
            className="form-input" 
            value={historyFilters.timetableSlotId} 
            onChange={e => setHistoryFilters({ ...historyFilters, timetableSlotId: e.target.value })}
            disabled={!historyFilters.date}
          >
            <option value="">{historyFilters.date ? 'Select Subject...' : 'Select a date first...'}</option>
            {(() => {
              if (!historyFilters.date) return null;
              const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(historyFilters.date).getDay()];
              return combinedClasses
                .filter(c => c.dayOfWeek === dayName)
                .map(c => (
                  <option key={c._id} value={c._id}>
                    {c.subjectName} ({c.subjectCode}) — {c.startTime} - {c.endTime}
                  </option>
                ));
            })()}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSearchHistory} 
            style={{ padding: '10px 24px', width: '100%' }}
          >
            <Search size={18} style={{ marginRight: '8px' }} /> Search Logs
          </button>
        </div>
      </div>

      {historyLoading ? (
        <SkeletonLoader count={3} height={60} />
      ) : historyList.length > 0 ? (
        <div className="data-table-wrapper" style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>S. No.</th>
                <th style={{ width: '140px' }}>Sh. No.</th>
                <th>Student Name</th>
                <th>Father's Name</th>
                <th style={{ textAlign: 'center', width: '380px' }}>Attendance Status</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((record, hIdx) => {
                const isEditing = editingStudentId === record.studentId?._id;
                return (
                  <tr key={record._id}>
                    <td style={{ textAlign: 'center' }}>{hIdx + 1}</td>
                    <td>{record.studentId?.profile?.shNo || 'N/A'}</td>
                    <td>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{record.studentId?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{record.studentId?.username}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{record.studentId?.profile?.fatherName || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px', gap: '8px', position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setEditingStatus({ ...editingStatus, status: 'PRESENT', leaveType: '', leaveRequestId: null })}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: editingStatus.status === 'PRESENT' ? '#10B981' : 'transparent',
                              color: editingStatus.status === 'PRESENT' ? '#fff' : 'var(--text-secondary)',
                              fontWeight: editingStatus.status === 'PRESENT' ? 'bold' : 'normal',
                              transition: 'all 0.2s'
                            }}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStatus({ ...editingStatus, status: 'ABSENT', leaveType: '', leaveRequestId: null })}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: editingStatus.status === 'ABSENT' ? '#EF4444' : 'transparent',
                              color: editingStatus.status === 'ABSENT' ? '#fff' : 'var(--text-secondary)',
                              fontWeight: editingStatus.status === 'ABSENT' ? 'bold' : 'normal',
                              transition: 'all 0.2s'
                            }}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStatus({ ...editingStatus, status: 'NOT_APPLICABLE', leaveType: '', leaveRequestId: null })}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: editingStatus.status === 'NOT_APPLICABLE' ? '#3B82F6' : 'transparent',
                              color: editingStatus.status === 'NOT_APPLICABLE' ? '#fff' : 'var(--text-secondary)',
                              fontWeight: editingStatus.status === 'NOT_APPLICABLE' ? 'bold' : 'normal',
                              transition: 'all 0.2s'
                            }}
                          >
                            N/A
                          </button>
                          
                          {/* Leave Dropdown in editing mode */}
                          {editingStatus.status === 'ON_LEAVE' ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                type="button"
                                onClick={() => setOpenHistoryLeaveDropdownStudentId(openHistoryLeaveDropdownStudentId === record.studentId?._id ? null : record.studentId?._id)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  borderRadius: '6px',
                                  background: 'rgba(249, 115, 22, 0.25)',
                                  border: '1px solid #f97316',
                                  color: '#fb923c',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>⚠️ Leave - {editingStatus.leaveType || finalLeaveTypes[0]}</span>
                                <span style={{ fontSize: '0.7rem' }}>▼</span>
                              </button>
                              {openHistoryLeaveDropdownStudentId === record.studentId?._id && (
                                <>
                                  <div 
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 105 }} 
                                    onClick={() => setOpenHistoryLeaveDropdownStudentId(null)}
                                  />
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      right: 0,
                                      zIndex: 110,
                                      background: '#1e1e2e',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                      padding: '6px',
                                      minWidth: '180px',
                                      marginTop: '4px'
                                    }}
                                  >
                                    {finalLeaveTypes.map(ltName => (
                                      <button
                                        key={ltName}
                                        type="button"
                                        onClick={() => {
                                          setEditingStatus({
                                            ...editingStatus,
                                            status: 'ON_LEAVE',
                                            leaveType: ltName,
                                            leaveRequestId: null
                                          });
                                          setOpenHistoryLeaveDropdownStudentId(null);
                                        }}
                                        style={{
                                          display: 'block',
                                          width: '100%',
                                          padding: '8px 12px',
                                          fontSize: '0.75rem',
                                          textAlign: 'left',
                                          background: editingStatus.leaveType === ltName ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                                          color: editingStatus.leaveType === ltName ? '#fb923c' : 'var(--text-primary)',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          transition: 'background 0.2s'
                                        }}
                                        className="hover-bg-select"
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
                              onClick={() => setEditingStatus({
                                status: 'ON_LEAVE',
                                leaveType: finalLeaveTypes[0],
                                leaveRequestId: null
                              })}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                fontWeight: 'normal',
                                transition: 'all 0.2s'
                              }}
                            >
                              Leave
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className={`badge ${
                          record.status === 'PRESENT' ? 'badge-success' :
                          record.status === 'ABSENT' ? 'badge-danger' :
                          record.status === 'ON_LEAVE' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {record.status === 'ON_LEAVE' ? `Leave - ${record.leaveType}` : record.status}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-success" 
                            onClick={() => handleUpdateHistoryEntry(record)}
                            style={{ padding: '4px 8px' }}
                          >
                            Update
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline" 
                            onClick={() => setEditingStudentId(null)}
                            style={{ padding: '4px 8px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline" 
                            onClick={() => {
                              setEditingStudentId(record.studentId?._id);
                              setEditingStatus({
                                status: record.status,
                                leaveType: record.leaveType || '',
                                leaveRequestId: record.leaveRequestId || null
                              });
                            }}
                            style={{ padding: '4px 8px' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="clay-card p-lg text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
          No attendance history logs found for this search.
        </div>
      )}
        </div>{/* end section-body */}
      </div>{/* end section-card (history) */}
    </div>
  );
};

export default MarkAttendanceTab;
