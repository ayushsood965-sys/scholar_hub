import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyEmailCallback = () => {
  const location = useLocation();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://server.scholarhubhpu.in';
  
  // Extract token from query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/api/auth/verify-email?token=${token}`);
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };

    verifyToken();
  }, [token, API_URL]);

  return (
    <div className="subpage-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      
      <div className="glass-card" style={{ maxWidth: '500px', width: '90%', padding: '40px', borderRadius: '24px', textAlign: 'center', backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255, 255, 255, 0.45)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 255, 255, 0.4)', zIndex: 10 }}>
        
        {/* Verification in Progress */}
        {status === 'verifying' && (
          <div>
            <div className="spinner" style={{ width: '60px', height: '60px', border: '5px solid rgba(99, 102, 241, 0.1)', borderTop: '5px solid #6366F1', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }}></div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '12px' }}>Verifying Email</h2>
            <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.5 }}>Please wait while we verify your email address...</p>
          </div>
        )}

        {/* Verification Success */}
        {status === 'success' && (
          <div>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #10b981', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '40px', height: '40px', color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#065f46', marginBottom: '12px' }}>Email Verified!</h2>
            <p style={{ fontSize: '0.98rem', color: '#065f46', lineHeight: 1.5, marginBottom: '28px' }}>{message}</p>
            
            <Link
              to="/login"
              className="submit-btn"
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '14px', 
                borderRadius: '12px', 
                fontWeight: 600, 
                fontSize: '0.95rem',
                backgroundColor: '#10b981',
                textDecoration: 'none',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            >
              Proceed to Login
            </Link>
          </div>
        )}

        {/* Verification Error */}
        {status === 'error' && (
          <div>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #ef4444', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '40px', height: '40px', color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#991b1b', marginBottom: '12px' }}>Verification Failed</h2>
            <p style={{ fontSize: '0.98rem', color: '#991b1b', lineHeight: 1.5, marginBottom: '28px' }}>{message}</p>
            
            <Link
              to="/login"
              className="submit-btn"
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '14px', 
                borderRadius: '12px', 
                fontWeight: 600, 
                fontSize: '0.95rem',
                backgroundColor: '#ef4444',
                textDecoration: 'none',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            >
              Back to Login
            </Link>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmailCallback;
