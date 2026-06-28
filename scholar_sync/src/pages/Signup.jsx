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
  const [hasPhdForDept, setHasPhdForDept] = useState(false);
  const [phdDegreeNames, setPhdDegreeNames] = useState([]);

  const [error, setError] = useState('');
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
    fetchDegreeNames();
    fetchSessions();
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
    setError('');

    if (!role) {
      setError('Please select a role to continue.');
      return;
    }

    // Common validations
    if (!username || !password || !confirmPassword || !department || !phoneNumber) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Student-specific validations (PhD only)
    if (role === 'STUDENT') {
      if (!academicSession) {
        setError('Please select an academic session.');
        return;
      }
      if (!hasPhdForDept) {
        setError('No PhD programme is mapped under the selected department. Please choose a department that offers PhD, or contact your department administrator.');
        return;
      }
    }

    // Faculty/HOD validations
    if ((role === 'FACULTY' || role === 'HOD') && !name) {
      setError('Please enter your full name.');
      return;
    }

    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      setError('Please enter a valid 10-digit Indian phone number (starts with 6-9).');
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
      userData.academicSession = academicSession;
      userData.degreeTypeId = phdDegreeTypeId;
      userData.degreeTypeName = phdDegreeTypeName;
      // Include first PhD degree name for this department as degreeName info
      if (phdDegreeNames.length > 0) {
        userData.degreeNameId = phdDegreeNames[0]._id;
        userData.degreeNameLabel = phdDegreeNames[0].name;
      }
    } else {
      userData.name = name;
    }

    const result = await register(userData);
    if (result.success) {
      navigate(dashMap[result.role] ?? '/student-dashboard');
    } else {
      setError(result.message ?? 'Registration failed.');
      setLoading(false);
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

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '15px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#EF4444', fontSize: '0.85rem', fontWeight: 500,
              display: 'flex', alignItems: 'flex-start', gap: '8px'
            }}>
              {error.includes('No PhD') && (
                <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠</span>
              )}
              {error}
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
                  setError('');
                  setAcademicSession('');
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
            </div>

            {/* STUDENT FIELDS (PhD only) */}
            {role === 'STUDENT' && (
              <>
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
                          {depts.filter(d =>
                            d.name.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length > 0 ? (
                            depts
                              .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map(d => (
                                <div
                                  key={d._id}
                                  className={`searchable-dropdown-item ${department === d.name ? 'active' : ''}`}
                                  onClick={() => {
                                    setDepartment(d.name);
                                    setDepartmentId(d._id);
                                    setIsDropdownOpen(false);
                                    setSearchQuery('');
                                    if (error.includes('No PhD')) setError('');
                                  }}
                                  style={{
                                    color: theme.textPrimary,
                                    backgroundColor: department === d.name ? theme.primaryLight : 'transparent',
                                    '&:hover': { backgroundColor: theme.dropdownItemHover },
                                  }}
                                >
                                  {d.name}
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
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', padding: '10px 0' }}>
                      Please select a department first to auto-detect the PhD programme
                    </div>
                  )}
                </div>

                {/* Show available PhD degree names as info (read-only) */}
                {departmentId && hasPhdForDept && phdDegreeNames.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Available PhD Programmes</label>
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: '6px',
                      padding: '4px 0'
                    }}>
                      {phdDegreeNames.map(dn => (
                        <span key={dn._id} style={{
                          padding: '4px 12px', borderRadius: '20px',
                          background: 'rgba(19, 58, 38, 0.06)',
                          border: '1px solid rgba(19, 58, 38, 0.12)',
                          fontSize: '0.8rem', color: '#133A26', fontWeight: 500
                        }}>
                          {dn.name} ({dn.code})
                        </span>
                      ))}
                    </div>
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
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address <span style={{ color: theme.error }}>*</span></label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="Enter your email id"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number (Indian Format) <span style={{ color: theme.error }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Enter 10-digit mobile number e.g. 9876543210"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    required
                    style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password <span style={{ color: theme.error }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
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
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password <span style={{ color: theme.error }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showConfirmPwd ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
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
                        fontSize: '0.8rem', color: '#6B7280'
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
                          {depts.filter(d =>
                            d.name.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length > 0 ? (
                            depts
                              .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map(d => (
                                <div
                                  key={d._id}
                                  className={`searchable-dropdown-item ${department === d.name ? 'active' : ''}`}
                                  onClick={() => {
                                    setDepartment(d.name);
                                    setDepartmentId(d._id);
                                    setIsDropdownOpen(false);
                                    setSearchQuery('');
                                  }}
                                >
                                  {d.name}
                                </div>
                              ))
                          ) : (
                            <div style={{ padding: '10px', color: '#6B7280', fontSize: '0.9rem', textAlign: 'center' }}>
                              No departments found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="Enter your email id"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number (Indian Format) <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="Enter 10-digit mobile number e.g. 9876543210"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password <span style={{ color: '#EF4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', color: '#6B7280',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password <span style={{ color: '#EF4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showConfirmPwd ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', color: '#6B7280',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {showConfirmPwd ? '🙈' : '👁'}
                    </button>
                  </div>
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

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#4B5563' }}>
            Already have an account? <Link to="/login" style={{ color: '#133A26', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
