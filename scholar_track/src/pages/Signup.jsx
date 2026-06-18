import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ChevronDown } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [department, setDepartment] = useState('');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Applied Physics',
    'Applied Chemistry',
    'Business Administration'
  ]);
  
  const { register, user, loading } = useContext(AuthContext);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'SUPER_ADMIN') navigate('/super-dashboard');
      else if (user.role === 'HOD') navigate('/hod-dashboard');
      else if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else if (user.role === 'FACULTY') navigate('/faculty-dashboard');
      else navigate('/student-dashboard');
    }
  }, [user, loading, navigate]);

  // Fetch departments from server on mount
  useEffect(() => {
    fetch(`${API_URL}/departments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Map backend department names
          setDepartmentsList(data.map(d => d.name));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch departments, falling back to static list:', err);
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !phoneNumber || !password || !department) {
      setError('Please fill in all fields.');
      return;
    }

    // Indian phone format validation: 10-digit starting with 6-9
    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      setError('Please enter a valid 10-digit Indian phone number (starting with 6-9).');
      return;
    }

    setIsRegistering(true);

    // Call actual backend registration!
    const result = await register({
      name,
      username: email,
      password,
      role,
      department,
      phoneNumber: cleanedPhone
    });

    if (result.success) {
      setTimeout(() => {
        setIsRegistering(false);
        navigate('/login');
      }, 1500);
    } else {
      setIsRegistering(false);
      setError(result.message || 'Registration failed.');
    }
  };

  const filteredDepts = departmentsList.filter(d => 
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="subpage-container">
      {/* Liquid backgrounds */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      {isRegistering && (
        <div className="login-preloader-overlay">
          <div className="login-preloader-container">
            <div className="login-preloader-ring-wrapper">
              <div className="login-preloader-ring"></div>
              <img src="/hpu_logo.png" alt="HPU Logo" className="login-preloader-logo" style={{ objectFit: 'contain' }} />
            </div>
            <div className="login-preloader-text-container">
              <h2 className="login-preloader-title">Registering Account</h2>
              <div className="login-preloader-status">
                <span className="status-dot"></span>
                <span className="status-dot"></span>
                <span className="status-dot"></span>
                <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 600 }}>Provisioning credentials & database nodes...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div className="glass-panel auth-panel" style={{ maxWidth: '540px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div className="landing-logo-wrapper" style={{ width: '48px', height: '48px' }}>
              <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 className="page-title">Register Profile</h1>
          <p className="page-desc">Create your credentials to connect with ScholarTrack.</p>

          {error && (
            <div style={{ 
              color: '#DC2626', 
              background: '#FEF2F2', 
              border: '1px solid #FEE2E2', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              marginBottom: '20px', 
              textAlign: 'center',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <User size={16} />
                </span>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Username)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Mail size={16} />
                </span>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Enter email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Indian Format)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Phone size={16} />
                </span>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter 10-digit number e.g. 9876543210" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Lock size={16} />
                </span>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {/* Custom Searchable Department Dropdown */}
            <div className="form-group">
              <label className="form-label">Department</label>
              <div className="searchable-dropdown-container" ref={dropdownRef}>
                <div 
                  className="form-input searchable-dropdown-trigger" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ color: department ? 'inherit' : 'var(--color-text-muted)' }}>
                    {department || 'Select Department'}
                  </span>
                  <ChevronDown size={16} style={{ 
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.2s ease',
                    color: 'var(--color-text-muted)'
                  }} />
                </div>

                {isDropdownOpen && (
                  <div className="searchable-dropdown-menu">
                    <div className="searchable-dropdown-search-wrapper">
                      <input 
                        type="text"
                        className="form-input searchable-dropdown-search"
                        placeholder="Search departments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <div className="searchable-dropdown-list">
                      {filteredDepts.length > 0 ? (
                        filteredDepts.map((d, index) => (
                          <div
                            key={index}
                            className={`searchable-dropdown-item ${department === d ? 'active' : ''}`}
                            onClick={() => {
                              setDepartment(d);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                          >
                            {d}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '10px', color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                          No departments match query
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Role</label>
              <select 
                className="form-input" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="STUDENT">Student / Scholar</option>
                <option value="FACULTY">Faculty / Supervisor</option>
                <option value="HOD">Head of Department (HOD)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px' }}>
              Register Profile
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            Already registered? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Sign In</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signup;
