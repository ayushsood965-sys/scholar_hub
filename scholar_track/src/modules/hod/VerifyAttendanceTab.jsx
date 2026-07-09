import React, { useState, useEffect, useMemo, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StatusBadge from '../../components/ui/StatusBadge';
import { Check, Search, ClipboardList, ShieldAlert, CheckCircle, Save, X, Edit3, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGridControl } from '../../hooks/useGridControl';

const VerifyAttendanceTab = () => {
  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semesterDegreeMappings, setSemesterDegreeMappings] = useState([]);

  const [filters, setFilters] = useState({
    sessionId: '',
    degreeTypeId: '',
    degreeNameId: '',
    semesterId: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [records, setRecords] = useState([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState({});
  
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [approving, setApproving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStatus, setEditingStatus] = useState({ status: '', leaveType: '', leaveRequestId: null });
  const [openHistoryLeaveDropdownStudentId, setOpenHistoryLeaveDropdownStudentId] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [filteringSubject, setFilteringSubject] = useState(false);

  const api = useApi();
  const toast = useToast();
  const { user } = useContext(AuthContext);

  // Reset subject filter when query results change
  useEffect(() => {
    setSelectedSubjectId('');
    setFilteringSubject(false);
  }, [records]);

  const handleSubjectChange = (subjectId) => {
    setFilteringSubject(true);
    setSelectedSubjectId(subjectId);
    setTimeout(() => {
      setFilteringSubject(false);
    }, 300);
  };

  // Calculate subject-wise pending counts
  const subjectStats = useMemo(() => {
    const stats = {};
    records.forEach(r => {
      if (r.approvalStatus === 'PENDING_HOD') {
        (r.classes || []).forEach(c => {
          const slotId = c.timetableSlotId?._id || c.timetableSlotId;
          if (slotId) {
            const slotIdStr = slotId.toString();
            if (!stats[slotIdStr]) {
              stats[slotIdStr] = {
                id: slotIdStr,
                name: c.subjectName || 'Unknown Subject',
                pendingCount: 0
              };
            }
            stats[slotIdStr].pendingCount++;
          }
        });
      }
    });
    return Object.values(stats);
  }, [records]);

  // Construct flatRows: each class slot gets its own row
  const flatRows = useMemo(() => {
    const rows = [];
    records.forEach(r => {
      (r.classes || []).forEach(c => {
        const slotId = c.timetableSlotId?._id || c.timetableSlotId;
        rows.push({
          _id: `${r._id}_${slotId}`,
          recordId: r._id,
          studentId: r.studentId,
          facultyId: r.facultyId,
          date: r.date,
          sessionId: r.sessionId,
          degreeTypeId: r.degreeTypeId,
          degreeNameId: r.degreeNameId,
          semesterId: r.semesterId,
          approvalStatus: r.approvalStatus,
          forwardedToHOD: r.forwardedToHOD,
          markedBy: r.markedBy,
          markedAt: r.markedAt,
          lastEditedBy: r.lastEditedBy,
          lastEditedAt: r.lastEditedAt,
          hodApprovedBy: r.hodApprovedBy,
          hodApprovedAt: r.hodApprovedAt,
          departmentHod: r.departmentHod,
          
          timetableSlotId: slotId,
          subjectName: c.subjectName,
          status: c.isCancelled ? 'CANCELLED' : (c.selected ? 'PRESENT' : 'ABSENT'),
          isCancelled: c.isCancelled,
          rawClass: c,
          originalRecord: r
        });
      });
    });
    return rows;
  }, [records]);

  // Filter rows by selected subject
  const filteredRows = useMemo(() => {
    if (!selectedSubjectId) return flatRows;
    return flatRows.filter(row => 
      row.timetableSlotId && row.timetableSlotId.toString() === selectedSubjectId
    );
  }, [flatRows, selectedSubjectId]);

  const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl(
    filteredRows,
    ['studentId.name', 'studentId.username', 'studentId.profile.enrollmentNumber'],
    10
  );

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const res = await api.get('/attendance/leave-types');
        setLeaveTypes(res.data || []);
      } catch (err) {
        console.error('Failed to load leave types', err);
      }
    };
    fetchLeaveTypes();
  }, [api]);

  const finalLeaveTypes = leaveTypes.length > 0
    ? leaveTypes.map(lt => lt.leaveName)
    : ['Casual Leave', 'Medical Leave', 'Duty Leave', 'Earned Leave', 'Maternity Leave', 'Special Leave'];

  const handleUpdateRecord = async (rowItem) => {
    try {
      const record = rowItem.originalRecord;
      const updatedClasses = (record.classes || []).map(c => {
        const cSlotId = c.timetableSlotId?._id || c.timetableSlotId;
        const rowSlotId = rowItem.timetableSlotId;
        if (cSlotId && rowSlotId && cSlotId.toString() === rowSlotId.toString()) {
          return {
            ...c,
            selected: editingStatus.status === 'PRESENT'
          };
        }
        return c;
      });

      const updatedRecordPayload = {
        studentId: record.studentId?._id,
        status: editingStatus.status,
        leaveType: editingStatus.leaveType || '',
        leaveRequestId: editingStatus.leaveRequestId || null,
        classes: updatedClasses
      };

      await api.post(`/attendance/faculty/mark-bulk`, {
        sessionId: record.sessionId || filters.sessionId,
        degreeTypeId: record.degreeTypeId || filters.degreeTypeId,
        degreeNameId: record.degreeNameId || filters.degreeNameId,
        semesterId: record.semesterId || filters.semesterId,
        date: filters.date,
        records: [updatedRecordPayload]
      });

      toast.success('Attendance updated successfully');
      setEditingStudentId(null);
      handleSearch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await api.get('/student-mapping/filters');
        setSessions(res.data.sessions || []);
        setDegreeTypes(res.data.degreeTypes || []);
        setDegreeNames(res.data.degreeNames || []);
        setSemesters(res.data.semesters || []);
        setSemesterDegreeMappings(res.data.semesterDegreeMappings || []);
      } catch (err) {
        toast.error('Failed to load filters');
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilters();
  }, [api, toast]);

  const selectedType = degreeTypes.find(d => d._id === filters.degreeTypeId);
  const isPhD = selectedType?.code?.toUpperCase() === 'PHD';

  const availableDegreeNames = useMemo(() => {
    return degreeNames.filter(d => {
      const matchType = d.degreeTypeId?._id === filters.degreeTypeId;
      const matchDept = !user?.departmentId || !d.departmentId?._id || d.departmentId._id === user.departmentId;
      return matchType && matchDept;
    });
  }, [degreeNames, filters.degreeTypeId, user]);

  const availableDegreeTypes = useMemo(() => {
    const departmentDegreeNames = degreeNames.filter(d => {
      return !user?.departmentId || !d.departmentId?._id || d.departmentId._id === user.departmentId;
    });
    return [...new Map(departmentDegreeNames.filter(d => d.degreeTypeId).map(d => [d.degreeTypeId._id, d.degreeTypeId])).values()];
  }, [degreeNames, user]);

  const availableSemesters = useMemo(() => {
    if (!filters.degreeNameId || !Array.isArray(semesterDegreeMappings)) return [];
    const mappedIds = semesterDegreeMappings
      .filter(m => m && (m.degreeNameId?._id || m.degreeNameId) === filters.degreeNameId)
      .map(m => m.semesterId?._id || m.semesterId)
      .filter(Boolean);
    return semesters.filter(s => s && mappedIds.includes(s._id));
  }, [filters.degreeNameId, semesters, semesterDegreeMappings]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!filters.sessionId || !filters.degreeTypeId || !filters.degreeNameId || (!isPhD && !filters.semesterId) || !filters.date) {
      return toast.error('Please select all filters first');
    }
    setLoadingRecords(true);
    setHasSearched(true);
    setSelectedRecordIds({});
    try {
      const queryParams = new URLSearchParams({
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? '' : filters.semesterId,
        date: filters.date
      });
      const res = await api.get(`/attendance/hod/forwarded?${queryParams.toString()}`);
      setRecords(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading forwarded attendance');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    const updated = {};
    if (checked) {
      filteredRows.forEach(r => {
        if (r.approvalStatus === 'PENDING_HOD') {
          updated[r._id] = true;
        }
      });
    }
    setSelectedRecordIds(updated);
  };

  const handleSelectRow = (id, checked) => {
    setSelectedRecordIds(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const handleApproveSelected = async () => {
    const recordIdsToApprove = [
      ...new Set(
        Object.entries(selectedRecordIds)
          .filter(([, val]) => val)
          .map(([id]) => {
            const row = filteredRows.find(fr => fr._id === id);
            return row ? row.recordId : null;
          })
          .filter(Boolean)
      )
    ];

    if (recordIdsToApprove.length === 0) {
      return toast.error('Please select at least one record to approve');
    }

    setApproving(true);
    try {
      await api.post('/attendance/hod/approve', { recordIds: recordIdsToApprove });
      toast.success('Selected attendance records approved successfully');
      handleSearch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error approving attendance');
    } finally {
      setApproving(false);
    }
  };

  const handleApproveSingle = async (recordId) => {
    setApproving(true);
    try {
      await api.post('/attendance/hod/approve', { recordIds: [recordId] });
      toast.success('Attendance record approved successfully');
      handleSearch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error approving attendance');
    } finally {
      setApproving(false);
    }
  };

  const formatClasses = (rec) => {
    if (!rec.classes || rec.classes.length === 0) {
      return rec.courseName || 'Daily Check-In';
    }
    return rec.classes.map(c => {
      let suffix = '';
      if (c.isCancelled) suffix = ' (Cancelled)';
      else suffix = c.selected ? ' (Present)' : ' (Absent)';
      return `${c.subjectName}${suffix}`;
    }).join(', ');
  };

  const filteredPendingRecords = filteredRows.filter(r => r.approvalStatus === 'PENDING_HOD');
  const selectedCount = Object.values(selectedRecordIds).filter(Boolean).length;
  const allSelected = filteredPendingRecords.length > 0 && selectedCount === filteredPendingRecords.length;

  if (loadingFilters) return <SkeletonLoader count={1} height={200} />;

  return (
    <div className="verify-attendance-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">
          <ShieldAlert size={14} />
          HOD APPROVALS
        </div>
        <h2 className="welcome-title">Verify & Approve Attendance</h2>
        <p className="welcome-subtitle">Approve student attendance registers forwarded by department faculty members.</p>
      </div>

      {/* Filter Roster */}
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
              <select className="form-input" required value={filters.degreeNameId} onChange={e => setFilters({...filters, degreeNameId: e.target.value, semesterId: ''})} disabled={!filters.degreeTypeId}>
                <option value="">Select Degree...</option>
                {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-3 mb-sm" style={{ alignItems: 'end' }}>
            {!isPhD ? (
              <div className="form-group mb-sm">
                <label className="form-label">Semester</label>
                <select className="form-input" required value={filters.semesterId} onChange={e => setFilters({...filters, semesterId: e.target.value})} disabled={!filters.degreeNameId}>
                  <option value="">Select Semester...</option>
                  {availableSemesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="form-group mb-sm" />
            )}
            <div className="form-group mb-sm">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" required value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary w-full" style={{ height: '46px' }}>
                <Search size={16} /> Search Forwarded Records
              </button>
            </div>
          </div>
        </form>

        {records.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '20px', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
              Filter & Summary by Subject
            </h4>
            <div className="grid-3 mb-md" style={{ alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select 
                  className="form-input" 
                  value={selectedSubjectId} 
                  onChange={e => handleSubjectChange(e.target.value)}
                >
                  <option value="">All Subjects (Show All)</option>
                  {subjectStats.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.pendingCount} pending)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {subjectStats.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {subjectStats.map(sub => {
                  const isActive = selectedSubjectId === sub.id;
                  return (
                    <div 
                      key={sub.id} 
                      onClick={() => handleSubjectChange(isActive ? '' : sub.id)}
                      style={{
                        background: isActive ? 'rgba(var(--color-primary-rgb), 0.12)' : 'var(--color-surface)',
                        border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        boxShadow: 'var(--shadow-sm)',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                        {sub.name}
                      </span>
                      <span className="badge badge-pending" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                        {sub.pendingCount} pending
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roster list */}
      <AnimatePresence mode="wait">
        {loadingRecords || filteringSubject ? (
          <SkeletonLoader count={3} height={80} />
        ) : hasSearched ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-panel p-xl"
          >
            <div className="flex justify-between items-center mb-lg">
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Forwarded Candidates Register</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Found {filteredRows.length} forwarded attendance logs ({filteredPendingRecords.length} pending approval){selectedSubjectId && ' for selected subject'}.
                </p>
              </div>
              {filteredPendingRecords.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApproveSelected}
                  disabled={approving || selectedCount === 0}
                  style={{ gap: '6px' }}
                >
                  <CheckCircle size={16} /> Approve Selected ({selectedCount})
                </button>
              )}
            </div>

            {filteredRows.length > 0 ? (
              <>
                {renderGridControls()}
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>
                          {filteredPendingRecords.length > 0 && (
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={handleSelectAll}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          )}
                        </th>
                        <th style={{ width: '50px' }}>#</th>
                        <th>Student Name</th>
                        <th>Enrollment No.</th>
                        <th>Degree Program</th>
                        <th>Classes / Subject Details</th>
                        <th>Marked By (Faculty)</th>
                        <th>Marked Status</th>
                        <th>Approval Status</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((r, index) => {
                        const isPending = r.approvalStatus === 'PENDING_HOD';
                        return (
                          <tr key={r._id} className={isPending ? '' : 'row-dimmed'} style={{ opacity: isPending ? 1 : 0.65 }}>
                            <td style={{ textAlign: 'center' }}>
                              {isPending && (
                                <input
                                  type="checkbox"
                                  checked={!!selectedRecordIds[r._id]}
                                  onChange={(e) => handleSelectRow(r._id, e.target.checked)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                              )}
                            </td>
                            <td>{index + 1 + (currentPage - 1) * pageSize}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.studentId?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.studentId?.username}</div>
                          </td>
                          <td>{r.studentId?.profile?.enrollmentNumber || 'N/A'}</td>
                          <td>{r.studentId?.profile?.degreeNameId?.name || 'N/A'}</td>
                          <td>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {r.subjectName}
                            </div>
                          </td>
                          <td>{r.facultyId?.name || 'N/A'}</td>
                          <td>
                            {editingStudentId === r._id ? (
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
                                      onClick={() => setOpenHistoryLeaveDropdownStudentId(openHistoryLeaveDropdownStudentId === r._id ? null : r._id)}
                                      className="badge badge-leave"
                                    >
                                      Leave - {editingStatus.leaveType || finalLeaveTypes[0]}
                                      <ChevronDown size={12} />
                                    </button>
                                    {openHistoryLeaveDropdownStudentId === r._id && (
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
                              <StatusBadge status={r.status} />
                            )}
                          </td>
                          <td>
                            <StatusBadge status={r.approvalStatus} />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {editingStudentId === r._id ? (
                              <div className="flex gap-xs justify-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleUpdateRecord(r)}
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
                              <div className="flex gap-xs justify-center" style={{ alignItems: 'center' }}>
                                {isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success"
                                      onClick={() => handleApproveSingle(r.recordId)}
                                      disabled={approving}
                                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline"
                                      onClick={() => {
                                        setEditingStudentId(r._id);
                                        setEditingStatus({
                                          status: r.status,
                                          leaveType: r.leaveType || '',
                                          leaveRequestId: r.leaveRequestId || null
                                        });
                                      }}
                                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      <Edit3 size={12} /> Edit
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 500 }}>Approved</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                <Check size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>No forwarded candidates' attendance records found matching this criteria.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
            <ClipboardList size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: 'var(--color-text-muted)' }} />
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Please select all filter parameters and a date above to check forwarded registers.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifyAttendanceTab;
