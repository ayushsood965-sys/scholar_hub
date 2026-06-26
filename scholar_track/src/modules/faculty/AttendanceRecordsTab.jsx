import React, { useState, useEffect, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Search, History, Save, ChevronDown, X, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [openHistoryLeaveDropdownStudentId, setOpenHistoryLeaveDropdownStudentId] = useState(null);

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

  // Fetch filtered subjects from matrix API when filters change
  useEffect(() => {
    const fetchFilteredSubjects = async () => {
      if (!historyFilters.sessionId || !historyFilters.degreeTypeId || !historyFilters.degreeNameId || !historyFilters.date) {
        setFilteredSubjects([]);
        return;
      }
      const historyDegreeType = availableDegreeTypes.find(d => d._id === historyFilters.degreeTypeId);
      const isHistoryPhD = historyDegreeType?.code?.toUpperCase() === 'PHD';
      if (!isHistoryPhD && !historyFilters.semesterId) {
        setFilteredSubjects([]);
        return;
      }
      try {
        const queryParams = new URLSearchParams({
          sessionId: historyFilters.sessionId,
          degreeTypeId: historyFilters.degreeTypeId,
          degreeNameId: historyFilters.degreeNameId,
          semesterId: isHistoryPhD ? '' : historyFilters.semesterId,
          date: historyFilters.date
        });
        const res = await api.get(`/attendance/faculty/matrix?${queryParams.toString()}`);
        setFilteredSubjects(res.data.classes || []);
      } catch (err) {
        console.error('Failed to fetch filtered subjects', err);
        setFilteredSubjects([]);
      }
    };
    fetchFilteredSubjects();
  }, [api, historyFilters.sessionId, historyFilters.degreeTypeId, historyFilters.degreeNameId, historyFilters.semesterId, historyFilters.date, degreeTypes]);

  const finalLeaveTypes = leaveTypes.length > 0
    ? leaveTypes.map(lt => lt.leaveName)
    : ['Casual Leave', 'Medical Leave', 'Duty Leave', 'Earned Leave', 'Maternity Leave', 'Special Leave'];

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
      handleSearchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  if (loadingFilters) return <SkeletonLoader count={1} height={200} />;
  // Derive available degree types from department-filtered degree names
  const departmentDegreeNames = useMemo(() => {
    return degreeNames.filter(d => {
      return !user?.departmentId || !d.departmentId?._id || d.departmentId._id === user.departmentId;
    });
  }, [degreeNames, user?.departmentId]);

  const availableDegreeTypes = useMemo(() => {
    return [...new Map(departmentDegreeNames.filter(d => d.degreeTypeId).map(d => [d.degreeTypeId._id, d.degreeTypeId])).values()];
  }, [departmentDegreeNames]);



  return (
    <div className="attendance-records-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">
          <History size={14} />
          ATTENDANCE RECORDS
        </div>
        <h2 className="welcome-title">Marked Attendance Records &amp; Editor</h2>
        <p className="welcome-subtitle">Search and manage previously saved student attendance logs.</p>
      </div>

      <div className="glass-panel p-xl mb-lg">
        <div className="grid-3 mb-lg">
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
              {availableDegreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Degree Name</label>
            <select className="form-input" value={historyFilters.degreeNameId} onChange={e => setHistoryFilters({ ...historyFilters, degreeNameId: e.target.value, timetableSlotId: '' })} disabled={!historyFilters.degreeTypeId}>
              <option value="">Select Degree...</option>
              {degreeNames.filter(d => {
                const matchType = d.degreeTypeId?._id === historyFilters.degreeTypeId;
                const matchDept = !user?.departmentId || !d.departmentId?._id || d.departmentId._id === user.departmentId;
                return matchType && matchDept;
              }).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-3 mb-sm" style={{ alignItems: 'end' }}>
          {(() => {
            const historyDegreeType = degreeTypes.find(d => d._id === historyFilters.degreeTypeId);
            const isHistoryPhD = historyDegreeType?.code?.toUpperCase() === 'PHD';
            return (
              <>
                {!isHistoryPhD && (
                  <div className="form-group mb-sm">
                    <label className="form-label">Semester</label>
                    <select
                      className="form-input"
                      value={historyFilters.semesterId}
                      onChange={e => setHistoryFilters({ ...historyFilters, semesterId: e.target.value, timetableSlotId: '' })}
                      disabled={!historyFilters.degreeTypeId}
                    >
                      <option value="">Select Semester...</option>
                      {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group mb-sm">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={historyFilters.date}
                    onChange={e => setHistoryFilters({ ...historyFilters, date: e.target.value, timetableSlotId: '' })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group mb-sm">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-input"
                    value={historyFilters.timetableSlotId}
                    onChange={e => setHistoryFilters({ ...historyFilters, timetableSlotId: e.target.value })}
                    disabled={filteredSubjects.length === 0}
                  >
                    <option value="">
                      {filteredSubjects.length > 0
                        ? 'Select Subject...'
                        : (!historyFilters.sessionId || !historyFilters.degreeTypeId || !historyFilters.degreeNameId || !historyFilters.date)
                          ? 'Select filters above first...'
                          : 'No subjects for this day'}
                    </option>
                    {filteredSubjects.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.subjectName} ({c.subjectCode}) — {c.startTime} - {c.endTime}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-sm">
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    onClick={handleSearchHistory}
                    style={{ height: '46px' }}
                  >
                    <Search size={16} /> Search Logs
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {historyLoading ? (
        <div className="mt-lg"><SkeletonLoader count={3} height={60} /></div>
      ) : historyList.length > 0 ? (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th style={{ width: '110px' }}>Sh. No.</th>
                <th>Student Name</th>
                <th>Father's Name</th>
                <th style={{ width: '360px' }}>Attendance Status</th>
                <th style={{ width: '140px' }}>Actions</th>
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
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>{hIdx + 1}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{record.studentId?.profile?.shNo || 'N/A'}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{record.studentId?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{record.studentId?.username}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{record.studentId?.profile?.fatherName || '—'}</td>
                    <td>
                      {isEditing ? (
                        <div className="flex gap-xs flex-wrap">
                          <button
                            type="button"
                            onClick={() => setEditingStatus({ ...editingStatus, status: 'PRESENT', leaveType: '', leaveRequestId: null })}
                            className={`status-toggle-btn ${editingStatus.status === 'PRESENT' ? 'selected-present' : ''}`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStatus({ ...editingStatus, status: 'ABSENT', leaveType: '', leaveRequestId: null })}
                            className={`status-toggle-btn ${editingStatus.status === 'ABSENT' ? 'selected-absent' : ''}`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStatus({ ...editingStatus, status: 'NOT_APPLICABLE', leaveType: '', leaveRequestId: null })}
                            className={`status-toggle-btn ${editingStatus.status === 'NOT_APPLICABLE' ? 'selected-na' : ''}`}
                            style={{ background: editingStatus.status === 'NOT_APPLICABLE' ? 'var(--color-text-muted)' : 'transparent', color: editingStatus.status === 'NOT_APPLICABLE' ? '#fff' : 'inherit' }}
                          >
                            N/A
                          </button>

                          {editingStatus.status === 'ON_LEAVE' ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                type="button"
                                onClick={() => setOpenHistoryLeaveDropdownStudentId(openHistoryLeaveDropdownStudentId === record.studentId?._id ? null : record.studentId?._id)}
                                className="badge badge-leave"
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
                                  <div className="glass-card" style={{
                                    position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                                    minWidth: '180px', zIndex: 110, padding: '8px',
                                    display: 'flex', flexDirection: 'column', gap: '2px'
                                  }}>
                                    {finalLeaveTypes.map(ltName => (
                                      <button
                                        key={ltName}
                                        type="button"
                                        onClick={() => {
                                          setEditingStatus({ ...editingStatus, status: 'ON_LEAVE', leaveType: ltName, leaveRequestId: null });
                                          setOpenHistoryLeaveDropdownStudentId(null);
                                        }}
                                        className="text-sm"
                                        style={{
                                          padding: '8px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'left',
                                          color: editingStatus.leaveType === ltName ? 'var(--color-primary)' : 'var(--color-text-primary)',
                                          background: editingStatus.leaveType === ltName ? 'rgba(var(--color-primary-rgb), 0.06)' : 'transparent',
                                          fontWeight: editingStatus.leaveType === ltName ? 600 : 400
                                        }}
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
                              onClick={() => setEditingStatus({ status: 'ON_LEAVE', leaveType: finalLeaveTypes[0], leaveRequestId: null })}
                              className={`status-toggle-btn ${editingStatus.status === 'ON_LEAVE' ? 'selected-leave' : ''}`}
                            >
                              Leave
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className={`badge ${
                          record.status === 'PRESENT' ? 'badge-present' :
                          record.status === 'ABSENT' ? 'badge-absent' :
                          record.status === 'ON_LEAVE' ? 'badge-leave' : 'badge-neutral'
                        }`}>
                          {record.status === 'ON_LEAVE' ? `Leave - ${record.leaveType}` : record.status}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="flex gap-xs">
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => handleUpdateHistoryEntry(record)}
                          >
                            <Save size={13} /> Update
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => setEditingStudentId(null)}
                          >
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      ) : (
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
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <History size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>No attendance history logs found for this search.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecordsTab;
