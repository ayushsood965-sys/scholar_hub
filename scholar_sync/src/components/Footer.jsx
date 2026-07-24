import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Facebook, Instagram, Twitter, GitBranch } from 'lucide-react';
import { SCHOLAR_TRACK_URL, GATEWAY_URL } from '../config';

const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M17.523 15.3l1.816 3.146a.5.5 0 1 1-.866.5l-1.833-3.177a8.97 8.97 0 0 1-9.28 0L5.53 19.446a.5.5 0 1 1-.866-.5L6.48 15.3A9 9 0 0 1 3 7.59h18a9 9 0 0 1-3.477 7.71zM7 9.5c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1zm10 0c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.4z" />
  </svg>
);

import { isStandaloneApp } from './InstallPrompt';

const Footer = () => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const isStandalone = isStandaloneApp();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <footer className="footer">
      <div className="footer-content" style={isMobile ? { flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' } : {}}>
        <div className="footer-brand" style={isMobile ? { marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' } : {}}>
          <div className="landing-logo">
            <Shield size={24} color="#133A26" />
            <span className="logo-text">ScholarSync</span>
          </div>
          <p className="footer-text" style={isMobile ? { marginTop: '8px', maxWidth: '300px' } : {}}>
            Orchestrating PhD Lifecycles & State-of-the-Art Research Collaborative Hubs.
          </p>
        </div>
        <div className="footer-links" style={isMobile ? {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'left',
          boxSizing: 'border-box',
          padding: '0 16px'
        } : {}}>
          <div className="footer-col">
            <h4>University Links</h4>
            <Link to="/about" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>About System</Link>
            <Link to="/labs" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>Research Labs</Link>
          </div>
          <div className="footer-col">
            <h4>Portals</h4>
            <Link to="/login" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>Scholar Login</Link>
            <Link to="/signup" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>Register ID</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/workflow" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <GitBranch size={13} style={{ flexShrink: 0 }} />
              System Workflow
            </Link>
          </div>

          {/* Column 3: PWA Mobile Apps Download - Hidden inside installed PWA */}
          {!isStandalone && (
            <div style={{
              flex: '1 1 260px',
              maxWidth: '360px',
              padding: '24px',
              background: 'rgba(241, 245, 249, 0.45)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '20px',
              border: '1px solid rgba(203, 213, 225, 0.5)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                margin: '0 0 16px 0',
                color: '#133A26',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>📲</span> Install Apps
                <span style={{ display: 'inline-flex', gap: '6px', opacity: 0.9 }}>
                  <AndroidIcon />
                  <AppleIcon />
                </span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('trigger-pwa-install-modal')); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'rgba(15, 23, 42, 0.08)',
                    border: '1px solid rgba(15, 23, 42, 0.15)',
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    width: '100%',
                    maxWidth: '280px',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <span>🎓</span> <span><strong>Scholar Sync HPU</strong> <small style={{ opacity: 0.7 }}>(This App)</small></span>
                </a>
                <a 
                  href={`${SCHOLAR_TRACK_URL || 'http://localhost:5174'}?install=true&src=SCHOLAR_SYNC`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'rgba(15, 23, 42, 0.08)',
                    border: '1px solid rgba(15, 23, 42, 0.15)',
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    width: '100%',
                    maxWidth: '280px',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  <span>📊</span> <span><strong>Scholar Track HPU</strong></span>
                </a>
              </div>
            </div>
          )}
        </div>

        {isMobile && (
          <div style={{
            width: 'calc(100% - 32px)',
            margin: '20px 16px 10px',
            padding: '22px 16px',
            background: 'rgba(241, 245, 249, 0.45)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '20px',
            border: '1px solid rgba(203, 213, 225, 0.5)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <h4 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              margin: '0 0 16px 0',
              color: '#133A26',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span>📲</span> Install Apps
              <span style={{ display: 'inline-flex', gap: '6px', opacity: 0.9 }}>
                <AndroidIcon />
                <AppleIcon />
              </span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('trigger-pwa-install-modal')); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(15, 23, 42, 0.08)',
                  border: '1px solid rgba(15, 23, 42, 0.15)',
                  borderRadius: '12px',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  width: '100%',
                  maxWidth: '280px',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <span>🎓</span> <span><strong>Scholar Sync HPU</strong> <small style={{ opacity: 0.7 }}>(This App)</small></span>
              </a>
              <a 
                href={`${SCHOLAR_TRACK_URL || 'http://localhost:5174'}?install=true&src=SCHOLAR_SYNC`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(15, 23, 42, 0.08)',
                  border: '1px solid rgba(15, 23, 42, 0.15)',
                  borderRadius: '12px',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  width: '100%',
                  maxWidth: '280px',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <span>📊</span> <span><strong>Scholar Track HPU</strong></span>
              </a>
            </div>
          </div>
        )}

        <div className="footer-social" style={isMobile ? { marginTop: '15px' } : {}}>
          <Facebook size={20} style={{ cursor: 'pointer' }} />
          <Instagram size={20} style={{ cursor: 'pointer' }} />
          <Twitter size={20} style={{ cursor: 'pointer' }} />
        </div>
      </div>
      <div className="footer-bottom-bar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '1px solid rgba(19, 58, 38, 0.08)', 
        fontSize: '0.82rem', 
        color: 'var(--color-text-muted)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>© {new Date().getFullYear()} ScholarSync Doctoral Lifecycle & Research Portal. All rights reserved.</span>
        </div>
        <div style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          Designed and Developed by - <Link to="/ayush-sood" style={{ color: '#34d399', fontWeight: 700, textDecoration: 'underline' }}>Ayush Sood</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
