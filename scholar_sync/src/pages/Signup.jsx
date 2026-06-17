import React, { useState, useContext, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const Signup = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [depts, setDepts] = useState([]);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

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

    const result = await register({ name, username, password, role, department, phoneNumber });
    if (result.success) {
      if (result.role === 'ADMIN' || result.role === 'HOD') navigate('/admin-dashboard');
      else if (result.role === 'FACULTY') navigate('/faculty-dashboard');
      else navigate('/student-dashboard');
    } else {
      setError(result.message);
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
        <div className="glass-panel auth-panel" style={{ margin: 0 }}>
          <h1 className="page-title">Join ScholarSync</h1>
          <p className="page-desc">Create your credentials to join your department.</p>
          
          {error && (
            <div style={{ 
              color: '#DC2626', 
              background: '#FEF2F2', 
              border: '1px solid #FEE2E2', 
              padding: '10px', 
              borderRadius: '8px', 
              marginBottom: '15px', 
              textAlign: 'center',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter your full name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address (Username)</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="Enter your email id" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (Indian Format)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter 10-digit mobile number e.g. 9876543210" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
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
            <button type="submit" className="btn-primary" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '24px', cursor: 'pointer' }}>
              Create Account
            </button>
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
