import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';



const Signup = () => {
  const { register } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();

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
            const dashMap = { SUPER_ADMIN: '/super-dashboard', HOD: '/hod-dashboard', ADMIN: '/hod-dashboard', FACULTY: '/faculty-dashboard', STUDENT: '/student-dashboard' };
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
  const [degreeTypeId, setDegreeTypeId] = useState('');
  const [degreeNameId, setDegreeNameId] = useState('');
  const [degreeTypeOptions, setDegreeTypeOptions] = useState([]);
  const [degreeNameOptions, setDegreeNameOptions] = useState([]);
  const [allDegreeNames, setAllDegreeNames] = useState([]);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [degreeNameDropdownOpen, setDegreeNameDropdownOpen] = useState(false);
  const [degreeNameSearch, setDegreeNameSearch] = useState('');
  const [degreeTypeDropdownOpen, setDegreeTypeDropdownOpen] = useState(false);
  const [degreeTypeSearch, setDegreeTypeSearch] = useState('');

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
  const degreeNameDropdownRef = useRef(null);
  const degreeTypeDropdownRef = useRef(null);

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

  // When department changes, filter degree types from degree names belonging to that department
  useEffect(() => {
    if (!departmentId) {
      setDegreeTypeOptions([]);
      setDegreeNameOptions([]);
      return;
    }
    const deptDegreeNames = allDegreeNames.filter(
      dn => (dn.departmentId?._id || dn.departmentId) === departmentId
    );
    // Extract unique degree types from those degree names
    const typeMap = {};
    deptDegreeNames.forEach(dn => {
      const dt = dn.degreeTypeId;
      if (dt && !typeMap[dt._id]) {
        typeMap[dt._id] = { value: dt._id, label: `${dt.name} (${dt.code})` };
      }
    });
    setDegreeTypeOptions(Object.values(typeMap));
    setDegreeNameOptions([]);
    setDegreeTypeId('');
    setDegreeNameId('');
  }, [departmentId, allDegreeNames]);

  // When degree type changes, filter degree names for that department + type
  useEffect(() => {
    if (!degreeTypeId || !departmentId) {
      setDegreeNameOptions([]);
      return;
    }
    const filtered = allDegreeNames.filter(dn => {
      const deptMatch = (dn.departmentId?._id || dn.departmentId) === departmentId;
      const typeMatch = (dn.degreeTypeId?._id || dn.degreeTypeId) === degreeTypeId;
      return deptMatch && typeMatch;
    });
    setDegreeNameOptions(filtered.map(dn => ({ value: dn._id, label: dn.name, code: dn.code })));
    setDegreeNameId('');
  }, [degreeTypeId, departmentId, allDegreeNames]);

  const dashMap = {
    HOD: '/hod-dashboard',
    FACULTY: '/faculty-dashboard',
    STUDENT: '/student-dashboard',
  };

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (degreeNameDropdownRef.current && !degreeNameDropdownRef.current.contains(event.target)) {
        setDegreeNameDropdownOpen(false);
      }
      if (degreeTypeDropdownRef.current && !degreeTypeDropdownRef.current.contains(event.target)) {
        setDegreeTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPhdSelected = role === 'STUDENT' && degreeTypeId && degreeTypeOptions.find(t => t.value === degreeTypeId)?.label?.toUpperCase().includes('PHD');

  const handleDegreeTypeChange = (val) => {
    setDegreeTypeId(val);
    const selectedType = degreeTypeOptions.find(t => t.value === val);
    if (selectedType?.label?.toUpperCase().includes('PHD')) {
      setError('PhD candidates must sign up using the ScholarSync portal only. Please visit scholar_sync portal to complete your registration.');
    } else {
      if (error.includes('PhD candidates')) setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const newErrors = {};

    if (!role) {
      newErrors.role = 'Please select a role to continue.';
    }

    // PhD block
    if (isPhdSelected) {
      newErrors.degreeTypeId = 'PhD candidates must sign up using the ScholarSync portal only. Please visit scholar_sync portal to complete your registration.';
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

    // Student-specific validations
    if (role === 'STUDENT') {
      if (!name) newErrors.name = 'Please enter your full name.';
      if (!academicSession) newErrors.academicSession = 'Please select an academic session.';
      if (!degreeTypeId) newErrors.degreeTypeId = 'Please select a degree type.';
      if (!degreeNameId) newErrors.degreeNameId = 'Please select a degree name.';
      if (!gender) newErrors.gender = 'Please select a gender.';
      if (!category) newErrors.category = 'Please select a category.';
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
      const selectedType = degreeTypeOptions.find(t => t.value === degreeTypeId);
      const selectedName = degreeNameOptions.find(n => n.value === degreeNameId);
      userData.name = name;
      userData.academicSession = academicSession;
      userData.degreeTypeId = degreeTypeId;
      userData.degreeTypeName = selectedType?.label || '';
      userData.degreeNameId = degreeNameId;
      userData.degreeNameLabel = selectedName?.label || '';
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {loading && (
        <div className="login-preloader-overlay">
          <div className="login-preloader-container">
            <div className="login-preloader-ring-wrapper">
              <div className="login-preloader-ring" />
            </div>
            <div className="login-preloader-text">Creating your account...</div>
          </div>
        </div>
      )}

      <Navbar />

      <div className="auth-page" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="liquid-bg-wrapper">
          <div className="liquid-blob blob-1" />
          <div className="liquid-blob blob-2" />
          <div className="liquid-blob blob-3" />
        </div>

        <motion.div
          className="auth-panel glass-panel"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ maxWidth: '520px', margin: '40px auto', width: '100%' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#fff'
            }}>
              <BarChart3 size={28} />
            </div>
          </div>

          <h1 className="page-title">Create Account</h1>
          <p className="page-desc">Join ScholarTrack in just a few steps</p>

          {fieldErrors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px', borderRadius: 'var(--radius)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#EF4444', fontSize: '0.85rem', fontWeight: 500,
                marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px'
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              {fieldErrors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ROLE SELECTOR — Always first */}
            <div className="form-group">
              <label className="form-label">Select Your Role <span className="required">*</span></label>
              <select
                className="form-input"
                value={role}
                onChange={e => {
                  setRole(e.target.value);
                  setFieldErrors({});
                  setDegreeTypeId('');
                  setDegreeNameId('');
                  setDegreeTypeOptions([]);
                  setDegreeNameOptions([]);
                  setAcademicSession('');
                  setGender('');
                  setCategory('');
                  setName('');
                }}
                required
              >
                <option value="">-- Select Role --</option>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty / Supervisor</option>
                <option value="HOD">Head of Department (HOD)</option>
              </select>
              {fieldErrors.role && (
                <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                  ⚠ {fieldErrors.role}
                </span>
              )}
            </div>

            {/* STUDENT FIELDS */}
            {role === 'STUDENT' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                  {fieldErrors.name && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Department <span className="required">*</span></label>
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
                                      setDegreeTypeId('');
                                      setDegreeNameId('');
                                      setDegreeTypeOptions([]);
                                      setDegreeNameOptions([]);
                                      setFieldErrors(prev => ({ ...prev, department: null, degreeTypeId: null }));
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
                  <label className="form-label">Academic Session <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={academicSession}
                    onChange={e => setAcademicSession(e.target.value)}
                    required
                  >
                    <option value="">-- Select Session --</option>
                    {sessionOptions.map(s => (
                      <option key={s._id} value={s.sessionName}>{s.sessionName}</option>
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
                  <label className="form-label">Gender <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    required
                  >
                    <option value="">-- Select Gender --</option>
                    {genderOptions.map(g => (
                      <option key={g._id} value={g.value}>{g.label}</option>
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
                  <label className="form-label">Category <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categoryOptions.map(c => (
                      <option key={c._id} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.category}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Degree Type <span className="required">*</span></label>
                  <div className="searchable-dropdown-container" ref={degreeTypeDropdownRef}>
                    <div
                      className="form-input searchable-dropdown-trigger"
                      onClick={() => departmentId && setDegreeTypeDropdownOpen(!degreeTypeDropdownOpen)}
                      style={{ opacity: !departmentId ? 0.5 : 1, cursor: !departmentId ? 'not-allowed' : 'pointer' }}
                    >
                      <span style={{ color: degreeTypeId ? 'inherit' : '#9CA3AF' }}>
                        {degreeTypeId
                          ? degreeTypeOptions.find(t => t.value === degreeTypeId)?.label
                          : 'Select degree type'}
                      </span>
                      <span style={{
                        transform: degreeTypeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: '0.8rem', color: 'var(--color-text-muted)'
                      }}>▼</span>
                    </div>
                    {degreeTypeDropdownOpen && departmentId && (
                      <div className="searchable-dropdown-menu">
                        <div className="searchable-dropdown-search-wrapper">
                          <input
                            type="text"
                            className="form-input searchable-dropdown-search"
                            placeholder="Search degree type..."
                            value={degreeTypeSearch}
                            onChange={e => setDegreeTypeSearch(e.target.value)}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                        <div className="searchable-dropdown-list">
                          {degreeTypeOptions.filter(t =>
                            t.label.toLowerCase().includes(degreeTypeSearch.toLowerCase())
                          ).length > 0 ? (
                            degreeTypeOptions
                              .filter(t => t.label.toLowerCase().includes(degreeTypeSearch.toLowerCase()))
                              .map(dt => (
                                <div
                                  key={dt.value}
                                  className={`searchable-dropdown-item ${degreeTypeId === dt.value ? 'active' : ''}`}
                                  onClick={() => {
                                    handleDegreeTypeChange(dt.value);
                                    setDegreeTypeDropdownOpen(false);
                                    setDegreeTypeSearch('');
                                  }}
                                >
                                  {dt.label}
                                </div>
                              ))
                          ) : (
                            <div style={{ padding: '10px', color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                              No degree types found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {!departmentId && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Please select a department first
                    </div>
                  )}
                  {departmentId && degreeTypeOptions.length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px' }}>
                      No degree types available for this department
                    </div>
                  )}
                  {isPhdSelected && (
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EF4444', marginTop: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '8px 12px', borderRadius: 'var(--radius)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span>PhD candidates must sign up using the ScholarSync portal only. Please visit scholar_sync portal to complete your registration.</span>
                    </div>
                  )}
                  {fieldErrors.degreeTypeId && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.degreeTypeId}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Degree Name <span className="required">*</span></label>
                  <div className="searchable-dropdown-container" ref={degreeNameDropdownRef}>
                    <div
                      className="form-input searchable-dropdown-trigger"
                      onClick={() => degreeTypeId && setDegreeNameDropdownOpen(!degreeNameDropdownOpen)}
                      style={{ opacity: !degreeTypeId ? 0.5 : 1, cursor: !degreeTypeId ? 'not-allowed' : 'pointer' }}
                    >
                      <span style={{ color: degreeNameId ? 'inherit' : '#9CA3AF' }}>
                        {degreeNameId
                          ? degreeNameOptions.find(n => n.value === degreeNameId)?.label
                          : 'Select degree name'}
                      </span>
                      <span style={{
                        transform: degreeNameDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: '0.8rem', color: 'var(--color-text-muted)'
                      }}>▼</span>
                    </div>
                    {degreeNameDropdownOpen && degreeTypeId && (
                      <div className="searchable-dropdown-menu">
                        <div className="searchable-dropdown-search-wrapper">
                          <input
                            type="text"
                            className="form-input searchable-dropdown-search"
                            placeholder="Search degree name..."
                            value={degreeNameSearch}
                            onChange={e => setDegreeNameSearch(e.target.value)}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                        <div className="searchable-dropdown-list">
                          {degreeNameOptions.filter(n =>
                            n.label.toLowerCase().includes(degreeNameSearch.toLowerCase()) ||
                            n.code?.toLowerCase().includes(degreeNameSearch.toLowerCase())
                          ).length > 0 ? (
                            degreeNameOptions
                              .filter(n =>
                                n.label.toLowerCase().includes(degreeNameSearch.toLowerCase()) ||
                                n.code?.toLowerCase().includes(degreeNameSearch.toLowerCase())
                              )
                              .map(dn => (
                                <div
                                  key={dn.value}
                                  className={`searchable-dropdown-item ${degreeNameId === dn.value ? 'active' : ''}`}
                                  onClick={() => {
                                    setDegreeNameId(dn.value);
                                    setDegreeNameDropdownOpen(false);
                                    setDegreeNameSearch('');
                                  }}
                                >
                                  {dn.label} ({dn.code})
                                </div>
                              ))
                          ) : (
                            <div style={{ padding: '10px', color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                              No degree names found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {!degreeTypeId && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Please select a degree type first
                    </div>
                  )}
                  {degreeTypeId && degreeNameOptions.length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px' }}>
                      No degree names available for this combination
                    </div>
                  )}
                  {fieldErrors.degreeNameId && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.degreeNameId}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address <span className="required">*</span></label>
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
                  <label className="form-label">Phone Number (Indian Format) <span className="required">*</span></label>
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
                  <label className="form-label">Password <span className="required">*</span></label>
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
                        background: 'none', border: 'none', cursor: 'pointer'
                      }}
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password <span className="required">*</span></label>
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
                        background: 'none', border: 'none', cursor: 'pointer'
                      }}
                    >
                      {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  <label className="form-label">Department <span className="required">*</span></label>
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
                  <label className="form-label">Full Name <span className="required">*</span></label>
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
                  <label className="form-label">Email Address <span className="required">*</span></label>
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
                  <label className="form-label">Phone Number (Indian Format) <span className="required">*</span></label>
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
                  <label className="form-label">Password <span className="required">*</span></label>
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
                        background: 'none', border: 'none', cursor: 'pointer'
                      }}
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span style={{ color: '#EF4444', fontSize: '0.82rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                      ⚠ {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password <span className="required">*</span></label>
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
                        background: 'none', border: 'none', cursor: 'pointer'
                      }}
                    >
                      {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
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
              <motion.button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading || isPhdSelected}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', marginTop: '16px', opacity: isPhdSelected ? 0.5 : 1 }}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </motion.button>
            )}
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)' }}>← Back to Home</Link>
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Signup;
