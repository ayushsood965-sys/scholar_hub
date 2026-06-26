import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Search, History, Save, ChevronDown, X, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';
import './MarkAttendanceTab.css';

const AttendanceRecordsTab = () => {
  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  const [historyFilters, setHistoryFilters] = useState({
    sessionId: '',
    degreeTypeId: '',
    degreeNameId: '',
    semesterId: '',
    timetableSlotId: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStatus, setEditingStatus] = useState({ status: '', leaveType: '', leaveRequestId: null });
  const [historyClasses, setHistoryClasses] = useState([]);
  const [openHistoryLeaveDropdownStudentId, setOpenHistoryLeaveDropdownStudentId] = useState(null);

  const api = useApi();
  const toast = useToast();

  // Load master dropdown data
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

  // Load faculty timetables for subject dropdown
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

  const finalLeaveTypes = leaveTypes.length > 0
    ? leaveTypes.map(lt => lt.leaveName)
    : ['Casual Leave', 'Medical Leave', 'Duty Leave', 'Earned Leave', 'Maternity Leave', 'Special Leave'];

  // Combined classes for subject dropdown
  const combinedClasses = [...historyClasses];

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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  if (loadingFilters) return <SkeletonLoader count={1} height={200} />;

  return (
    <div className="att-container">
      <div className="att-glass-card">
        <div className="att-top-bar att-top-bar-history" />
        <div className="att-card-header">
          <div className="att-card-icon att-card-icon-history">
            <History size={24} />
          </div>
          <div>
            <h2 className="att-card-title">Marked Attendance Records &amp; Editor</h2>
            <p className="att-card-subtitle">Search and manage previously saved student attendance logs.</p>
          </div>
        </div>
        <div className="att-card-body">

          {/* ─── History Filters ─── */}
          <div className="att-filters-wrapper">
            <div className="att-filter-grid">
              <div className="att-filter-group">
                <label className="att-filter-label">Session</label>
                <select className="att-filter-select" value={historyFilters.sessionId} onChange={e => setHistoryFilters({ ...historyFilters, sessionId: e.target.value })}>
                  <option value="">Select Session...</option>
                  {sessions.map(s => <option key={s._id} value={s._id}>{s.sessionName}</option>)}
                </select>
              </div>

              <div className="att-filter-group">
                <label className="att-filter-label">Degree Type</label>
                <select className="att-filter-select" value={historyFilters.degreeTypeId} onChange={e => setHistoryFilters({ ...historyFilters, degreeTypeId: e.target.value, degreeNameId: '', semesterId: '', timetableSlotId: '' })}>
                  <option value="">Select Degree Type...</option>
                  {degreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              <div className="att-filter-group">
                <label className="att-filter-label">Degree Name</label>
                <select className="att-filter-select" value={historyFilters.degreeNameId} onChange={e => setHistoryFilters({ ...historyFilters, degreeNameId: e.target.value })} disabled={!historyFilters.degreeTypeId}>
                  <option value="">Select Degree...</option>
                  {degreeNames.filter(d => d.degreeTypeId?._id === historyFilters.degreeTypeId).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="att-filter-grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {(() => {
                const historyDegreeType = degreeTypes.find(d => d._id === historyFilters.degreeTypeId);
                const isHistoryPhD = historyDegreeType?.code?.toUpperCase() === 'PHD';
                return (
                  <div className="att-filter-group">
                    <label className="att-filter-label">{isHistoryPhD ? 'Semester (N/A)' : 'Semester'}</label>
                    <select 
                      className="att-filter-select" 
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

              <div className="att-filter-group">
                <label className="att-filter-label">Date</label>
                <input 
                  type="date" 
                  className="att-filter-input" 
                  value={historyFilters.date} 
                  onChange={e => setHistoryFilters({ ...historyFilters, date: e.target.value, timetableSlotId: '' })} 
                  max={new Date().toISOString().split('T')[0]} 
                />
              </div>

              <div className="att-filter-group">
                <label className="att-filter-label">Subject</label>
                <select 
                  className="att-filter-select" 
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
                  className="att-search-btn" 
                  onClick={handleSearchHistory} 
                  style={{ width: '100%' }}
                >
                  <Search size={16} /> Search Logs
                </button>
              </div>
            </div>
          </div>

          {/* ─── History Results ─── */}
          {historyLoading ? (
            <div style={{ marginTop: '20px' }}>
              <SkeletonLoader count={3} height={60} />
            </div>
          ) : historyList.length > 0 ? (
            <div className="att-table-wrapper" style={{ marginTop: '20px' }}>
              <table className="att-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }} className="att-th-center">#</th>
                    <th style={{ width: '110px' }}>Sh. No.</th>
                    <th>Student Name</th>
                    <th>Father's Name</th>
                    <th style={{ width: '360px' }} className="att-th-center">Attendance Status</th>
                    <th style={{ width: '140px' }} className="att-th-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((record, hIdx) => {
                    const isEditing = editingStudentId === record.studentId?._id;
                    return (
                      <motion.tr 
                        key={record._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(hIdx * 0.02, 0.3) }}
                      >
                        <td className="att-cell-center" style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{hIdx + 1}</td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{record.studentId?.profile?.shNo || 'N/A'}</td>
                        <td>
                          <div className="att-student-cell">
                            <span className="att-student-name">{record.studentId?.name}</span>
                            <span className="att-student-username">{record.studentId?.username}</span>
                          </div>
                        </td>
                        <td className="att-father-name">{record.studentId?.profile?.fatherName || '—'}</td>
                        <td className="att-cell-center">
                          {isEditing ? (
                            <div className="att-status-group">
                              <button
                                type="button"
                                onClick={() => setEditingStatus({ ...editingStatus, status: 'PRESENT', leaveType: '', leaveRequestId: null })}
                                className={`att-status-pill att-status-present ${editingStatus.status === 'PRESENT' ? 'att-status-active' : ''}`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStatus({ ...editingStatus, status: 'ABSENT', leaveType: '', leaveRequestId: null })}
                                className={`att-status-pill att-status-absent ${editingStatus.status === 'ABSENT' ? 'att-status-active' : ''}`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStatus({ ...editingStatus, status: 'NOT_APPLICABLE', leaveType: '', leaveRequestId: null })}
                                className={`att-status-pill att-status-na ${editingStatus.status === 'NOT_APPLICABLE' ? 'att-status-active' : ''}`}
                              >
                                N/A
                              </button>
                              
                              {editingStatus.status === 'ON_LEAVE' ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <button
                                    type="button"
                                    onClick={() => setOpenHistoryLeaveDropdownStudentId(openHistoryLeaveDropdownStudentId === record.studentId?._id ? null : record.studentId?._id)}
                                    className="att-leave-badge att-leave-badge-manual"
                                  >
                                    Leave - {editingStatus.leaveType || finalLeaveTypes[0]}
                                    <ChevronDown size={12} />
                                  </button>
                                  {openHistoryLeaveDropdownStudentId === record.studentId?._id && (
                                    <>
                                      <div 
                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 105 }} 
                                        onClick={() => setOpenHistoryLeaveDropdownStudentId(null)}
                                      />
                                      <div className="att-leave-dropdown">
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
                                            className={`att-leave-option ${editingStatus.leaveType === ltName ? 'att-leave-option-active' : ''}`}
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
                                  className={`att-status-pill att-status-leave ${editingStatus.status === 'ON_LEAVE' ? 'att-status-active' : ''}`}
                                >
                                  Leave
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className={`att-history-badge ${
                              record.status === 'PRESENT' ? 'att-history-badge-present' :
                              record.status === 'ABSENT' ? 'att-history-badge-absent' :
                              record.status === 'ON_LEAVE' ? 'att-history-badge-leave' : 'att-history-badge-na'
                            }`}>
                              {record.status === 'ON_LEAVE' ? `Leave - ${record.leaveType}` : record.status}
                            </span>
                          )}
                        </td>
                        <td className="att-cell-center">
                          {isEditing ? (
                            <div className="att-actions-group">
                              <button 
                                type="button" 
                                className="att-action-btn att-action-btn-update" 
                                onClick={() => handleUpdateHistoryEntry(record)}
                              >
                                <Save size={13} /> Update
                              </button>
                              <button 
                                type="button" 
                                className="att-action-btn att-action-btn-cancel" 
                                onClick={() => setEditingStudentId(null)}
                              >
                                <X size={13} /> Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="att-actions-group">
                              <button 
                                type="button" 
                                className="att-action-btn att-action-btn-edit" 
                                onClick={() => {
                                  setEditingStudentId(record.studentId?._id);
                                  setEditingStatus({
                                    status: record.status,
                                    leaveType: record.leaveType || '',
                                    leaveRequestId: record.leaveRequestId || null
                                  });
                                }}
                              >
                                <Edit3 size={13} /> Edit
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="att-empty-state" style={{ marginTop: '20px' }}>
              <div className="att-empty-icon">
                <History size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
              </div>
              No attendance history logs found for this search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceRecordsTab;
