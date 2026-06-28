import React, { useState, useContext, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useThemeStyles } from '../context/ThemeContext';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useContext(AuthContext);
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
            toast.warning('You are already logged in. Please sign out to log in again or sign up.');
            const dashMap = { SUPER_ADMIN: '/super-dashboard', ADMIN: '/admin-dashboard', HOD: '/admin-dashboard', FACULTY: '/faculty-dashboard', STUDENT: '/student-dashboard' };
            navigate(dashMap[storedUser.role] ?? '/student-dashboard');
            return;
          }
        }
      } catch { /* token invalid, let them stay */ }
    }
  }, [navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoggingIn(true);
    const result = await login(username, password);
    if (result.success) {
      if (result.role === 'SUPER_ADMIN') navigate('/super-dashboard');
      else if (result.role === 'ADMIN' || result.role === 'HOD') navigate('/admin-dashboard');
      else if (result.role === 'FACULTY') navigate('/faculty-dashboard');
      else navigate('/student-dashboard');
    } else {
      setError(result.message);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="subpage-container">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      {isLoggingIn && (
        <div className="login-preloader-overlay">
          <div className="login-preloader-container">
            <div className="login-preloader-glow"></div>
            <div className="login-preloader-ring-wrapper">
              <div className="login-preloader-ring"></div>
              <img src="/hpu_logo.png" alt="ScholarSync Logo" className="login-preloader-logo" style={{ objectFit: 'contain' }} />
            </div>
            <div className="login-preloader-text-container">
              <h2 className="login-preloader-title">ScholarSync</h2>
              <div className="login-preloader-status">
                <span className="status-dot"></span>
                <span className="status-dot"></span>
                <span className="status-dot"></span>
                <span className="login-preloader-text">Authenticating credentials</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <div className="glass-panel auth-panel" style={{ margin: 0 }}>
          <h1 className="page-title">Welcome Back</h1>
          <p className="page-desc">Log in to access your ScholarSync dashboard.</p>
          
          {error && <div style={{ color: theme.error, marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username (Email ID)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your email id"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
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
                style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '24px', cursor: 'pointer' }}>
              Log In
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: theme.textSecondary }}>
            Don't have an account? <Link to="/signup" style={{ color: theme.primary, fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
