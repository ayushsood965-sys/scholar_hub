import React, { useState, useEffect, useMemo, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StatusBadge from '../../components/ui/StatusBadge';
import { Check, Search, ClipboardList, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const api = useApi();
  const toast = useToast();
  const { user } = useContext(AuthContext);

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
      records.forEach(r => {
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
    const idsToApprove = Object.entries(selectedRecordIds)
      .filter(([, val]) => val)
      .map(([id]) => id);

    if (idsToApprove.length === 0) {
      return toast.error('Please select at least one record to approve');
    }

    setApproving(true);
    try {
      await api.post('/attendance/hod/approve', { recordIds: idsToApprove });
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

  const pendingRecords = records.filter(r => r.approvalStatus === 'PENDING_HOD');
  const selectedCount = Object.values(selectedRecordIds).filter(Boolean).length;
  const allSelected = pendingRecords.length > 0 && selectedCount === pendingRecords.length;

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
      </div>

      {/* Roster list */}
      <AnimatePresence mode="wait">
        {loadingRecords ? (
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
                  Found {records.length} forwarded attendance logs ({pendingRecords.length} pending approval).
                </p>
              </div>
              {pendingRecords.length > 0 && (
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

            {records.length > 0 ? (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        {pendingRecords.length > 0 && (
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
                    {records.map((r, index) => {
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
                          <td>{index + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.studentId?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.studentId?.username}</div>
                          </td>
                          <td>{r.studentId?.profile?.enrollmentNumber || 'N/A'}</td>
                          <td>{r.studentId?.profile?.degreeNameId?.name || 'N/A'}</td>
                          <td>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {formatClasses(r)}
                            </div>
                          </td>
                          <td>{r.facultyId?.name || 'N/A'}</td>
                          <td>
                            <StatusBadge status={r.status} />
                          </td>
                          <td>
                            <StatusBadge status={r.approvalStatus} />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isPending ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() => handleApproveSingle(r._id)}
                                disabled={approving}
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              >
                                Approve
                              </button>
                            ) : (
                              <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 500 }}>Approved</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
