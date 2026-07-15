import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

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
  const [verifying, setVerifying] = useState(!!token);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!token) return;
    const verifyToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-reset-token?token=${token}`);
        if (response.ok) {
          setIsValidToken(true);
        } else {
          const data = await response.json();
          setGeneralError(data.message || 'The password reset link is invalid or has expired.');
          setIsValidToken(false);
        }
      } catch (err) {
        console.error(err);
        setGeneralError('Connection to server failed. Could not verify reset link.');
        setIsValidToken(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyToken();
  }, [token]);

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
              <KeyRound size={28} />
            </div>
          </div>

          <h1 className="page-title">Reset Password</h1>
          <p className="page-desc">Choose a strong, secure new password for your account.</p>

          {generalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px', borderRadius: 'var(--radius)',
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#EF4444', fontSize: '0.85rem', fontWeight: 500, marginBottom: '20px'
              }}
            >
              ⚠ {generalError}
            </motion.div>
          )}

          {verifying ? (
            <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--color-text-secondary)' }}>
              Verifying your password reset link...
            </div>
          ) : !isValidToken ? (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {generalError || 'The password reset link appears to be invalid or incomplete. Please request a new recovery email.'}
              </p>
              <Link to="/forgot-password" className="btn btn-primary btn-lg" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '16px' }}>
                Go to Forgot Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">New Password <span className="required">*</span></label>
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
                <label className="form-label">Confirm New Password <span className="required">*</span></label>
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

              <motion.button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', marginTop: '24px' }}
              >
                {loading ? 'Saving Password...' : 'Save Password'}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
