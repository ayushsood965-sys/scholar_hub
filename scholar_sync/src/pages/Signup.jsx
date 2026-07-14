import React, { useState, useContext, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useThemeStyles } from '../context/ThemeContext';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config';

const Signup = () => {
  const { register } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useThemeStyles();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser) {
            toast.warning('You are already logged in. Please sign out to sign up or log in again.');
            const dashMap = { SUPER_ADMIN: '/super-dashboard', ADMIN: '/admin-dashboard', HOD: '/admin-dashboard', FACULTY: '/faculty-dashboard', STUDENT: '/student-dashboard' };
            navigate(dashMap[storedUser.role] ?? '/student-dashboard');
            return;
          }
        }
      } catch { /* token invalid, let them stay */ }
    }
  }, [navigate, toast]);

  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [depts, setDepts] = useState([]);
  const [academicSession, setAcademicSession] = useState('');
  const [sessionOptions, setSessionOptions] = useState([]);
  const [allDegreeNames, setAllDegreeNames] = useState([]);
  const [phdDegreeTypeId, setPhdDegreeTypeId] = useState('');
  const [phdDegreeTypeName, setPhdDegreeTypeName] = useState('');
  const [phdDegreeNames, setPhdDegreeNames] = useState([]);
  const [selectedDegreeNameId, setSelectedDegreeNameId] = useState('');
  const [hasPhdForDept, setHasPhdForDept] = useState(false);

  // Gender and Category from master data
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [genderOptions, setGenderOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Fetch all degree names and sessions on mount
  useEffect(() => {
    const fetchDegreeNames = async () => {
      try {
        const res = await fetch(`${API_URL}/attendance/public/masters/degree-names`);
        const data = await res.json();
        if (Array.isArray(data)) setAllDegreeNames(data);
      } catch (err) { /* silent */ }
    };
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_URL}/attendance/public/sessions`);
        const data = await res.json();
        if (Array.isArray(data)) setSessionOptions(data);
      } catch (err) { /* silent */ }
    };
    const fetchGenderCategory = async () => {
      try {
        const [genderRes, categoryRes] = await Promise.all([
          fetch(`${API_URL}/attendance/public/masters/category-gender?type=GENDER`),
          fetch(`${API_URL}/attendance/public/masters/category-gender?type=CATEGORY`)
        ]);
        const genderData = await genderRes.json();
        const categoryData = await categoryRes.json();
        if (Array.isArray(genderData)) setGenderOptions(genderData);
        if (Array.isArray(categoryData)) setCategoryOptions(categoryData);
      } catch (err) { /* silent */ }
    };
    fetchDegreeNames();
    fetchSessions();
    fetchGenderCategory();
  }, []);

  // Fetch departments
  useEffect(() => {
    fetch(`${API_URL}/departments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDepts(data);
      })
      .catch(() => {});
  }, []);

  // Group departments by faculty name
  const getGroupedDepts = () => {
    const filtered = depts.filter(d => {
      const q = searchQuery.toLowerCase();
      const nameMatch = d.name.toLowerCase().includes(q);
      const facultyName = d.facultyId?.name || d.faculty || '';
      const facultyMatch = facultyName.toLowerCase().includes(q);
      return nameMatch || facultyMatch;
    });

    const grouped = {};
    filtered.forEach(d => {
      const facultyName = d.facultyId?.name || d.faculty || 'Other / General';
      if (!grouped[facultyName]) {
        grouped[facultyName] = [];
      }
      grouped[facultyName].push(d);
    });

    return grouped;
  };

  // When department changes, check if PhD is mapped under this department
  useEffect(() => {
    if (!departmentId) {
      setPhdDegreeTypeId('');
      setPhdDegreeTypeName('');
      setHasPhdForDept(false);
      setPhdDegreeNames([]);
      return;
    }
    const deptDegreeNames = allDegreeNames.filter(
      dn => (dn.departmentId?._id || dn.departmentId) === departmentId
    );
    // Find PhD degree type IDs from those degree names
    const phdTypeMap = {};
    const phdNames = [];
    deptDegreeNames.forEach(dn => {
      const dt = dn.degreeTypeId;
      if (dt && (dt.code === 'PHD' || dt.name?.toUpperCase().includes('PHD'))) {
        if (!phdTypeMap[dt._id]) {
          phdTypeMap[dt._id] = dt;
        }
        phdNames.push(dn);
      }
    });
    const phdTypes = Object.values(phdTypeMap);
    if (phdTypes.length > 0) {
      setPhdDegreeTypeId(phdTypes[0]._id);
      setPhdDegreeTypeName(`${phdTypes[0].name} (${phdTypes[0].code})`);
      setHasPhdForDept(true);
    } else {
      setPhdDegreeTypeId('');
      setPhdDegreeTypeName('');
      setHasPhdForDept(false);
    }
    setPhdDegreeNames(phdNames);
  }, [departmentId, allDegreeNames]);

  // Sync selectedDegreeNameId when phdDegreeNames changes
  useEffect(() => {
    if (phdDegreeNames.length > 0) {
      setSelectedDegreeNameId(phdDegreeNames[0]._id);
    } else {
      setSelectedDegreeNameId('');
    }
  }, [phdDegreeNames]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dashMap = {
    HOD: '/admin-dashboard',
    FACULTY: '/faculty-dashboard',
    STUDENT: '/student-dashboard',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const newErrors = {};

    if (!role) {
      newErrors.role = 'Please select a role to continue.';
    }
    // Check required fields
    if (!username) newErrors.username = 'Email address is required.';
    if (!password) newErrors.password = 'Password is required.';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required.';
    if (!department) newErrors.department = 'Department is required.';
    if (!phoneNumber) newErrors.phoneNumber = 'Phone number is required.';

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
      if (!passwordRegex.test(password)) {
        newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.';
      }
    }

    // Student-specific validations (PhD only)
    if (role === 'STUDENT') {
      if (!name) newErrors.name = 'Please enter your full name.';
      if (!academicSession) newErrors.academicSession = 'Please select an academic session.';
      if (!gender) newErrors.gender = 'Please select a gender.';
      if (!category) newErrors.category = 'Please select a category.';
      if (!hasPhdForDept) {
        newErrors.department = 'No PhD programme is mapped under the selected department. Please choose a department that offers PhD, or contact your department administrator.';
      } else if (!selectedDegreeNameId) {
        newErrors.selectedDegreeNameId = 'Please select a PhD programme.';
      }
    }

    // Faculty/HOD validations
    if ((role === 'FACULTY' || role === 'HOD') && !name) {
      newErrors.name = 'Please enter your full name.';
    }

    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit Indian phone number (starts with 6-9).';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setLoading(true);
    const userData = {
      username,
      password,
      role,
      department,
      phoneNumber,
    };

    if (role === 'STUDENT') {
      userData.name = name;
      userData.academicSession = academicSession;
      userData.degreeTypeId = phdDegreeTypeId;
      userData.degreeTypeName = phdDegreeTypeName;
      const chosenDegree = phdDegreeNames.find(dn => dn._id === selectedDegreeNameId);
      if (chosenDegree) {
        userData.degreeNameId = chosenDegree._id;
        userData.degreeNameLabel = chosenDegree.name;
      }
      userData.gender = gender;
      userData.category = category;
    } else {
      userData.name = name;
    }

    const result = await register(userData);
    if (result.success) {
      if (result.emailPending) {
        navigate(`/verify-email-pending?email=${encodeURIComponent(userData.username)}`);
      } else {
        navigate(dashMap[result.role] ?? '/student-dashboard');
      }
    } else {
      setLoading(false);
      const msg = result.message ?? 'Registration failed.';
      const lower = msg.toLowerCase();
      if (lower.includes('password')) {
        setFieldErrors({ password: msg });
      } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('number')) {
        setFieldErrors({ phoneNumber: msg });
      } else if (lower.includes('registered') || lower.includes('email') || lower.includes('username') || lower.includes('credentials')) {
        setFieldErrors({ username: msg });
      } else if (lower.includes('hod') || lower.includes('department')) {
        setFieldErrors({ department: msg });
      } else {
        setFieldErrors({ general: msg });
      }
    }
  };

  return (
    <div className="subpage-container">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <div className="glass-panel auth-panel" style={{ margin: 0, maxWidth: '520px', width: '100%' }}>
          <h1 className="page-title">Join ScholarSync</h1>
          <p className="page-desc">PhD Scholars &amp; Supervisors — Create your credentials</p>

          {fieldErrors.general && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '15px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#EF4444', fontSize: '0.85rem', fontWeight: 500,
              display: 'flex', alignItems: 'flex-start', gap: '8px'
            }}>
              <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠</span>
              {fieldErrors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ROLE SELECTOR */}
            <div className="form-group">
              <label className="form-label">Select Your Role <span style={{ color: theme.error }}>*</span></label>
              <select
                className="form-input"
                value={role}
                onChange={e => {
                  setRole(e.target.value);
                  setFieldErrors({});
                  setAcademicSession('');
                  setGender('');
                  setCategory('');
                  setName('');
                }}
                required
                style={{
                  backgroundColor: theme.inputBg,
                  color: theme.inputText,
                  borderColor: theme.inputBorder,
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23${theme.isDark ? '88898b' : '6B7280'}' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '14px',
                  paddingRight: '36px',
                }}
              >
                <option value="" style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>-- Select Role --</option>
                <option value="STUDENT" style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>PhD Scholar / Candidate</option>
                <option value="FACULTY" style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>Faculty / Supervisor</option>
                <option value="HOD" style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>Head of Department (HOD)</option>
              </select>
              {fieldErrors.role && (
                <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                  ⚠ {fieldErrors.role}
                </span>
              )}
            </div>

            {/* STUDENT FIELDS (PhD only) */}
            {role === 'STUDENT' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name <span style={{ color: theme.error }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Department <span style={{ color: theme.error }}>*</span></label>
                  <div className="searchable-dropdown-container" ref={dropdownRef}>
                    <div
                      className="form-input searchable-dropdown-trigger"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                        color: department ? theme.inputText : theme.inputPlaceholder,
                      }}
                    >
                      <span style={{ color: department ? theme.inputText : theme.inputPlaceholder }}>
                        {department || 'Select your department'}
                      </span>
                      <span style={{
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: '0.8rem',
                        color: theme.textMuted
                      }}>▼</span>
                    </div>
                    {isDropdownOpen && (
                      <div 
                        className="searchable-dropdown-menu"
                        style={{
                          backgroundColor: theme.dropdownBg,
                          borderColor: theme.dropdownBorder,
                          boxShadow: theme.cardShadow,
                        }}
                      >
                        <div className="searchable-dropdown-search-wrapper">
                          <input
                            type="text"
                            className="form-input searchable-dropdown-search"
                            placeholder="Search department..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                            style={{
                              backgroundColor: theme.inputBg,
                              borderColor: theme.inputBorder,
                              color: theme.inputText,
                            }}
                          />
                        </div>
                        <div className="searchable-dropdown-list">
                          {Object.keys(getGroupedDepts()).length > 0 ? (
                            Object.entries(getGroupedDepts()).map(([facultyName, deptList]) => (
                              <div key={facultyName}>
                                <div style={{
                                  padding: '8px 12px 4px 12px',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  color: 'var(--color-primary, #10B981)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  borderBottom: '1px solid rgba(var(--color-primary-rgb), 0.1)',
                                  marginBottom: '4px',
                                  marginTop: '4px'
                                }}>
                                  {facultyName}
                                </div>
                                {deptList.map(d => (
                                  <div
                                    key={d._id}
                                    className={`searchable-dropdown-item ${department === d.name ? 'active' : ''}`}
                                    onClick={() => {
                                      setDepartment(d.name);
                                      setDepartmentId(d._id);
                                      setIsDropdownOpen(false);
                                      setSearchQuery('');
                                      setFieldErrors(prev => ({ ...prev, department: null }));
                                    }}
                                    style={{
                                      color: theme.textPrimary,
                                      backgroundColor: department === d.name ? theme.primaryLight : 'transparent',
                                      paddingLeft: '24px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {d.name}
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '10px', color: theme.textMuted, fontSize: '0.9rem', textAlign: 'center' }}>
                              No departments found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {fieldErrors.department && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.department}
                    </span>
                  )}
                </div>

                {/* PhD Degree Type — auto-detected, shown as read-only badge */}
                <div className="form-group">
                  <label className="form-label">Degree Type</label>
                  {departmentId ? (
                    hasPhdForDept ? (
                      <div style={{
                        padding: '10px 14px', borderRadius: '8px',
                        background: 'rgba(19, 58, 38, 0.08)',
                        border: '1px solid rgba(19, 58, 38, 0.2)',
                        color: '#133A26', fontSize: '0.9rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #133A26, #1a5c3a)',
                          color: '#fff', padding: '2px 10px', borderRadius: '20px',
                          fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px'
                        }}>PhD</span>
                        {phdDegreeTypeName}
                      </div>
                    ) : (
                      <div style={{
                        padding: '10px 14px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#EF4444', fontSize: '0.85rem', fontWeight: 500,
                        display: 'flex', alignItems: 'flex-start', gap: '8px'
                      }}>
                        <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠</span>
                        No PhD programme mapped under this department. Please select a department that offers PhD.
                      </div>
                    )
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '10px 0' }}>
                      Please select a department first to auto-detect the PhD programme
                    </div>
                  )}
                </div>

                {/* PhD Degree Name Dropdown */}
                {departmentId && hasPhdForDept && phdDegreeNames.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">PhD Programme / Course <span style={{ color: theme.error }}>*</span></label>
                    <select
                      className="form-input"
                      value={selectedDegreeNameId}
                      onChange={e => setSelectedDegreeNameId(e.target.value)}
                      required
                      style={{
                        backgroundColor: theme.inputBg,
                        color: theme.inputText,
                        borderColor: theme.inputBorder,
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23${theme.isDark ? '88898b' : '6B7280'}' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '14px',
                        paddingRight: '36px',
                      }}
                    >
                      <option value="" style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>-- Select PhD Programme --</option>
                      {phdDegreeNames.map(dn => (
                        <option key={dn._id} value={dn._id} style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>{dn.name} ({dn.code})</option>
                      ))}
                    </select>
                    {fieldErrors.selectedDegreeNameId && (
                      <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                        ⚠ {fieldErrors.selectedDegreeNameId}
                      </span>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Academic Session <span style={{ color: theme.error }}>*</span></label>
                  <select
                    className="form-input"
                    value={academicSession}
                    onChange={e => setAcademicSession(e.target.value)}
                    required
                    style={{
                      backgroundColor: theme.inputBg,
                      color: theme.inputText,
                      borderColor: theme.inputBorder,
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23${theme.isDark ? '88898b' : '6B7280'}' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '14px',
                      paddingRight: '36px',
                    }}
                  >
                    <option value="" style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>-- Select Session --</option>
                    {sessionOptions.map(s => (
                      <option key={s._id} value={s.sessionName} style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>{s.sessionName}</option>
                    ))}
                  </select>
                  {fieldErrors.academicSession && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.academicSession}
                    </span>
                  )}
                </div>

                {/* Gender Dropdown */}
                <div className="form-group">
                  <label className="form-label">Gender <span style={{ color: theme.error }}>*</span></label>
                  <select
                    className="form-input"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    required
                    style={{
                      backgroundColor: theme.inputBg,
                      color: theme.inputText,
                      borderColor: theme.inputBorder,
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23${theme.isDark ? '88898b' : '6B7280'}' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '14px',
                      paddingRight: '36px',
                    }}
                  >
                    <option value="" style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>-- Select Gender --</option>
                    {genderOptions.map(g => (
                      <option key={g._id} value={g.value} style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>{g.label}</option>
                    ))}
                  </select>
                  {fieldErrors.gender && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.gender}
                    </span>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="form-group">
                  <label className="form-label">Category <span style={{ color: theme.error }}>*</span></label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                    style={{
                      backgroundColor: theme.inputBg,
                      color: theme.inputText,
                      borderColor: theme.inputBorder,
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23${theme.isDark ? '88898b' : '6B7280'}' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '14px',
                      paddingRight: '36px',
                    }}
                  >
                    <option value="" style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>-- Select Category --</option>
                    {categoryOptions.map(c => (
                      <option key={c._id} value={c.value} style={{ backgroundColor: theme.dropdownBg, color: theme.textPrimary }}>{c.label}</option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.category}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address <span style={{ color: theme.error }}>*</span></label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="Enter your email id"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      setFieldErrors(prev => ({ ...prev, username: null }));
                    }}
                    required
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
                  />
                  {fieldErrors.username && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.username}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number (Indian Format) <span style={{ color: theme.error }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Enter 10-digit mobile number e.g. 9876543210"
                    value={phoneNumber}
                    onChange={e => {
                      setPhoneNumber(e.target.value);
                      setFieldErrors(prev => ({ ...prev, phoneNumber: null }));
                    }}
                    required
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
                  />
                  {fieldErrors.phoneNumber && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.phoneNumber}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Password <span style={{ color: theme.error }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setFieldErrors(prev => ({ ...prev, password: null }));
                      }}
                      required
                      style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', color: theme.textMuted,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password <span style={{ color: theme.error }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showConfirmPwd ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                      }}
                      required
                      style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', color: theme.textMuted,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {showConfirmPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* FACULTY / HOD FIELDS */}
            {(role === 'FACULTY' || role === 'HOD') && (
              <>
                <div className="form-group">
                  <label className="form-label">Department <span style={{ color: '#EF4444' }}>*</span></label>
                  <div className="searchable-dropdown-container" ref={dropdownRef}>
                    <div
                      className="form-input searchable-dropdown-trigger"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span style={{ color: department ? 'inherit' : '#9CA3AF' }}>
                        {department || 'Select your department'}
                      </span>
                      <span style={{
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: '0.8rem', color: 'var(--color-text-muted)'
                      }}>▼</span>
                    </div>
                    {isDropdownOpen && (
                      <div className="searchable-dropdown-menu">
                        <div className="searchable-dropdown-search-wrapper">
                          <input
                            type="text"
                            className="form-input searchable-dropdown-search"
                            placeholder="Search department..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                        <div className="searchable-dropdown-list">
                          {Object.keys(getGroupedDepts()).length > 0 ? (
                            Object.entries(getGroupedDepts()).map(([facultyName, deptList]) => (
                              <div key={facultyName}>
                                <div style={{
                                  padding: '8px 12px 4px 12px',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  color: 'var(--color-primary, #10B981)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  borderBottom: '1px solid rgba(var(--color-primary-rgb), 0.1)',
                                  marginBottom: '4px',
                                  marginTop: '4px'
                                }}>
                                  {facultyName}
                                </div>
                                {deptList.map(d => (
                                  <div
                                    key={d._id}
                                    className={`searchable-dropdown-item ${department === d.name ? 'active' : ''}`}
                                    onClick={() => {
                                      setDepartment(d.name);
                                      setDepartmentId(d._id);
                                      setIsDropdownOpen(false);
                                      setSearchQuery('');
                                      setFieldErrors(prev => ({ ...prev, department: null }));
                                    }}
                                    style={{
                                      paddingLeft: '24px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {d.name}
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '10px', color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                              No departments found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {fieldErrors.department && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.department}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      setFieldErrors(prev => ({ ...prev, name: null }));
                    }}
                    required
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="Enter your email id"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      setFieldErrors(prev => ({ ...prev, username: null }));
                    }}
                    required
                  />
                  {fieldErrors.username && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.username}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number (Indian Format) <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Enter 10-digit mobile number e.g. 9876543210"
                    value={phoneNumber}
                    onChange={e => {
                      setPhoneNumber(e.target.value);
                      setFieldErrors(prev => ({ ...prev, phoneNumber: null }));
                    }}
                    required
                  />
                  {fieldErrors.phoneNumber && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.phoneNumber}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Password <span style={{ color: '#EF4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setFieldErrors(prev => ({ ...prev, password: null }));
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password <span style={{ color: '#EF4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showConfirmPwd ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {showConfirmPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </>
            )}

            {role && (
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || (role === 'STUDENT' && departmentId && !hasPhdForDept)}
                style={{
                  display: 'block', width: '100%', textAlign: 'center', marginTop: '24px', cursor: 'pointer',
                  opacity: (role === 'STUDENT' && departmentId && !hasPhdForDept) ? 0.5 : 1
                }}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            )}
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: '#133A26', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
