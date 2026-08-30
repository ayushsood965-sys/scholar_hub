import React, { useState, useEffect, useMemo, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Save, Search, Check, Users, BookOpen, ChevronDown, AlertTriangle, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { useGridControl } from '../../hooks/useGridControl';

// Helper: Convert "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper: Check if two time intervals overlap
const isTimeslotOverlapping = (s1, e1, s2, e2) => {
  const start1 = timeToMinutes(s1);
  const end1 = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2 = timeToMinutes(e2);
  return start1 < end2 && end1 > start2;
};

const StudentSubjectMappingTab = () => {
  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semesterDegreeMappings, setSemesterDegreeMappings] = useState([]);

  const [filters, setFilters] = useState({
    sessionId: '',
    degreeTypeId: '',
    degreeNameId: '',
    semesterId: ''
  });

  const [subjects, setSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [selectedStudents, setSelectedStudents] = useState({});
  const [studentClashes, setStudentClashes] = useState({});
  const [previewData, setPreviewData] = useState(null);

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const [searchError, setSearchError] = useState('');

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
    setLoadingPreview(true);
    setSearchError('');
    try {
      const queryParams = new URLSearchParams({
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? '' : filters.semesterId
      });
      const res = await api.get(`/student-mapping/preview?${queryParams.toString()}`);
      setPreviewData(res.data);
      setSubjects(res.data.subjects || []);
      setStudentClashes(res.data.studentClashes || {});

      // Initialize subject selection:
      // - Subjects with NO existing mappings → auto-selected
      // - Subjects with partial/full mappings → unselected
      const initialSelected = {};
      let hasPartiallyMapped = false;
      (res.data.subjects || []).forEach(sub => {
        if (sub.isFullyMapped || sub.isPartiallyMapped) {
          initialSelected[sub._id] = false;
          if (sub.isPartiallyMapped) hasPartiallyMapped = true;
        } else {
          initialSelected[sub._id] = true;
        }
      });
      setSelectedSubjects(initialSelected);

      setAllStudents(res.data.students || []);
      setSelectedStudents({});
      setSelectAllStudents(false);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.noTimetable) {
        setSearchError(errData.message);
        toast.error(errData.message);
      } else {
        toast.error(errData?.message || 'Failed to load preview data');
      }
      setPreviewData(null);
      setSubjects([]);
      setAllStudents([]);
      setStudentClashes({});
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── Compute mapped student IDs for currently selected subjects ──
  const mappedStudentIdsForSelected = useMemo(() => {
    const ids = new Set();
    const selectedSubIds = Object.entries(selectedSubjects)
      .filter(([, val]) => val)
      .map(([id]) => id);

    const selectedSubs = subjects.filter(s => selectedSubIds.includes(s._id));
    selectedSubs.forEach(sub => {
      (sub.mappedStudentIds || []).forEach(stId => ids.add(stId));
    });
    return ids;
  }, [selectedSubjects, subjects]);

  // ── Compute internal schedule clashes among the selected subjects themselves ──
  const internalSubjectClashes = useMemo(() => {
    const selectedSubIds = Object.entries(selectedSubjects)
      .filter(([, val]) => val)
      .map(([id]) => id);
    const selectedSubs = subjects.filter(s => selectedSubIds.includes(s._id));
    const clashes = [];
    for (let i = 0; i < selectedSubs.length; i++) {
      for (let j = i + 1; j < selectedSubs.length; j++) {
        const s1 = selectedSubs[i];
        const s2 = selectedSubs[j];
        if (s1.dayOfWeek === s2.dayOfWeek && isTimeslotOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
          clashes.push({ sub1: s1, sub2: s2 });
        }
      }
    }
    return clashes;
  }, [selectedSubjects, subjects]);

  // ── Helper: Check if a student has a timetable collision with ANY of the selected subjects ──
  const getStudentClashForSelected = (studentId) => {
    const studentClashMap = studentClashes[studentId];
    if (!studentClashMap) return null;
    const selectedSubIds = Object.entries(selectedSubjects)
      .filter(([, val]) => val)
      .map(([id]) => id);
    
    for (const subId of selectedSubIds) {
      if (studentClashMap[subId]) {
        const targetSub = subjects.find(s => s._id === subId);
        return {
          ...studentClashMap[subId],
          targetSubjectName: targetSub?.subjectName || 'Selected Subject'
        };
      }
    }
    return null;
  };

  // ── Compute displayed students based on selected subjects ──
  const displayedStudents = useMemo(() => {
    if (!previewData) return [];

    const selectedSubIds = Object.entries(selectedSubjects)
      .filter(([, val]) => val)
      .map(([id]) => id);

    if (selectedSubIds.length === 0) return [];

    return allStudents;
  }, [selectedSubjects, allStudents, previewData]);

  // ── Unmapped & Eligible (No Clash) Students ──
  const unmappedEligibleStudents = useMemo(() => {
    return displayedStudents.filter(st => {
      const isMapped = mappedStudentIdsForSelected.has(st._id);
      const hasClash = !!getStudentClashForSelected(st._id);
      return !isMapped && !hasClash;
    });
  }, [displayedStudents, mappedStudentIdsForSelected, selectedSubjects, studentClashes]);

  const { paginatedData, renderGridControls } = useGridControl(
    displayedStudents,
    ['name', 'username', 'profile.shNo', 'profile.fatherName'],
    10
  );

  // When displayed students or clash status changes, synchronize selection state
  useEffect(() => {
    const updated = {};
    let changed = false;

    displayedStudents.forEach(s => {
      const wasSelected = !!selectedStudents[s._id];
      const isMapped = mappedStudentIdsForSelected.has(s._id);
      const hasClash = !!getStudentClashForSelected(s._id);
      const shouldBeSelected = wasSelected && !isMapped && !hasClash;
      updated[s._id] = shouldBeSelected;
      if (wasSelected !== shouldBeSelected || selectedStudents[s._id] === undefined) {
        changed = true;
      }
    });

    Object.keys(selectedStudents).forEach(key => {
      if (updated[key] === undefined) {
        changed = true;
      }
    });

    if (changed) {
      setSelectedStudents(updated);
    }

    setSelectAllStudents(
      unmappedEligibleStudents.length > 0 &&
      unmappedEligibleStudents.every(s => updated[s._id])
    );
  }, [displayedStudents, mappedStudentIdsForSelected, selectedSubjects, studentClashes]);

  // ── Subject toggle: enforce single-select for partially-mapped subjects ──
  const handleSubjectToggle = (subjectId) => {
    const sub = subjects.find(s => s._id === subjectId);
    if (sub?.isFullyMapped) {
      toast.warning('This subject is already fully mapped to all students.');
      return;
    }

    if (sub?.isPartiallyMapped) {
      // Force single selection: deselect all, select only this one
      const updated = {};
      subjects.forEach(s => { updated[s._id] = false; });
      updated[subjectId] = true;
      setSelectedSubjects(updated);
      return;
    }

    // Normal subject (no mappings): allow toggle
    const currentlySelected = Object.entries(selectedSubjects)
      .filter(([, val]) => val)
      .map(([id]) => id);

    const partialSelected = currentlySelected.some(id => {
      const s = subjects.find(sbj => sbj._id === id);
      return s?.isPartiallyMapped;
    });

    if (partialSelected) {
      const updated = {};
      subjects.forEach(s => { updated[s._id] = false; });
      updated[subjectId] = true;
      setSelectedSubjects(updated);
      return;
    }

    setSelectedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  // ── Select All subjects: skip partially-mapped ones ──
  const handleSelectAllSubjects = () => {
    const nonMappedSubjects = subjects.filter(s => !s.isFullyMapped);
    const allSelected = nonMappedSubjects.every(s => !!selectedSubjects[s._id]);
    const updated = {};
    subjects.forEach(sub => {
      if (sub.isFullyMapped) {
        updated[sub._id] = false;
      } else if (sub.isPartiallyMapped) {
        updated[sub._id] = false;
      } else {
        updated[sub._id] = !allSelected;
      }
    });
    setSelectedSubjects(updated);
  };

  const handleStudentToggle = (studentId) => {
    if (mappedStudentIdsForSelected.has(studentId)) return;
    const clash = getStudentClashForSelected(studentId);
    if (clash) {
      toast.error(`Timetable Conflict Barrier: This student is already mapped to "${clash.clashingSubjectName}" on ${clash.dayOfWeek} (${clash.startTime} - ${clash.endTime}) which clashes with the selected class timing.`);
      return;
    }
    setSelectedStudents(prev => {
      const updated = { ...prev, [studentId]: !prev[studentId] };
      const allChecked = unmappedEligibleStudents.length > 0 && unmappedEligibleStudents.every(s => updated[s._id]);
      setSelectAllStudents(allChecked);
      return updated;
    });
  };

  const handleSelectAllStudentsChange = () => {
    const allEligibleSelected = unmappedEligibleStudents.length > 0 && unmappedEligibleStudents.every(st => !!selectedStudents[st._id]);
    const newVal = !allEligibleSelected;
    setSelectAllStudents(newVal);
    const updated = { ...selectedStudents };
    unmappedEligibleStudents.forEach(st => {
      updated[st._id] = newVal;
    });
    setSelectedStudents(updated);
  };

  const selectedStudentCount = Object.entries(selectedStudents).filter(([id, val]) => val && !mappedStudentIdsForSelected.has(id) && !getStudentClashForSelected(id)).length;
  const selectedSubjectCount = Object.values(selectedSubjects).filter(v => v).length;
  const hasPartiallyMappedSubjects = subjects.some(s => s.isPartiallyMapped);
  const hasSelectedPartial = Object.entries(selectedSubjects)
    .filter(([, val]) => val)
    .some(([id]) => subjects.find(s => s._id === id)?.isPartiallyMapped);

  const handleSave = async () => {
    if (!previewData) return;

    // Hard Barrier 1: Check internal clashes between selected subjects
    if (internalSubjectClashes.length > 0) {
      const firstClash = internalSubjectClashes[0];
      return toast.error(`Timetable Conflict Barrier: Selected subjects "${firstClash.sub1.subjectName}" and "${firstClash.sub2.subjectName}" have overlapping schedules on ${firstClash.sub1.dayOfWeek} (${firstClash.sub1.startTime}-${firstClash.sub1.endTime} vs ${firstClash.sub2.startTime}-${firstClash.sub2.endTime}). Please map them separately.`);
    }

    const selectedSubIds = Object.entries(selectedSubjects)
      .filter(([, val]) => val)
      .map(([id]) => id);

    if (selectedSubIds.length === 0) {
      return toast.error('Please select at least one subject to map.');
    }

    // Hard Barrier 2: Only allow eligible students (strictly excluding any clashing or already mapped students)
    const selectedStudIds = Object.entries(selectedStudents)
      .filter(([id, val]) => val && !mappedStudentIdsForSelected.has(id) && !getStudentClashForSelected(id))
      .map(([id]) => id);

    if (selectedStudIds.length === 0) {
      return toast.error('Please select at least one eligible student to map.');
    }

    setSaving(true);
    try {
      const res = await api.post('/student-mapping/save', {
        sessionId: filters.sessionId,
        degreeTypeId: filters.degreeTypeId,
        degreeNameId: filters.degreeNameId,
        semesterId: isPhD ? null : filters.semesterId,
        subjectIds: selectedSubIds,
        studentIds: selectedStudIds
      });
      toast.success(res.data.message);
      // Re-fetch preview to update state
      await handleSearch({ preventDefault: () => {} });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error saving mapping';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
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
          <BookOpen size={14} />
          MAPPING
        </div>
        <h2 className="welcome-title">Student Semester & Subject Mapping</h2>
        <p className="welcome-subtitle">
          Map students to subjects and semesters. Select criteria, choose subjects, pick students, and save.
        </p>
      </div>

      {/* ── Filters Section ── */}
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

      {/* ── No Timetable Error Banner ── */}
      {searchError && (
        <div className="glass-panel p-lg mb-lg" style={{ borderLeft: '4px solid #EF4444' }}>
          <div className="flex items-center gap-md">
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} color="#DC2626" />
            </div>
            <div>
              <span className="font-semibold" style={{ color: '#DC2626', fontSize: '0.9rem' }}>Timetable Not Found</span>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.85rem', lineHeight: 1.4 }}>{searchError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSearchError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', flexShrink: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Loading State ── */}
      {loadingPreview ? (
        <div className="mt-lg"><SkeletonLoader count={5} height={60} /></div>
      ) : (
        previewData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
            
            {/* ── Internal Subject Clash Banner ── */}
            {internalSubjectClashes.length > 0 && (
              <div className="glass-panel p-lg mb-lg" style={{ borderLeft: '4px solid #EF4444', background: 'rgba(239, 68, 68, 0.05)' }}>
                <div className="flex items-center gap-md">
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={20} color="#DC2626" />
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: '#DC2626', fontSize: '0.92rem' }}>
                      🚫 Timetable Collision Barrier: Selected Subjects Conflict in Timing
                    </span>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      <strong>{internalSubjectClashes[0].sub1.subjectName}</strong> and <strong>{internalSubjectClashes[0].sub2.subjectName}</strong> are scheduled at overlapping times on <strong>{internalSubjectClashes[0].sub1.dayOfWeek}</strong> ({internalSubjectClashes[0].sub1.startTime} - {internalSubjectClashes[0].sub1.endTime} vs {internalSubjectClashes[0].sub2.startTime} - {internalSubjectClashes[0].sub2.endTime}). Students cannot be mapped to multiple classes simultaneously. Please unselect one of them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Info Banner when partial mappings exist ── */}
            {hasPartiallyMappedSubjects && internalSubjectClashes.length === 0 && (
              <div className="glass-panel p-lg mb-lg" style={{ borderLeft: '4px solid var(--status-warning)' }}>
                <div className="flex items-center gap-md">
                  <AlertTriangle size={20} style={{ color: '#D97706', flexShrink: 0 }} />
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>Partial Mappings Detected</span>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      Some subjects already have students mapped to them. 
                      <strong> Multiple subjects can only be selected when NO subjects have existing mappings.</strong>
                      {' '}Select a partially mapped subject individually to map remaining unmapped students.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Subject Selection ── */}
            {subjects.length > 0 && (
              <div className="glass-panel p-xl mb-lg">
                <div className="flex justify-between items-center mb-lg">
                  <h3 className="flex items-center gap-sm" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
                    Select Subjects to Map
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 4 }}>
                      ({selectedSubjectCount} selected)
                    </span>
                  </h3>
                  <div className="flex gap-sm">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={handleSelectAllSubjects}
                      disabled={hasPartiallyMappedSubjects}
                      style={{ opacity: hasPartiallyMappedSubjects ? 0.5 : 1 }}
                    >
                      Select All
                    </button>
                    <button type="button" className="btn btn-sm btn-outline" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }} onClick={() => {
                      const updated = {};
                      subjects.forEach(s => { updated[s._id] = false; });
                      setSelectedSubjects(updated);
                    }}>
                      Deselect All
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {subjects.map((sub, idx) => {
                    const isChecked = !!selectedSubjects[sub._id];
                    const isDisabled = sub.isFullyMapped;
                    return (
                      <motion.div
                        key={sub._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                        onClick={() => { if (isDisabled) return; handleSubjectToggle(sub._id); }}
                        className="glass-card"
                        style={{
                          padding: '14px 16px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          opacity: isDisabled ? 0.5 : 1,
                          border: isChecked
                            ? (sub.isPartiallyMapped ? '2px solid #F59E0B' : '2px solid var(--color-primary)')
                            : sub.isPartiallyMapped ? '2px solid #FDE68A' : '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '6px',
                          border: isChecked ? 'none' : '2px solid var(--color-border-solid)',
                          background: isChecked ? (sub.isPartiallyMapped ? '#F59E0B' : 'var(--color-primary)') : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {isChecked && <Check size={14} color="#fff" strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{sub.subjectName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Code: {sub.subjectCode}</div>
                          <div className="flex items-center gap-xs" style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            🕐 {sub.startTime} - {sub.endTime} | {sub.dayOfWeek}
                          </div>
                        </div>
                        {sub.isFullyMapped && <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>All Mapped</span>}
                        {sub.isPartiallyMapped && (
                          <span className="badge" style={{ fontSize: '0.6rem', background: '#FEF3C7', color: '#92400E', whiteSpace: 'nowrap' }}>
                            {sub.mappedStudentCount} mapped
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Students Grid ── */}
            {displayedStudents.length > 0 && selectedSubjectCount > 0 && (
              <div className="glass-panel p-lg mb-lg">
                <div className="flex justify-between items-center flex-wrap gap-md">
                  <div className="flex items-center gap-md flex-wrap" style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
                    <div className="flex items-center gap-xs">
                      <Users size={18} style={{ color: 'var(--color-primary)' }} />
                      Candidates: <strong style={{ color: 'var(--color-text-primary)' }}>{displayedStudents.length}</strong>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                        ✓ {unmappedEligibleStudents.length} Available to Map
                      </span>
                    </div>
                    {displayedStudents.some(st => !mappedStudentIdsForSelected.has(st._id) && !!getStudentClashForSelected(st._id)) && (
                      <div className="flex items-center gap-xs">
                        <span className="badge" style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: '0.72rem', padding: '3px 8px' }}>
                          ⚠️ {displayedStudents.filter(st => !mappedStudentIdsForSelected.has(st._id) && !!getStudentClashForSelected(st._id)).length} Schedule Clashes (Blocked)
                        </span>
                      </div>
                    )}
                    {selectedStudentCount > 0 && (
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        ({selectedStudentCount} selected)
                      </span>
                    )}
                  </div>
                  <label className="flex items-center gap-sm" style={{ cursor: unmappedEligibleStudents.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={selectAllStudents}
                      disabled={unmappedEligibleStudents.length === 0}
                      onChange={handleSelectAllStudentsChange}
                      style={{ width: '18px', height: '18px', cursor: unmappedEligibleStudents.length === 0 ? 'not-allowed' : 'pointer' }}
                    />
                    Select All Eligible ({unmappedEligibleStudents.length})
                  </label>
                </div>
              </div>
            )}

            {displayedStudents.length > 0 && selectedSubjectCount > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  {renderGridControls()}
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>
                          <input
                            type="checkbox"
                            checked={selectAllStudents}
                            disabled={unmappedEligibleStudents.length === 0}
                            onChange={handleSelectAllStudentsChange}
                            style={{ width: '16px', height: '16px', cursor: unmappedEligibleStudents.length === 0 ? 'not-allowed' : 'pointer' }}
                          />
                        </th>
                        <th style={{ width: '110px' }}>Sh. No.</th>
                        <th>Student Name</th>
                        <th>Degree Name</th>
                        <th>Father's Name</th>
                        <th>Username</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((st, sIdx) => {
                        const stId = st._id;
                        const isAlreadyMapped = mappedStudentIdsForSelected.has(stId);
                        const clashDetails = getStudentClashForSelected(stId);
                        const isClashing = !isAlreadyMapped && !!clashDetails;
                        const isDisabled = isAlreadyMapped || isClashing;
                        const isChecked = isAlreadyMapped ? true : (isClashing ? false : !!selectedStudents[stId]);
                        
                        return (
                          <motion.tr
                            key={stId}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(sIdx * 0.015, 0.3) }}
                            onClick={() => !isDisabled && handleStudentToggle(stId)}
                            style={{
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              background: isAlreadyMapped
                                ? 'rgba(16, 185, 129, 0.04)'
                                : isClashing
                                  ? 'rgba(239, 68, 68, 0.05)'
                                  : isChecked
                                    ? 'rgba(99, 102, 241, 0.04)'
                                    : 'transparent',
                              opacity: isAlreadyMapped ? 0.85 : (isClashing ? 0.75 : 1)
                            }}
                          >
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => !isDisabled && handleStudentToggle(stId)}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '16px', height: '16px', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                              />
                            </td>
                            <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{st.profile?.shNo || 'N/A'}</td>
                            <td>
                              <div className="flex items-center gap-sm flex-wrap">
                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{st.name}</div>
                                {isAlreadyMapped && (
                                  <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                                    Already Mapped
                                  </span>
                                )}
                                {isClashing && (
                                  <span
                                    className="badge"
                                    style={{
                                      background: '#FEE2E2',
                                      color: '#B91C1C',
                                      border: '1px solid #FECACA',
                                      fontSize: '0.68rem',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={`Schedule Clash: Candidate is already mapped to ${clashDetails.clashingSubjectName} on ${clashDetails.dayOfWeek} (${clashDetails.startTime} - ${clashDetails.endTime})`}
                                  >
                                    <AlertTriangle size={12} /> Clash: {clashDetails.clashingSubjectName} ({clashDetails.dayOfWeek} {clashDetails.startTime}-{clashDetails.endTime})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                              {degreeNames.find(dn => dn._id === st.profile?.degreeNameId)?.name || st.profile?.degreeName || '—'}
                            </td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>{st.profile?.fatherName || '—'}</td>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{st.username}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {displayedStudents.length === 0 && selectedSubjectCount > 0 && !loadingPreview && (
              <div className="glass-panel p-xl mb-lg" style={{ textAlign: 'center', borderLeft: '4px solid var(--status-present)' }}>
                <div style={{ marginBottom: '12px' }}>
                  <Check size={40} style={{ margin: '0 auto', color: 'var(--status-present)', opacity: 0.7 }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  No Eligible Students
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                  {hasSelectedPartial
                    ? 'All students have already been mapped to the selected partially-mapped subject.'
                    : 'All students have been fully mapped for the selected subjects and criteria.'}
                </p>
              </div>
            )}

            {subjects.length === 0 && !searchError && (
              <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  <BookOpen size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Please select filter criteria above and click Search to view subjects and students for mapping.
                </p>
              </div>
            )}

            {/* ── Save Button ── */}
            {selectedSubjectCount > 0 && (
              <div className="flex justify-end mt-lg">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleSave}
                  disabled={saving || internalSubjectClashes.length > 0 || selectedStudentCount === 0}
                  style={{
                    opacity: (saving || internalSubjectClashes.length > 0 || selectedStudentCount === 0) ? 0.6 : 1,
                    cursor: (saving || internalSubjectClashes.length > 0 || selectedStudentCount === 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Save size={18} /> {
                    saving
                      ? 'Saving...'
                      : internalSubjectClashes.length > 0
                        ? 'Timetable Clash Between Selected Subjects (Blocked)'
                        : selectedStudentCount === 0
                          ? 'Select Eligible Students to Save'
                          : `Save Mapping (${selectedStudentCount} Students)`
                  }
                </button>
              </div>
            )}
          </motion.div>
        )
      )}

      {/* ── Initial State ── */}
      {!loadingPreview && !previewData && !searchError && (
        <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <BookOpen size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Please select filter criteria above and click Search to view subjects and students for mapping.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentSubjectMappingTab;
