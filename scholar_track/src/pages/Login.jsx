import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { jwtDecode } from 'jwt-decode';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Login = () => {
  const { login } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();
  const toastFired = useRef(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle toast query parameter from logout redirect
  useEffect(() => {
    if (toastFired.current) return;
    const params = new URLSearchParams(window.location.search);
    const toastMsg = params.get('toast');
    if (toastMsg) {
      toastFired.current = true;
      toast.success(toastMsg);
      // Clean the URL without triggering React re-render
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

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
            const dashMap = { SUPER_ADMIN: '/super-dashboard', HOD: '/hod-dashboard', ADMIN: '/hod-dashboard', FACULTY: '/faculty-dashboard', STUDENT: '/student-dashboard' };
            if (storedUser.role === 'SUPER_ADMIN' && !localStorage.getItem('login_origin')) {
              localStorage.setItem('login_origin', 'track');
            }
            navigate(dashMap[storedUser.role] ?? '/student-dashboard');
            return;
          }
        }
      } catch { /* token invalid, let them stay */ }
    }
  }, [navigate, toast]);

  const dashMap = {
    SUPER_ADMIN: '/super-dashboard',
    HOD: '/hod-dashboard',
    ADMIN: '/hod-dashboard',
    FACULTY: '/faculty-dashboard',
    STUDENT: '/student-dashboard',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username, password);
    if (result.success) {
      if (result.role === 'SUPER_ADMIN') {
        localStorage.setItem('login_origin', 'track');
      }
      navigate(dashMap[result.role] ?? '/student-dashboard');
    } else {
      setLoading(false);
      if (result.emailPending) {
        navigate(`/verify-email-pending?email=${encodeURIComponent(result.username)}`);
      } else {
        setError(result.message ?? 'Authentication failed.');
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
            <div className="login-preloader-text">Authenticating credentials...</div>
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
          style={{ margin: '40px auto' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#fff'
            }}>
              <BarChart3 size={28} />
            </div>
          </div>

          <h1 className="page-title">Welcome Back</h1>
          <p className="page-desc">Sign in to your ScholarTrack account</p>

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
              <label className="form-label">Username (Email ID)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your email id"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

             <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
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
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot Password?
                </Link>
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Create one</Link>
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

export default Login;
