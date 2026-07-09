import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { useGridControl } from '../../hooks/useGridControl';
import { Search, Eye, Edit3, X, Save, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';

const SearchEditStudentTab = () => {
  const api = useApi();
  const toast = useToast();

  const renderDetailItem = (label, value) => (
    <div style={{ background: 'var(--color-surface, #ffffff)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border, rgba(0, 0, 0, 0.1))', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary, #0F172A)', wordBreak: 'break-all', overflowWrap: 'break-word' }}>{value || '—'}</span>
    </div>
  );

  // Search parameters state
  const [searchParams, setSearchParams] = useState({
    name: '',
    email: '',
    shNo: '',
    phoneNumber: '',
    session: '',
    degreeType: '',
    degreeName: '',
    semesterId: '',
  });

  // Dropdown list states loaded from masters
  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Results state
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal states
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [activeEditTab, setActiveEditTab] = useState('account'); // account | personal | academic | qualifications
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch dropdowns
  const fetchDropdowns = async () => {
    try {
      const [sessRes, typeRes, nameRes, semRes, deptRes] = await Promise.all([
        api.get('/attendance/sessions').catch(() => ({ data: [] })),
        api.get('/attendance/masters/degree-types').catch(() => ({ data: [] })),
        api.get('/attendance/masters/degree-names').catch(() => ({ data: [] })),
        api.get('/attendance/masters/semesters').catch(() => ({ data: [] })),
        api.get('/departments').catch(() => ({ data: [] })),
      ]);
      setSessions(sessRes.data || []);
      setDegreeTypes(typeRes.data || []);
      setDegreeNames(nameRes.data || []);
      setSemesters(semRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      toast.error('Failed to load master dropdown configurations');
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleSearchChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, val]) => {
        if (val) queryParams.set(key, val);
      });
      const res = await api.get(`/auth/students?${queryParams.toString()}`);
      setStudents(res.data || []);
    } catch (err) {
      toast.error('Failed to search student database');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setSearchParams({
      name: '',
      email: '',
      shNo: '',
      phoneNumber: '',
      session: '',
      degreeType: '',
      degreeName: '',
      semesterId: '',
    });
    setStudents([]);
    setHasSearched(false);
  };

  // Grid / Pagination setup
  const grid = useGridControl(
    students,
    ['name', 'username', 'department', 'profile.shNo', 'profile.phoneNumber'],
    10
  );

  // Open view mode
  const openView = (student) => {
    setViewStudent(student);
  };

  // Open edit mode and set edit fields
  const openEdit = (student) => {
    setEditStudent(student);
    setActiveEditTab('account');
    
    // Construct pre-populated form fields
    const p = student.profile || {};
    const q = p.qualifications || {};
    setEditForm({
      name: student.name || '',
      username: student.username || '',
      department: student.department || '',
      isVerified: student.isVerified ?? false,
      isActive: student.isActive ?? true,
      
      // Personal Details
      dob: p.dob || '',
      gender: p.gender || '',
      category: p.category || '',
      fatherName: p.fatherName || '',
      motherName: p.motherName || '',
      nationality: p.nationality || '',
      admissionDate: p.admissionDate || '',
      phoneNumber: p.phoneNumber || '',
      address: p.address || '',
      
      // Academic details
      shNo: p.shNo || '',
      enrollmentNumber: p.enrollmentNumber || '',
      erpAdmissionNo: p.erpAdmissionNo || '',
      academicSession: p.academicSession || '',
      degreeType: p.degreeType || '',
      degreeName: p.degreeName || '',
      semesterId: p.semesterId || '',
      phdMode: p.phdMode || '',
      thesisTitle: p.thesisTitle || '',
      thesisSummary: p.thesisSummary || '',
      thesisKeywords: p.thesisKeywords || '',

      // Qualifications Details
      qualifications: {
        class10: q.class10 || { board: '', school: '', passingYear: '', cgpaPercentage: '', rollNo: '', certificateUrl: '' },
        class12: q.class12 || { board: '', school: '', passingYear: '', cgpaPercentage: '', rollNo: '', certificateUrl: '' },
        graduation: q.graduation || { university: '', college: '', passingYear: '', cgpaPercentage: '', rollNo: '', certificateUrl: '', degreePassed: '' },
        postGraduation: q.postGraduation || { university: '', college: '', passingYear: '', cgpaPercentage: '', rollNo: '', certificateUrl: '', degreePassed: '' },
        netJrf: q.netJrf || { rollNo: '', subject: '', examDate: '', qualifyingExam: '', certificateUrl: '' },
        mphil: q.mphil || { university: '', passingYear: '', cgpaPercentage: '', rollNo: '', certificateUrl: '', topic: '' },
        other: q.other || { degreePassed: '', university: '', passingYear: '', cgpaPercentage: '', rollNo: '', certificateUrl: '' },
        fellowships: q.fellowships || [],
        otherQuals: q.otherQuals || [],
      }
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleQualificationChange = (section, field, value) => {
    setEditForm({
      ...editForm,
      qualifications: {
        ...editForm.qualifications,
        [section]: {
          ...editForm.qualifications[section],
          [field]: value
        }
      }
    });
  };

  const handleFellowshipChange = (index, field, value) => {
    const list = [...editForm.qualifications.fellowships];
    list[index] = { ...list[index], [field]: value };
    setEditForm({
      ...editForm,
      qualifications: {
        ...editForm.qualifications,
        fellowships: list
      }
    });
  };

  const addFellowship = () => {
    setEditForm({
      ...editForm,
      qualifications: {
        ...editForm.qualifications,
        fellowships: [...editForm.qualifications.fellowships, { name: '', fundingAgency: '', duration: '', amount: '', certificateUrl: '' }]
      }
    });
  };

  const removeFellowship = (index) => {
    const list = [...editForm.qualifications.fellowships];
    list.splice(index, 1);
    setEditForm({
      ...editForm,
      qualifications: {
        ...editForm.qualifications,
        fellowships: list
      }
    });
  };

  const handleOtherQualChange = (index, field, value) => {
    const list = [...editForm.qualifications.otherQuals];
    list[index] = { ...list[index], [field]: value };
    setEditForm({
      ...editForm,
      qualifications: {
        ...editForm.qualifications,
        otherQuals: list
      }
    });
  };

  const addOtherQual = () => {
    setEditForm({
      ...editForm,
      qualifications: {
        ...editForm.qualifications,
        otherQuals: [...editForm.qualifications.otherQuals, { degreePassed: '', university: '', passingYear: '', cgpaPercentage: '', rollNo: '', certificateUrl: '' }]
      }
    });
  };

  const removeOtherQual = (index) => {
    const list = [...editForm.qualifications.otherQuals];
    list.splice(index, 1);
    setEditForm({
      ...editForm,
      qualifications: {
        ...editForm.qualifications,
        otherQuals: list
      }
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await api.put(`/auth/users/${editStudent._id}/profile`, editForm);
      toast.success('Student profile updated successfully!');
      
      // Update local students list with edited details
      setStudents(prev => 
        prev.map(s => {
          if (s._id === editStudent._id) {
            return {
              ...s,
              name: editForm.name,
              username: editForm.username,
              department: editForm.department,
              isVerified: editForm.isVerified,
              isActive: editForm.isActive,
              profile: {
                ...s.profile,
                ...editForm
              }
            };
          }
          return s;
        })
      );
      setEditStudent(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save edits');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '24px', background: 'var(--color-surface, #ffffff)', color: 'var(--color-text-primary, #1F2937)', borderRadius: '16px', border: '1px solid var(--color-border, rgba(0,0,0,0.08))' }}>
      <h3 className="card-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary, #1F2937)', marginBottom: '16px' }}>
        Search & Edit Student Profiles
      </h3>

      {/* SEARCH FORM */}
      <form onSubmit={handleSearchSubmit} style={{ background: 'var(--color-surface-elevated, #F8FAFC)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border, rgba(0,0,0,0.08))', marginBottom: '24px' }}>
        {/* Search by Name OR Email OR SH No OR Phone */}
        <div style={{ background: 'var(--color-surface, #ffffff)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border, rgba(0,0,0,0.08))', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary, #4B5563)', marginBottom: '4px' }}>Name</label>
              <input type="text" name="name" value={searchParams.name} onChange={handleSearchChange} className="form-input" placeholder="Search by name..." />
            </div>
            <div style={{ color: 'var(--color-text-muted, #6B7280)', fontWeight: 800, fontSize: '0.8rem', paddingTop: '20px', textTransform: 'uppercase', userSelect: 'none' }}>OR</div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary, #4B5563)', marginBottom: '4px' }}>Email ID</label>
              <input type="text" name="email" value={searchParams.email} onChange={handleSearchChange} className="form-input" placeholder="Search by email..." />
            </div>
            <div style={{ color: 'var(--color-text-muted, #6B7280)', fontWeight: 800, fontSize: '0.8rem', paddingTop: '20px', textTransform: 'uppercase', userSelect: 'none' }}>OR</div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary, #4B5563)', marginBottom: '4px' }}>SH No.</label>
              <input type="text" name="shNo" value={searchParams.shNo} onChange={handleSearchChange} className="form-input" placeholder="Search by SH no..." />
            </div>
            <div style={{ color: 'var(--color-text-muted, #6B7280)', fontWeight: 800, fontSize: '0.8rem', paddingTop: '20px', textTransform: 'uppercase', userSelect: 'none' }}>OR</div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary, #4B5563)', marginBottom: '4px' }}>Mobile/Phone Number</label>
              <input type="text" name="phoneNumber" value={searchParams.phoneNumber} onChange={handleSearchChange} className="form-input" placeholder="Search by phone..." />
            </div>
          </div>
        </div>

        {/* Academic Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary, #4B5563)' }}>Academic Session</label>
            <select name="session" value={searchParams.session} onChange={handleSearchChange} className="form-input">
              <option value="">All Sessions</option>
              {sessions.map(s => <option key={s._id} value={s.sessionName}>{s.sessionName}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary, #4B5563)' }}>Degree Type</label>
            <select name="degreeType" value={searchParams.degreeType} onChange={handleSearchChange} className="form-input">
              <option value="">All Degree Types</option>
              {degreeTypes.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary, #4B5563)' }}>Degree Name</label>
            <select name="degreeName" value={searchParams.degreeName} onChange={handleSearchChange} className="form-input">
              <option value="">All Degree Names</option>
              {degreeNames.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary, #4B5563)' }}>Semester</label>
            <select name="semesterId" value={searchParams.semesterId} onChange={handleSearchChange} className="form-input">
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s._id} value={s._id}>{s.name} ({s.number})</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleResetSearch} className="btn-outline" style={{ padding: '8px 16px' }}>Reset</button>
          <button type="submit" className="btn-primary" style={{ padding: '8px 16px', background: 'var(--color-primary, #1A5A3B)', borderColor: 'var(--color-primary, #1A5A3B)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} /> Search Database
          </button>
        </div>
      </form>

      {/* RESULTS LIST */}
      {loading ? (
        <SkeletonLoader count={4} height={50} />
      ) : hasSearched && students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', fontStyle: 'italic' }}>
          No students found matching your search parameters.
        </div>
      ) : hasSearched ? (
        <div>
          <div style={{ marginBottom: '16px' }}>
            {grid.renderGridControls()}
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>S.No.</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Scholar Details</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Academic Info</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Department</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grid.paginatedData.map((s, idx) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#6B7280' }}>
                      {idx + 1 + (grid.currentPage - 1) * grid.pageSize}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{s.username}</div>
                      {s.profile?.phoneNumber && <div style={{ fontSize: '0.78rem', color: '#64748B' }}>📞 {s.profile.phoneNumber}</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 500, color: '#1e3a8a' }}>SH No: {s.profile?.shNo || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#475569' }}>Roll No: {s.profile?.enrollmentNumber || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{s.profile?.degreeType} | {s.profile?.degreeName}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '0.78rem', background: '#EFF6FF', color: '#1E40AF', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                        {s.department || 'Not Assigned'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textAlign: 'center', width: 'fit-content', background: s.isVerified ? '#ECFDF5' : '#FEF3C7', color: s.isVerified ? '#065F46' : '#D97706' }}>
                          {s.isVerified ? 'Verified' : 'Awaiting verification'}
                        </span>
                        <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textAlign: 'center', width: 'fit-content', background: s.isActive ? '#EFF6FF' : '#FEE2E2', color: s.isActive ? '#1E40AF' : '#991B1B' }}>
                          {s.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => openView(s)} className="btn-outline" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                          <Eye size={14} /> View
                        </button>
                        <button onClick={() => openEdit(s)} className="btn-primary" style={{ padding: '6px 12px', background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                          <Edit3 size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          Use the filters above to search student records.
        </div>
      )}

      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewStudent && (
          <div onClick={() => setViewStudent(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Student Profile Details</h4>
                <button onClick={() => setViewStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={20} />
                </button>
              </div>

              {/* View layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* General Account Info */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h5 style={{ fontWeight: 700, color: '#1E293B', marginBottom: '12px', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Information</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {renderDetailItem('Full Name', viewStudent.name)}
                    {renderDetailItem('Username / Email', viewStudent.username)}
                    {renderDetailItem('Department', viewStudent.department)}
                    {renderDetailItem('Verified Profile', viewStudent.isVerified ? 'Yes / Verified' : 'No / Pending Verification')}
                    {renderDetailItem('Active Status', viewStudent.isActive ? 'Active' : 'Disabled')}
                  </div>
                </div>

                {/* Personal Profile Details */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h5 style={{ fontWeight: 700, color: '#1E293B', marginBottom: '12px', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal Details</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {renderDetailItem('Date of Birth', viewStudent.profile?.dob)}
                    {renderDetailItem('Gender', viewStudent.profile?.gender)}
                    {renderDetailItem('Category', viewStudent.profile?.category)}
                    {renderDetailItem('Phone Number', viewStudent.profile?.phoneNumber)}
                    {renderDetailItem("Father's Name", viewStudent.profile?.fatherName)}
                    {renderDetailItem("Mother's Name", viewStudent.profile?.motherName)}
                    {renderDetailItem('Nationality', viewStudent.profile?.nationality)}
                    {renderDetailItem('Correspondence Address', viewStudent.profile?.address)}
                  </div>
                </div>

                {/* Academic Profile Details */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h5 style={{ fontWeight: 700, color: '#1E293B', marginBottom: '12px', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic Details</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {renderDetailItem('SH ID (Scholar Track)', viewStudent.profile?.shNo)}
                    {renderDetailItem('Enrollment Number', viewStudent.profile?.enrollmentNumber)}
                    {renderDetailItem('ERP Admission ID', viewStudent.profile?.erpAdmissionNo)}
                    {renderDetailItem('Admission Date', viewStudent.profile?.admissionDate)}
                    {renderDetailItem('Academic Session', viewStudent.profile?.academicSession)}
                    {renderDetailItem('Degree Type', viewStudent.profile?.degreeType)}
                    {renderDetailItem('Degree Name', viewStudent.profile?.degreeName)}
                    {renderDetailItem('Current Semester', semesters.find(s => s._id === viewStudent.profile?.semesterId)?.name)}
                    {viewStudent.profile?.phdMode && renderDetailItem('PhD Mode', viewStudent.profile?.phdMode)}
                  </div>
                  {viewStudent.profile?.thesisTitle && (
                    <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '16px', paddingTop: '16px' }}>
                      <h6 style={{ margin: '0 0 10px', color: '#1E293B', fontWeight: 700, fontSize: '0.85rem' }}>PhD Dissertation Details</h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {renderDetailItem('Thesis Title', viewStudent.profile?.thesisTitle)}
                        {renderDetailItem('Thesis Abstract / Summary', viewStudent.profile?.thesisSummary)}
                        {renderDetailItem('Thesis Keywords', viewStudent.profile?.thesisKeywords)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Academic Qualifications Details */}
                <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h5 style={{ fontWeight: 700, color: '#1E293B', marginBottom: '12px', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic Qualifications</h5>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #CBD5E1' }}>
                          <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Standard/Exam</th>
                          <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Board/University</th>
                          <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Passing Year</th>
                          <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Roll No.</th>
                          <th style={{ padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Marks/CGPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewStudent.profile?.qualifications?.class10 && (
                          <tr style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>Class 10</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.class10.board}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.class10.passingYear}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.class10.rollNo}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.class10.cgpaPercentage}</td>
                          </tr>
                        )}
                        {viewStudent.profile?.qualifications?.class12 && (
                          <tr style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>Class 12</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.class12.board}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.class12.passingYear}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.class12.rollNo}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.class12.cgpaPercentage}</td>
                          </tr>
                        )}
                        {viewStudent.profile?.qualifications?.graduation && (
                          <tr style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>Graduation ({viewStudent.profile.qualifications.graduation.degreePassed || 'N/A'})</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.graduation.university}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.graduation.passingYear}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.graduation.rollNo}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.graduation.cgpaPercentage}</td>
                          </tr>
                        )}
                        {viewStudent.profile?.qualifications?.postGraduation && (
                          <tr style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>Post-Graduation ({viewStudent.profile.qualifications.postGraduation.degreePassed || 'N/A'})</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.postGraduation.university}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.postGraduation.passingYear}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.postGraduation.rollNo}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.postGraduation.cgpaPercentage}</td>
                          </tr>
                        )}
                        {viewStudent.profile?.qualifications?.netJrf && viewStudent.profile.qualifications.netJrf.rollNo && (
                          <tr style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>NET / JRF ({viewStudent.profile.qualifications.netJrf.qualifyingExam || 'N/A'})</td>
                            <td style={{ padding: '8px 10px' }}>Subject: {viewStudent.profile.qualifications.netJrf.subject}</td>
                            <td style={{ padding: '8px 10px' }}>Date: {viewStudent.profile.qualifications.netJrf.examDate}</td>
                            <td style={{ padding: '8px 10px' }}>{viewStudent.profile.qualifications.netJrf.rollNo}</td>
                            <td style={{ padding: '8px 10px' }}>—</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setViewStudent(null)} className="btn-outline" style={{ padding: '8px 20px' }}>Close Profile View</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editStudent && editForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '850px', maxHeight: '85vh', overflowY: 'auto', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Super Admin Edit Profile</h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>Edit candidate details for <strong>{editStudent.name}</strong></p>
                </div>
                <button onClick={() => setEditStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Form Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '20px', overflowX: 'auto' }}>
                <button type="button" onClick={() => setActiveEditTab('account')} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeEditTab === 'account' ? '#0F172A' : 'transparent', color: activeEditTab === 'account' ? 'white' : '#64748B' }}>
                  Account & Status
                </button>
                <button type="button" onClick={() => setActiveEditTab('personal')} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeEditTab === 'personal' ? '#0F172A' : 'transparent', color: activeEditTab === 'personal' ? 'white' : '#64748B' }}>
                  Personal Info
                </button>
                <button type="button" onClick={() => setActiveEditTab('academic')} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeEditTab === 'academic' ? '#0F172A' : 'transparent', color: activeEditTab === 'academic' ? 'white' : '#64748B' }}>
                  Academic Profile
                </button>
                <button type="button" onClick={() => setActiveEditTab('qualifications')} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: activeEditTab === 'qualifications' ? '#0F172A' : 'transparent', color: activeEditTab === 'qualifications' ? 'white' : '#64748B' }}>
                  Qualifications
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                {/* ACCOUNT & STATUS TAB */}
                {activeEditTab === 'account' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Full Name</label>
                        <input type="text" name="name" value={editForm.name} onChange={handleEditFormChange} className="form-input" required />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Username / Email</label>
                        <input type="email" name="username" value={editForm.username} onChange={handleEditFormChange} className="form-input" required />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Department</label>
                        <select name="department" value={editForm.department} onChange={handleEditFormChange} className="form-input">
                          <option value="">Choose department...</option>
                          {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <input type="checkbox" name="isVerified" checked={editForm.isVerified} onChange={handleEditFormChange} style={{ width: '16px', height: '16px' }} />
                        Verified Profile Account
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                        <input type="checkbox" name="isActive" checked={editForm.isActive} onChange={handleEditFormChange} style={{ width: '16px', height: '16px' }} />
                        Active Account Status (Enable Login)
                      </label>
                    </div>
                  </div>
                )}

                {/* PERSONAL INFO TAB */}
                {activeEditTab === 'personal' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Date of Birth</label>
                      <input type="date" name="dob" value={editForm.dob} onChange={handleEditFormChange} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Gender</label>
                      <select name="gender" value={editForm.gender} onChange={handleEditFormChange} className="form-input">
                        <option value="">Select gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Category</label>
                      <input type="text" name="category" value={editForm.category} onChange={handleEditFormChange} className="form-input" placeholder="e.g. GENERAL, OBC, SC, ST" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Phone/Mobile Number</label>
                      <input type="text" name="phoneNumber" value={editForm.phoneNumber} onChange={handleEditFormChange} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Father\'s Name</label>
                      <input type="text" name="fatherName" value={editForm.fatherName} onChange={handleEditFormChange} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Mother\'s Name</label>
                      <input type="text" name="motherName" value={editForm.motherName} onChange={handleEditFormChange} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Nationality</label>
                      <input type="text" name="nationality" value={editForm.nationality} onChange={handleEditFormChange} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600 }}>Correspondence Address</label>
                      <textarea name="address" value={editForm.address} onChange={handleEditFormChange} className="form-input" rows="2" />
                    </div>
                  </div>
                )}

                {/* ACADEMIC PROFILE TAB */}
                {activeEditTab === 'academic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Scholar Track ID (SH No.)</label>
                        <input type="text" name="shNo" value={editForm.shNo} onChange={handleEditFormChange} className="form-input" />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Enrollment Number</label>
                        <input type="text" name="enrollmentNumber" value={editForm.enrollmentNumber} onChange={handleEditFormChange} className="form-input" />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>ERP Admission Number</label>
                        <input type="text" name="erpAdmissionNo" value={editForm.erpAdmissionNo} onChange={handleEditFormChange} className="form-input" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Admission Date</label>
                        <input type="date" name="admissionDate" value={editForm.admissionDate} onChange={handleEditFormChange} className="form-input" />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Academic Session</label>
                        <select name="academicSession" value={editForm.academicSession} onChange={handleEditFormChange} className="form-input">
                          <option value="">Choose session...</option>
                          {sessions.map(s => <option key={s._id} value={s.sessionName}>{s.sessionName}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Degree Type</label>
                        <select name="degreeType" value={editForm.degreeType} onChange={handleEditFormChange} className="form-input">
                          <option value="">Choose type...</option>
                          {degreeTypes.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Degree Name</label>
                        <select name="degreeName" value={editForm.degreeName} onChange={handleEditFormChange} className="form-input">
                          <option value="">Choose degree...</option>
                          {degreeNames.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>Current Semester</label>
                        <select name="semesterId" value={editForm.semesterId} onChange={handleEditFormChange} className="form-input">
                          <option value="">Choose semester...</option>
                          {semesters.map(s => <option key={s._id} value={s._id}>{s.name} ({s.number})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600 }}>PhD Registration Mode</label>
                        <select name="phdMode" value={editForm.phdMode} onChange={handleEditFormChange} className="form-input">
                          <option value="">Select (if applicable)...</option>
                          <option value="Full-Time">Full-Time</option>
                          <option value="Part-Time">Part-Time</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '10px', border: '1px solid #FDE68A', marginTop: '8px' }}>
                      <h6 style={{ margin: '0 0 10px', color: '#B45309', fontWeight: 700, fontSize: '0.85rem' }}>PhD Thesis Details (Optional)</h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontWeight: 600, color: '#B45309', fontSize: '0.78rem' }}>Thesis Title</label>
                          <input type="text" name="thesisTitle" value={editForm.thesisTitle} onChange={handleEditFormChange} className="form-input" style={{ borderColor: '#FCD34D' }} />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontWeight: 600, color: '#B45309', fontSize: '0.78rem' }}>Thesis Abstract / Summary</label>
                          <textarea name="thesisSummary" value={editForm.thesisSummary} onChange={handleEditFormChange} className="form-input" rows="3" style={{ borderColor: '#FCD34D' }} />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontWeight: 600, color: '#B45309', fontSize: '0.78rem' }}>Thesis Keywords (Separated by commas)</label>
                          <input type="text" name="thesisKeywords" value={editForm.thesisKeywords} onChange={handleEditFormChange} className="form-input" style={{ borderColor: '#FCD34D' }} placeholder="e.g. forensics, dna profiling, ballistics" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QUALIFICATIONS TAB */}
                {activeEditTab === 'qualifications' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '8px' }}>
                    {/* Class 10 */}
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h6 style={{ margin: '0 0 12px', fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>Class 10 Qualifications</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Board</label>
                          <input type="text" value={editForm.qualifications.class10.board} onChange={(e) => handleQualificationChange('class10', 'board', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>School Name</label>
                          <input type="text" value={editForm.qualifications.class10.school} onChange={(e) => handleQualificationChange('class10', 'school', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Passing Year</label>
                          <input type="text" value={editForm.qualifications.class10.passingYear} onChange={(e) => handleQualificationChange('class10', 'passingYear', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Roll Number</label>
                          <input type="text" value={editForm.qualifications.class10.rollNo} onChange={(e) => handleQualificationChange('class10', 'rollNo', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>CGPA / Percentage</label>
                          <input type="text" value={editForm.qualifications.class10.cgpaPercentage} onChange={(e) => handleQualificationChange('class10', 'cgpaPercentage', e.target.value)} className="form-input" />
                        </div>
                      </div>
                    </div>

                    {/* Class 12 */}
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h6 style={{ margin: '0 0 12px', fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>Class 12 Qualifications</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Board</label>
                          <input type="text" value={editForm.qualifications.class12.board} onChange={(e) => handleQualificationChange('class12', 'board', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>School Name</label>
                          <input type="text" value={editForm.qualifications.class12.school} onChange={(e) => handleQualificationChange('class12', 'school', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Passing Year</label>
                          <input type="text" value={editForm.qualifications.class12.passingYear} onChange={(e) => handleQualificationChange('class12', 'passingYear', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Roll Number</label>
                          <input type="text" value={editForm.qualifications.class12.rollNo} onChange={(e) => handleQualificationChange('class12', 'rollNo', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>CGPA / Percentage</label>
                          <input type="text" value={editForm.qualifications.class12.cgpaPercentage} onChange={(e) => handleQualificationChange('class12', 'cgpaPercentage', e.target.value)} className="form-input" />
                        </div>
                      </div>
                    </div>

                    {/* Graduation */}
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h6 style={{ margin: '0 0 12px', fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>Graduation Details</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Degree Passed</label>
                          <input type="text" value={editForm.qualifications.graduation.degreePassed} onChange={(e) => handleQualificationChange('graduation', 'degreePassed', e.target.value)} className="form-input" placeholder="e.g. B.Sc Forensic Science" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>University</label>
                          <input type="text" value={editForm.qualifications.graduation.university} onChange={(e) => handleQualificationChange('graduation', 'university', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>College Name</label>
                          <input type="text" value={editForm.qualifications.graduation.college} onChange={(e) => handleQualificationChange('graduation', 'college', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Passing Year</label>
                          <input type="text" value={editForm.qualifications.graduation.passingYear} onChange={(e) => handleQualificationChange('graduation', 'passingYear', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Roll Number</label>
                          <input type="text" value={editForm.qualifications.graduation.rollNo} onChange={(e) => handleQualificationChange('graduation', 'rollNo', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>CGPA / Percentage</label>
                          <input type="text" value={editForm.qualifications.graduation.cgpaPercentage} onChange={(e) => handleQualificationChange('graduation', 'cgpaPercentage', e.target.value)} className="form-input" />
                        </div>
                      </div>
                    </div>

                    {/* Post Graduation */}
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h6 style={{ margin: '0 0 12px', fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>Post-Graduation Details</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Degree Passed</label>
                          <input type="text" value={editForm.qualifications.postGraduation.degreePassed} onChange={(e) => handleQualificationChange('postGraduation', 'degreePassed', e.target.value)} className="form-input" placeholder="e.g. M.Sc Forensic Science" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>University</label>
                          <input type="text" value={editForm.qualifications.postGraduation.university} onChange={(e) => handleQualificationChange('postGraduation', 'university', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>College Name</label>
                          <input type="text" value={editForm.qualifications.postGraduation.college} onChange={(e) => handleQualificationChange('postGraduation', 'college', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Passing Year</label>
                          <input type="text" value={editForm.qualifications.postGraduation.passingYear} onChange={(e) => handleQualificationChange('postGraduation', 'passingYear', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Roll Number</label>
                          <input type="text" value={editForm.qualifications.postGraduation.rollNo} onChange={(e) => handleQualificationChange('postGraduation', 'rollNo', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>CGPA / Percentage</label>
                          <input type="text" value={editForm.qualifications.postGraduation.cgpaPercentage} onChange={(e) => handleQualificationChange('postGraduation', 'cgpaPercentage', e.target.value)} className="form-input" />
                        </div>
                      </div>
                    </div>

                    {/* NET / JRF */}
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h6 style={{ margin: '0 0 12px', fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>NET / JRF Verification Details</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Qualifying Exam</label>
                          <input type="text" value={editForm.qualifications.netJrf.qualifyingExam} onChange={(e) => handleQualificationChange('netJrf', 'qualifyingExam', e.target.value)} className="form-input" placeholder="e.g. UGC-NET / CSIR-JRF" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Subject Name</label>
                          <input type="text" value={editForm.qualifications.netJrf.subject} onChange={(e) => handleQualificationChange('netJrf', 'subject', e.target.value)} className="form-input" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Examination Date</label>
                          <input type="text" value={editForm.qualifications.netJrf.examDate} onChange={(e) => handleQualificationChange('netJrf', 'examDate', e.target.value)} className="form-input" placeholder="e.g. Dec 2025" />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>Roll Number</label>
                          <input type="text" value={editForm.qualifications.netJrf.rollNo} onChange={(e) => handleQualificationChange('netJrf', 'rollNo', e.target.value)} className="form-input" />
                        </div>
                      </div>
                    </div>

                    {/* Fellowships */}
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h6 style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>Fellowships Received</h6>
                        <button type="button" onClick={addFellowship} className="btn-outline-small" style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Plus size={12} /> Add Fellowship
                        </button>
                      </div>
                      {editForm.qualifications.fellowships.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>No fellowships listed.</div>
                      ) : (
                        editForm.qualifications.fellowships.map((f, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '8px', alignItems: 'center', padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                            <input type="text" value={f.name || ''} onChange={(e) => handleFellowshipChange(i, 'name', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="Name" />
                            <input type="text" value={f.fundingAgency || ''} onChange={(e) => handleFellowshipChange(i, 'fundingAgency', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="Funding Agency" />
                            <input type="text" value={f.duration || ''} onChange={(e) => handleFellowshipChange(i, 'duration', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="Duration" />
                            <input type="text" value={f.amount || ''} onChange={(e) => handleFellowshipChange(i, 'amount', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="Amount" />
                            <input type="text" value={f.certificateUrl || ''} onChange={(e) => handleFellowshipChange(i, 'certificateUrl', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="Certificate URL" />
                            <button type="button" onClick={() => removeFellowship(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Other Qualifications */}
                    <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h6 style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>Other Qualifications</h6>
                        <button type="button" onClick={addOtherQual} className="btn-outline-small" style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Plus size={12} /> Add Entry
                        </button>
                      </div>
                      {editForm.qualifications.otherQuals.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>No other qualifications listed.</div>
                      ) : (
                        editForm.qualifications.otherQuals.map((o, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '8px', alignItems: 'center', padding: '8px', borderBottom: '1px solid #E2E8F0' }}>
                            <input type="text" value={o.degreePassed || ''} onChange={(e) => handleOtherQualChange(i, 'degreePassed', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="Degree" />
                            <input type="text" value={o.university || ''} onChange={(e) => handleOtherQualChange(i, 'university', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="University" />
                            <input type="text" value={o.passingYear || ''} onChange={(e) => handleOtherQualChange(i, 'passingYear', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="Year" />
                            <input type="text" value={o.cgpaPercentage || ''} onChange={(e) => handleOtherQualChange(i, 'cgpaPercentage', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="CGPA/Marks" />
                            <input type="text" value={o.rollNo || ''} onChange={(e) => handleOtherQualChange(i, 'rollNo', e.target.value)} className="form-input" style={{ fontSize: '0.78rem', padding: '6px' }} placeholder="Roll No" />
                            <button type="button" onClick={() => removeOtherQual(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* MODAL FOOTER */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                  <button type="button" onClick={() => setEditStudent(null)} className="btn-outline" style={{ padding: '8px 20px' }}>Cancel</button>
                  <button type="submit" disabled={saveLoading} className="btn-primary" style={{ padding: '8px 20px', background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {saveLoading ? 'Saving changes...' : <><Save size={16} /> Save Profile Details</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchEditStudentTab;
