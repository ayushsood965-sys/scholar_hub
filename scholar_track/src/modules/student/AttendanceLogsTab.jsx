import React, { useState, useEffect, useMemo, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Calendar, Clock, BookOpen, Search, Filter, CheckSquare, Square, SearchCode } from 'lucide-react';

const AttendanceLogsTab = () => {
  const { user } = useContext(AuthContext);
  const api = useApi();
  const toast = useToast();

  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semesterDegreeMappings, setSemesterDegreeMappings] = useState([]);
  
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter form state
  const [filters, setFilters] = useState({
    sessionId: '',
    degreeTypeId: user?.profile?.degreeTypeId || '',
    degreeNameId: user?.profile?.degreeNameId || '',
    semesterId: user?.profile?.semesterId || '',
    startDate: '',
    endDate: '',
    status: ''
  });

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [logs, setLogs] = useState([]);

  // Fetch filters & sessions master dropdowns
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [sesRes, dtRes, dnRes, semRes, sdmRes] = await Promise.all([
          api.get('/attendance/sessions'),
          api.get('/attendance/masters/degree-types'),
          api.get('/attendance/masters/degree-names'),
          api.get('/attendance/masters/semesters'),
          api.get('/attendance/masters/semester-degree-mappings')
        ]);
        setSessions(sesRes.data || []);
        setDegreeTypes(dtRes.data || []);
        setDegreeNames(dnRes.data || []);
        setSemesters(semRes.data || []);
        setSemesterDegreeMappings(sdmRes.data || []);

        const currentSession = (sesRes.data || []).find(s => s.isCurrent);
        if (currentSession) {
          setFilters(prev => ({ ...prev, sessionId: currentSession._id }));
        } else if (sesRes.data && sesRes.data.length > 0) {
          setFilters(prev => ({ ...prev, sessionId: sesRes.data[0]._id }));
        }
      } catch (err) {
        toast.error('Failed to load filter parameters');
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchMasters();
  }, [api, toast]);

  const selectedDegreeType = degreeTypes.find(d => d._id === filters.degreeTypeId);
  const isPhD = selectedDegreeType?.code?.toUpperCase() === 'PHD';

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

  // Load mapped subjects checklist whenever program parameter filters change
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!filters.sessionId || !filters.degreeTypeId || !filters.degreeNameId || (!isPhD && !filters.semesterId)) {
        setAvailableSubjects([]);
        setSelectedSubjects({});
        return;
      }
      try {
        const queryParams = new URLSearchParams({
          sessionId: filters.sessionId,
          degreeTypeId: filters.degreeTypeId,
          degreeNameId: filters.degreeNameId,
          semesterId: isPhD ? '' : filters.semesterId
        });
        const res = await api.get(`/attendance/student/subjects?${queryParams.toString()}`);
        setAvailableSubjects(res.data || []);
        
        // Select all by default
        const initial = {};
        (res.data || []).forEach(sub => {
          initial[sub.subjectCode] = true;
        });
        setSelectedSubjects(initial);
      } catch (err) {
        console.error('Failed to retrieve semester subjects', err);
      }
    };
    fetchSubjects();
  }, [api, filters.sessionId, filters.degreeTypeId, filters.degreeNameId, filters.semesterId, isPhD]);

  const isAllSelected = useMemo(() => {
    return availableSubjects.length > 0 && availableSubjects.every(sub => !!selectedSubjects[sub.subjectCode]);
  }, [availableSubjects, selectedSubjects]);

  const handleToggleSelectAll = () => {
    const nextState = !isAllSelected;
    const updated = {};
    availableSubjects.forEach(sub => {
      updated[sub.subjectCode] = nextState;
    });
    setSelectedSubjects(updated);
  };

  const handleToggleSubject = (subjectCode) => {
    setSelectedSubjects(prev => ({
      ...prev,
      [subjectCode]: !prev[subjectCode]
    }));
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!filters.sessionId || !filters.degreeTypeId || !filters.degreeNameId || (!isPhD && !filters.semesterId)) {
      return toast.error('Please select all filters first');
    }
    
    setLoadingLogs(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? '' : filters.semesterId
      });
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);

      const res = await api.get(`/attendance/student/marked-records?${params.toString()}`);
      setLogs(res.data || []);
    } catch (err) {
      toast.error('Failed to retrieve logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => !!selectedSubjects[log.subjectCode]);
  }, [logs, selectedSubjects]);

  const statusBadge = (status) => {
    const map = {
      PRESENT: { cls: 'badge-success', label: 'Present' },
      ABSENT: { cls: 'badge-danger', label: 'Absent' },
      ON_LEAVE: { cls: 'badge-warning', label: 'On Leave' },
      CANCELLED: { cls: 'badge-neutral', label: 'Cancelled' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const columns = [
    {
      header: 'Date',
      accessor: (row) => new Date(row.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        weekday: 'short'
      })
    },
    {
      header: 'Subject Code',
      accessor: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
          {row.subjectCode}
        </span>
      )
    },
    {
      header: 'Subject Name',
      accessor: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
          {row.subjectName}
        </span>
      )
    },
    {
      header: 'Faculty / Marked By',
      accessor: (row) => <span style={{ fontSize: '0.82rem' }}>{row.facultyName}</span>
    },
    {
      header: 'Status',
      accessor: (row) => statusBadge(row.status)
    },
    {
      header: 'Verification Logs',
      accessor: (row) => {
        const formatTimestamp = (ts) => {
          if (!ts) return 'N/A';
          return new Date(ts).toLocaleString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
          });
        };

        const markedBy = row.markedBy?.name || 'Faculty';
        const markedRole = row.markedBy?.profile?.designation || 'Supervisor';
        const markedTime = formatTimestamp(row.markedAt);

        const hodName = row.hodApprovedBy?.name || row.lastEditedBy?.name || 'HOD';
        const hodRole = row.hodApprovedBy?.profile?.designation || 'HOD';
        const hodTime = formatTimestamp(row.hodApprovedAt || row.lastEditedAt);

        const editorName = row.lastEditedBy?.name;
        const editTime = formatTimestamp(row.lastEditedAt);

        return row.forwardedToHOD ? (
          row.approvalStatus === 'PENDING_HOD' ? (
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              <div><strong>Forwarded By:</strong> {markedBy} ({markedRole}) at {markedTime}</div>
              {row.lastEditedBy && (
                <div><strong>Modified By HOD:</strong> {editorName} at {editTime}</div>
              )}
              <div><strong>Forwarded To:</strong> HOD for final approval</div>
            </div>
          ) : (
            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              <div><strong>Forwarded By:</strong> {markedBy} ({markedRole}) at {markedTime}</div>
              {row.lastEditedBy && (
                <div><strong>Modified By HOD:</strong> {editorName} at {editTime}</div>
              )}
              <div><strong>Approved By HOD:</strong> {hodName} at {hodTime}</div>
            </div>
          )
        ) : (
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            <div><strong>Approved By:</strong> {markedBy} ({markedRole}) at {markedTime}</div>
            {row.lastEditedBy && (
              <div><strong>Modified By HOD:</strong> {editorName} at {editTime}</div>
            )}
          </div>
        );
      }
    }
  ];

  if (loadingFilters) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Attendance Logs</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Audit class-wise attendance logs and verification history.
        </p>
      </div>

      {/* Filter Options */}
      <form onSubmit={handleSearch} style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-solid)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Filter size={16} style={{ color: 'var(--color-primary, #2E9E5B)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>Logs Filter Parameters</span>
        </div>

        {/* Level 1: Program Parameters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Session */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Academic Session *
            </label>
            <select
              className="form-input"
              value={filters.sessionId}
              onChange={e => setFilters(prev => ({ ...prev, sessionId: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px' }}
              required
            >
              <option value="">Select Session</option>
              {sessions.map(s => (
                <option key={s._id} value={s._id}>{s.sessionName} {s.isCurrent ? '(Current)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Degree Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Degree Type *
            </label>
            <select
              className="form-input"
              value={filters.degreeTypeId}
              onChange={e => setFilters(prev => ({ ...prev, degreeTypeId: e.target.value, degreeNameId: '', semesterId: '' }))}
              style={{ width: '100%', padding: '10px 12px' }}
              required
            >
              <option value="">Select Degree Type</option>
              {availableDegreeTypes.map(d => (
                <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Degree Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Degree Name *
            </label>
            <select
              className="form-input"
              value={filters.degreeNameId}
              onChange={e => setFilters(prev => ({ ...prev, degreeNameId: e.target.value, semesterId: '' }))}
              style={{ width: '100%', padding: '10px 12px' }}
              disabled={!filters.degreeTypeId}
              required
            >
              <option value="">Select Degree Name</option>
              {availableDegreeNames.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          {!isPhD && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Semester *
              </label>
              <select
                className="form-input"
                value={filters.semesterId}
                onChange={e => setFilters(prev => ({ ...prev, semesterId: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px' }}
                disabled={!filters.degreeNameId}
                required
              >
                <option value="">Select Semester</option>
                {availableSemesters.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Level 2: Checklist of Mapped Subjects */}
        {availableSubjects.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--color-border-solid)',
            paddingTop: '16px',
            marginTop: '16px',
            marginBottom: '24px'
          }}>
            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Select Mapped Subjects Checklist:
            </span>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isAllSelected ? 'rgba(46, 158, 91, 0.08)' : 'transparent',
                  border: isAllSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-solid)',
                  color: isAllSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                Select All
              </button>

              {availableSubjects.map(sub => {
                const isSelected = !!selectedSubjects[sub.subjectCode];
                return (
                  <button
                    key={sub.subjectCode}
                    type="button"
                    onClick={() => handleToggleSubject(sub.subjectCode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isSelected ? 'rgba(46, 158, 91, 0.04)' : 'transparent',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-solid)',
                      color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSelected ? <CheckSquare size={14} style={{ color: 'var(--color-primary)' }} /> : <Square size={14} />}
                    <span>
                      <strong>{sub.subjectCode}</strong>: {sub.subjectName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Level 3: Date Range & Status Filters with Search Button */}
        <div style={{
          borderTop: '1px solid var(--color-border-solid)',
          paddingTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* From Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              From Date
            </label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </div>

          {/* To Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              To Date
            </label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Status
            </label>
            <select
              className="form-input"
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px' }}
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search Button */}
          <div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              <Search size={16} />
              Search Logs
            </button>
          </div>
        </div>
      </form>

      {/* Level 4: Search Results Data fall below */}
      {loadingLogs ? (
        <SkeletonLoader count={1} height={300} />
      ) : !hasSearched ? (
        <div className="glass-panel p-xl" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <SearchCode size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: 'var(--color-text-muted)' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Select session, degree program, and semester filters above, select mapped subjects, and click "Search Logs" to display records.
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel p-xl" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <BookOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: 'var(--color-text-muted)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>No attendance logs found matching the selected filters/subjects.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredLogs} />
      )}
    </div>
  );
};

export default AttendanceLogsTab;
