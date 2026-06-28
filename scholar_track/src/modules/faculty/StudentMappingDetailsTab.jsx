import React, { useState, useEffect, useMemo, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Search, History, BookOpen, Users, Trash2, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const StudentMappingDetailsTab = () => {
  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semesterDegreeMappings, setSemesterDegreeMappings] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  const [filters, setFilters] = useState({
    sessionId: '',
    degreeTypeId: '',
    degreeNameId: '',
    semesterId: ''
  });

  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // holds { id, type: 'all'|'subject', subjectId? }
  const [sortBySubject, setSortBySubject] = useState('');

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
        toast.error('Failed to load filter data');
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilters();
  }, [api, toast]);

  const selectedType = degreeTypes.find(d => d._id === filters.degreeTypeId);
  const isPhD = selectedType?.code?.toUpperCase() === 'PHD';

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!filters.sessionId || !filters.degreeTypeId || !filters.degreeNameId || (!isPhD && !filters.semesterId)) {
      return toast.error('Please select all filter criteria first');
    }
    setLoadingRecords(true);
    try {
      const queryParams = new URLSearchParams({
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? '' : filters.semesterId
      });
      const res = await api.get(`/student-mapping/mapped?${queryParams.toString()}`);
      setRecords(res.data.records);
      setSubjects(res.data.subjects);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load mapped records');
      setRecords([]);
      setSubjects([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleDeleteClick = (record) => {
    setDeleteConfirm({ id: record._id, type: 'all' });
  };

  const handleDeleteSubject = (recordId, subjectId) => {
    setDeleteConfirm({ id: recordId, type: 'subject', subjectId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm.id);
    try {
      const config = deleteConfirm.type === 'subject'
        ? { data: { timetableSlotId: deleteConfirm.subjectId } }
        : {};
      await api.delete(`/student-mapping/${deleteConfirm.id}`, config);
      toast.success(deleteConfirm.type === 'subject'
        ? 'Subject removed from mapping successfully.'
        : 'Mapping record deleted successfully.'
      );
      // Refresh
      await handleSearch({ preventDefault: () => {} });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete mapping');
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const findStudentName = (recordId) => {
    const rec = records.find(r => r._id === recordId);
    return rec?.studentName || 'Unknown';
  };

  const availableDegreeNames = useMemo(() => {
    if (!Array.isArray(degreeNames)) return [];
    return degreeNames.filter(d => {
      if (!d) return false;
      const typeId = d.degreeTypeId?._id || d.degreeTypeId;
      const matchType = typeId === filters.degreeTypeId;
      const matchDept = !user?.departmentId || !d.departmentId?._id || d.departmentId._id === user.departmentId;
      return matchType && matchDept;
    });
  }, [degreeNames, filters.degreeTypeId, user?.departmentId]);

  // Derive available degree types from department-filtered degree names
  const availableDegreeTypes = useMemo(() => {
    if (!Array.isArray(degreeNames)) return [];
    const deptDegreeNames = degreeNames.filter(d => {
      if (!d) return false;
      const deptId = d.departmentId?._id || d.departmentId;
      return !user?.departmentId || !deptId || deptId === user.departmentId;
    });
    const typeMap = new Map();
    deptDegreeNames.forEach(d => {
      const dt = d.degreeTypeId;
      if (dt) {
        const id = dt._id || dt;
        const typeObj = degreeTypes.find(t => t && t._id === id);
        const name = dt.name || typeObj?.name || 'Unknown';
        const code = dt.code || typeObj?.code || '';
        if (!typeMap.has(id)) {
          typeMap.set(id, { _id: id, name, code });
        }
      }
    });
    return [...typeMap.values()];
  }, [degreeNames, degreeTypes, user?.departmentId]);

  // Derive mapped semesters for the selected degree name
  const availableSemesters = useMemo(() => {
    if (!filters.degreeNameId || !Array.isArray(semesterDegreeMappings)) return [];
    const mappedIds = semesterDegreeMappings
      .filter(m => m && (m.degreeNameId?._id || m.degreeNameId) === filters.degreeNameId)
      .map(m => m.semesterId?._id || m.semesterId)
      .filter(Boolean);
    return semesters.filter(s => s && mappedIds.includes(s._id));
  }, [filters.degreeNameId, semesters, semesterDegreeMappings]);

  if (loadingFilters) return <SkeletonLoader count={1} height={200} />;

  return (
    <div className="mark-attendance-tab">
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">
          <History size={14} />
          MAPPING DETAILS
        </div>
        <h2 className="welcome-title">Student Semester & Subject Mapping Details</h2>
        <p className="welcome-subtitle">
          View and manage students already mapped to subjects and semesters.
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="glass-panel p-xl mb-lg">
        <form onSubmit={handleSearch}>
          <div className="grid-3 mb-lg">
            <div className="form-group">
              <label className="form-label">Session</label>
              <select className="form-input" required value={filters.sessionId} onChange={e => setFilters({ ...filters, sessionId: e.target.value })}>
                <option value="">Select Session...</option>
                {sessions.map(s => <option key={s._id} value={s._id}>{s.sessionName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Degree Type</label>
              <select className="form-input" required value={filters.degreeTypeId} onChange={e => setFilters({ ...filters, degreeTypeId: e.target.value, degreeNameId: '', semesterId: '' })}>
                <option value="">Select Degree Type...</option>
                {availableDegreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Degree Name</label>
              <select className="form-input" required value={filters.degreeNameId} onChange={e => setFilters({ ...filters, degreeNameId: e.target.value, semesterId: '' })} disabled={!filters.degreeTypeId}>
                <option value="">Select Degree...</option>
                {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-3 mb-sm" style={{ alignItems: 'end' }}>
            {!isPhD && (
              <div className="form-group mb-sm">
                <label className="form-label">Semester</label>
                <select className="form-input" required value={filters.semesterId} onChange={e => setFilters({ ...filters, semesterId: e.target.value })} disabled={!filters.degreeNameId}>
                  <option value="">Select Semester...</option>
                  {availableSemesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {isPhD && <div />}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary w-full" style={{ height: '46px' }}>
                <Search size={16} /> Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
            zIndex: 200000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              maxWidth: 440, width: '100%', padding: 28,
              background: 'var(--color-surface, #ffffff)',
              borderRadius: 'var(--radius-xl, 20px)',
              border: '1px solid var(--color-border-solid, #e5e7eb)',
              boxShadow: '0 20px 50px rgba(19, 58, 38, 0.12)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                {deleteConfirm.type === 'subject' ? 'Remove Subject Mapping' : 'Delete Mapping Record'}
              </h3>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
              {deleteConfirm.type === 'subject'
                ? `Are you sure you want to remove this subject mapping from "${findStudentName(deleteConfirm.id)}"? The student can be re-mapped to this subject later.`
                : `Are you sure you want to delete the entire mapping record for "${findStudentName(deleteConfirm.id)}"? All subject mappings for this student will be removed, and they can be re-mapped later.`
              }
            </p>
            <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setDeleteConfirm(null)} disabled={deletingId === deleteConfirm.id}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 600, opacity: deletingId === deleteConfirm.id ? 0.7 : 1 }}
                onClick={confirmDelete}
                disabled={deletingId === deleteConfirm.id}
              >
                {deletingId === deleteConfirm.id ? 'Deleting...' : deleteConfirm.type === 'subject' ? 'Remove Subject' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading State ── */}
      {loadingRecords ? (
        <div className="mt-lg"><SkeletonLoader count={5} height={60} /></div>
      ) : records.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
          
          {/* ── Summary + Sort Card ── */}
          <div className="glass-panel p-lg mb-lg">
            <div className="flex justify-between items-center flex-wrap gap-md">
              <div className="flex items-center gap-sm" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                <Users size={18} style={{ color: 'var(--color-primary)' }} />
                Total Mapped Students: <strong style={{ color: 'var(--color-text-primary)' }}>{records.length}</strong>
              </div>
              <div className="flex items-center gap-sm" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <BookOpen size={16} />
                Total Subjects: {subjects.length}
              </div>
              <div className="flex items-center gap-sm">
                <label style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Sort by Subject:</label>
                <select
                  className="form-input"
                  value={sortBySubject}
                  onChange={e => setSortBySubject(e.target.value)}
                  style={{ width: 'auto', minWidth: '180px', padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <option value="">All Subjects (Default)</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Records Table ── */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th style={{ width: '110px' }}>Sh. No.</th>
                  <th>Student Name</th>
                  <th>Father's Name</th>
                  <th>Mapped Subjects</th>
                  <th style={{ width: '100px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {records
                  .filter(rec => {
                    if (!sortBySubject) return true;
                    return (rec.mappedSubjects || []).some(
                      sub => (sub.timetableSlotId?._id || sub.timetableSlotId) === sortBySubject
                    );
                  })
                  .sort((a, b) => {
                    if (!sortBySubject) return 0;
                    // Sort: students with the selected subject first
                    const aHas = (a.mappedSubjects || []).some(
                      sub => (sub.timetableSlotId?._id || sub.timetableSlotId) === sortBySubject
                    );
                    const bHas = (b.mappedSubjects || []).some(
                      sub => (sub.timetableSlotId?._id || sub.timetableSlotId) === sortBySubject
                    );
                    if (aHas && !bHas) return -1;
                    if (!aHas && bHas) return 1;
                    return 0;
                  })
                  .map((rec, idx) => (
                  <motion.tr
                    key={rec._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                  >
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{rec.shNo}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{rec.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rec.studentUsername}</div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{rec.fatherName}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(rec.mappedSubjects || []).map((sub, sIdx) => (
                          <span
                            key={sub.timetableSlotId?._id || sub.timetableSlotId || sIdx}
                            className="badge badge-subject"
                            style={{
                              background: 'rgba(99, 102, 241, 0.1)',
                              color: '#6366F1',
                              fontSize: '0.7rem',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {sub.subjectName || sub.subjectCode || 'Unknown'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onClick={() => handleDeleteClick(rec)}
                        disabled={deletingId === rec._id}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <History size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {loadingRecords
              ? 'Loading mapped records...'
              : 'No mapped records found. Please select filter criteria and click Search to view mapped students.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentMappingDetailsTab;
