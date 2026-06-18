import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [preloaderStep, setPreloaderStep] = useState('');
  
  const { login, user, loading } = useContext(AuthContext);
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoggingIn(true);
    setPreloaderStep('Authenticating credentials...');
    
    const result = await login(email, password);
    
    if (result.success) {
      setTimeout(() => {
        setPreloaderStep('Opening secure database vault...');
      }, 800);

      setTimeout(() => {
        setPreloaderStep('Establishing encrypted session token...');
      }, 1600);

      setTimeout(() => {
        setPreloaderStep('Access Granted! Redirecting...');
      }, 2400);

      setTimeout(() => {
        setIsLoggingIn(false);
        if (result.role === 'SUPER_ADMIN') navigate('/super-dashboard');
        else if (result.role === 'HOD') navigate('/hod-dashboard');
        else if (result.role === 'ADMIN') navigate('/admin-dashboard');
        else if (result.role === 'FACULTY') navigate('/faculty-dashboard');
        else navigate('/student-dashboard');
      }, 3200);
    } else {
      setIsLoggingIn(false);
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="subpage-container">
      {/* Liquid animated backgrounds */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      {isLoggingIn && (
        <div className="login-preloader-overlay">
          <div className="login-preloader-container">
            <div className="login-preloader-ring-wrapper">
              <div className="login-preloader-ring"></div>
              <img src="/hpu_logo.png" alt="HPU Logo" className="login-preloader-logo" style={{ objectFit: 'contain' }} />
            </div>
            <div className="login-preloader-text-container">
              <h2 className="login-preloader-title">ScholarTrack Portal</h2>
              <div className="login-preloader-status">
                <span className="status-dot"></span>
                <span className="status-dot"></span>
                <span className="status-dot"></span>
                <span style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 600 }}>{preloaderStep}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div className="glass-panel auth-panel">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div className="landing-logo-wrapper" style={{ width: '48px', height: '48px' }}>
              <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
            </div>
          </div>
          <h1 className="page-title">Welcome Back</h1>
          <p className="page-desc">Sign in to check attendance logs or submit leaves.</p>

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

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email ID</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Mail size={16} />
                </span>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Enter email id" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
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

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px' }}>
              Verify & Sign In
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            Need an account? <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Register Profile</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
