import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const roleOptions = [
  { value: 'STUDENT', label: 'Student / Scholar', desc: 'Track your attendance and apply for leave' },
  { value: 'FACULTY', label: 'Faculty / Supervisor', desc: 'Mark attendance and manage student leaves' },
];

const departmentOptions = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biotechnology',
  'Commerce', 'Economics', 'English', 'Hindi', 'Law', 'Education', 'Management'
];

const Signup = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', username: '', password: '', confirmPassword: '',
    role: 'STUDENT', department: 'Computer Science'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const dashMap = {
    FACULTY: '/faculty-dashboard',
    STUDENT: '/student-dashboard',
  };

  const updateField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const nextStep = () => {
    if (step === 1) {
      if (!form.name.trim() || !form.username.trim()) {
        setError('Name and username are required.');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    const result = await register({
      name: form.name,
      username: form.username,
      password: form.password,
      role: form.role,
      department: form.department,
    });

    if (result.success) {
      navigate(dashMap[result.role] ?? '/student-dashboard');
    } else {
      setError(result.message ?? 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <>
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

      <div className="auth-page">
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
          style={{ maxWidth: '500px' }}
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

          {/* Step Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {[1, 2].map(s => (
              <div
                key={s}
                style={{
                  width: s === step ? '28px' : '10px', height: '6px',
                  borderRadius: '10px', transition: 'all 0.3s',
                  background: s === step ? 'var(--color-primary)' : 'var(--color-border-solid)'
                }}
              />
            ))}
          </div>

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
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="required">*</span></label>
                    <input className="form-input" placeholder="Enter your full name" value={form.name} onChange={e => updateField('name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username <span className="required">*</span></label>
                    <input className="form-input" placeholder="Choose a unique username" value={form.username} onChange={e => updateField('username', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {roleOptions.map(opt => (
                        <div
                          key={opt.value}
                          onClick={() => updateField('role', opt.value)}
                          style={{
                            padding: '14px 16px', borderRadius: 'var(--radius)',
                            border: `1.5px solid ${form.role === opt.value ? 'var(--color-primary)' : 'var(--color-border-solid)'}`,
                            background: form.role === opt.value ? 'rgba(var(--color-primary-rgb), 0.04)' : 'transparent',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{opt.label}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{opt.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-input" value={form.department} onChange={e => updateField('department', e.target.value)}>
                      {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <button type="button" className="btn btn-primary btn-lg w-full" onClick={nextStep} style={{ width: '100%' }}>
                    Continue <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="form-group">
                    <label className="form-label">Password <span className="required">*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={e => updateField('password', e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                        background: 'none', border: 'none', cursor: 'pointer'
                      }}>
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password <span className="required">*</span></label>
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={e => updateField('confirmPassword', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn btn-outline btn-lg" onClick={() => setStep(1)} style={{ flex: 1 }}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <motion.button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ flex: 2 }}
                    >
                      {loading ? 'Creating...' : 'Create Account'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
    </>
  );
};

export default Signup;
