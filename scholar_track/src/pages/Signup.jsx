import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Signup = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [depts, setDepts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const dashMap = {
    SUPER_ADMIN: '/super-dashboard',
    HOD: '/hod-dashboard',
    ADMIN: '/hod-dashboard',
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !username || !password || !department || !phoneNumber) {
      setError('Please fill in all fields');
      return;
    }

    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      setError('Please enter a valid 10-digit Indian phone number (starts with 6-9).');
      return;
    }

    setLoading(true);
    const result = await register({ name, username, password, role, department, phoneNumber });
    if (result.success) {
      navigate(dashMap[result.role] ?? '/student-dashboard');
    } else {
      setError(result.message ?? 'Registration failed.');
      setLoading(false);
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
          style={{ maxWidth: '500px', margin: '40px auto' }}
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

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px', borderRadius: 'var(--radius)',
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#EF4444', fontSize: '0.85rem', fontWeight: 500, marginBottom: '20px'
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input 
                className="form-input" 
                placeholder="Enter your full name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Username) <span className="required">*</span></label>
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
              <label className="form-label">Phone Number (Indian Format) <span className="required">*</span></label>
              <input 
                className="form-input" 
                placeholder="Enter 10-digit mobile number e.g. 9876543210" 
                value={phoneNumber} 
                onChange={e => setPhoneNumber(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
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
                    transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                    fontSize: '0.8rem',
                    color: '#6B7280'
                  }}>
                    ▼
                  </span>
                </div>

                {isDropdownOpen && (
                  <div className="searchable-dropdown-menu">
                    <div className="searchable-dropdown-search-wrapper">
                      <input 
                        type="text"
                        className="form-input searchable-dropdown-search"
                        placeholder="Search department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
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
              <label className="form-label">Role <span className="required">*</span></label>
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

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%', marginTop: '16px' }}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </motion.button>
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
