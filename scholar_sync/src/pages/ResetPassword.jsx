import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useThemeStyles } from '../context/ThemeContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useThemeStyles();

  const validatePassword = () => {
    const errors = {};
    if (!password) {
      errors.password = 'New password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
      if (!passwordRegex.test(password)) {
        errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.';
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    if (!token) {
      setGeneralError('Invalid reset token or missing link parameters.');
      return;
    }

    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully.');
        navigate('/login');
      } else {
        setGeneralError(data.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      console.error(err);
      setGeneralError('Server connection failed. Please try again later.');
    } finally {
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
        <div className="glass-panel auth-panel" style={{ margin: 0 }}>
          <h1 className="page-title">Reset Password</h1>
          <p className="page-desc">Choose a strong, secure new password for your account.</p>
          
          {generalError && (
            <div style={{ 
              color: theme.error, 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px', 
              textAlign: 'center', 
              fontSize: '0.9rem' 
            }}>
              ⚠ {generalError}
            </div>
          )}

          {!token ? (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <p style={{ color: theme.textSecondary }}>The password reset link appears to be invalid or incomplete. Please request a new recovery email.</p>
              <Link to="/forgot-password" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '16px' }}>
                Go to Forgot Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Password <span style={{ color: theme.error }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => {
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
                <label className="form-label">Confirm New Password <span style={{ color: theme.error }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showConfirmPwd ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
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

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '24px', cursor: 'pointer' }}
              >
                {loading ? 'Saving Password...' : 'Save Password'}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
