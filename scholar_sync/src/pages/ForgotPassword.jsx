import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useThemeStyles } from '../context/ThemeContext';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const theme = useThemeStyles();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, portal: 'sync' }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        toast.success('Reset link request processed successfully.');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection failed. Please try again later.');
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
          <h1 className="page-title">Forgot Password</h1>
          <p className="page-desc">
            {!submitted 
              ? "Enter the email ID you used to register your account and we will send you a password recovery link." 
              : "Check your inbox for password reset instructions."
            }
          </p>
          
          {error && <div style={{ color: theme.error, marginBottom: '15px', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your registered email"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  required
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText }}
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '24px', cursor: 'pointer' }}
              >
                {loading ? 'Sending...' : 'Send Recovery Link'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: '#10B981', 
                padding: '16px', 
                borderRadius: '12px', 
                fontSize: '0.95rem',
                fontWeight: 500,
                border: '1px solid rgba(16, 185, 129, 0.2)',
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                ✉ If the email ID is registered with an account, you will receive an email shortly with instructions to reset your password.
              </div>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: theme.textSecondary }}>
            Back to <Link to="/login" style={{ color: theme.primary, fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
