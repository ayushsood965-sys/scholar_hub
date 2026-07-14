import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const VerifyEmailPending = () => {
  const { resendVerification } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract email from query parameters
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState({ success: null, message: '' });
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setResendStatus({ success: null, message: '' });
    
    const result = await resendVerification(email);
    if (result.success) {
      setResendStatus({ success: true, message: 'Verification email has been resent successfully!' });
      setCountdown(60); // 1-minute cooldown
    } else {
      setResendStatus({ success: false, message: result.message || 'Failed to resend verification email.' });
    }
    setResending(false);
  };

  return (
    <div className="subpage-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1" style={{ background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)' }}></div>
        <div className="liquid-blob blob-2" style={{ background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)' }}></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      
      <div className="glass-card" style={{ maxWidth: '500px', width: '90%', padding: '40px', borderRadius: '24px', textAlign: 'center', backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255, 255, 255, 0.45)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 255, 255, 0.4)', zIndex: 10 }}>
        
        {/* Animated Envelope Icon */}
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', position: 'relative' }}>
          <div className="ping-ring" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #10B981', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '40px', height: '40px', color: '#ffffff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
          </svg>
        </div>
        
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#065f46', marginBottom: '16px', letterSpacing: '-0.5px' }}>Verify Your Email</h2>
        
        <p style={{ fontSize: '0.98rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '28px' }}>
          We've sent an email verification link to:<br />
          <strong style={{ color: '#065f46', fontSize: '1.05rem', wordBreak: 'break-all' }}>{email}</strong>
        </p>
        
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '28px', textAlign: 'left' }}>
          <p style={{ fontSize: '0.88rem', color: '#047857', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            📌 <strong>Important:</strong> Until your email address is verified, access to your ScholarTrack dashboard and other features will remain completely locked.
          </p>
        </div>

        {resendStatus.message && (
          <div style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            fontSize: '0.9rem',
            textAlign: 'left',
            backgroundColor: resendStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: resendStatus.success ? '#065f46' : '#991b1b',
            border: `1px solid ${resendStatus.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
          }}>
            {resendStatus.message}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resending || countdown > 0}
          className="submit-btn"
          style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '12px', 
            fontWeight: 600, 
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: countdown > 0 ? '#9ca3af' : '#10B981',
            cursor: countdown > 0 || resending ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            border: 'none',
            color: '#ffffff',
            boxShadow: countdown > 0 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}
        >
          {resending ? 'Resending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
        </button>
        
        <div style={{ marginTop: '24px', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: '#10B981', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s ease' }} onMouseOver={(e) => e.target.style.color = '#047857'} onMouseOut={(e) => e.target.style.color = '#10B981'}>
            &larr; Back to Login
          </Link>
        </div>

      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmailPending;
