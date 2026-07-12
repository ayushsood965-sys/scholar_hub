import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, GitBranch } from 'lucide-react';
import { SCHOLAR_SYNC_URL, GATEWAY_URL } from '../config';

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

const Footer = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <footer className="footer">
      <div className="footer-content" style={isMobile ? { flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' } : {}}>
        <div className="footer-brand" style={isMobile ? { marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' } : {}}>
          <div className="landing-logo">
            <BarChart3 size={24} style={{ color: 'var(--color-primary)' }} />
            <span className="logo-text">ScholarTrack</span>
          </div>
          <p className="footer-text" style={isMobile ? { marginTop: '8px', maxWidth: '300px' } : {}}>
            Enterprise-Grade Attendance & Leave Management for HPU Research Scholars.
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
            <Link to="/about" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>About System</Link>
            <Link to="/policies" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>Policy Guidelines</Link>
          </div>
          <div className="footer-col">
            <h4>Portals</h4>
            <Link to="/login" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>Scholar Login</Link>
            <Link to="/signup" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>Register ID</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/workflow" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <GitBranch size={13} style={{ flexShrink: 0 }} />
              System Workflow
            </Link>
          </div>
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
              color: 'var(--color-primary)',
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
                href={`${(GATEWAY_URL && !GATEWAY_URL.includes('5174')) ? GATEWAY_URL : 'http://localhost:5175'}?install=true`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(15, 23, 42, 0.08)',
                  border: '1px solid rgba(15, 23, 42, 0.15)',
                  borderRadius: '12px',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  width: '100%',
                  maxWidth: '280px',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <span>🌐</span> <span><strong>Scholar Hub HPU</strong></span>
              </a>
              <a 
                href={`${SCHOLAR_SYNC_URL || 'http://localhost:5173'}?install=true`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(15, 23, 42, 0.08)',
                  border: '1px solid rgba(15, 23, 42, 0.15)',
                  borderRadius: '12px',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  width: '100%',
                  maxWidth: '280px',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <span>🎓</span> <span><strong>Scholar Sync HPU</strong></span>
              </a>
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
                  color: '#0f172a',
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
                <span>📊</span> <span><strong>Scholar Track HPU</strong> <small style={{ opacity: 0.7 }}>(This App)</small></span>
              </a>
            </div>
          </div>
        )}

        <div className="footer-social" style={isMobile ? { marginTop: '15px', display: 'flex', gap: '16px', justifyContent: 'center' } : { display: 'flex', gap: '16px', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
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
        color: '#6B7280',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>© {new Date().getFullYear()} ScholarTrack Attendance & Leave Management Portal. All rights reserved.</span>
          <a href="/seed" target="_blank" rel="noreferrer" title="Seed Database" style={{ color: 'inherit', opacity: 0.15, textDecoration: 'none', fontSize: '0.7rem', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.8} onMouseOut={e => e.currentTarget.style.opacity = 0.15}>🌱</a>
          <a href="/seed-users" target="_blank" rel="noreferrer" title="Seed User Data" style={{ color: 'inherit', opacity: 0.15, textDecoration: 'none', fontSize: '0.7rem', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.8} onMouseOut={e => e.currentTarget.style.opacity = 0.15}>👥</a>
          <a href="/clear-all" target="_blank" rel="noreferrer" title="Reset Database" style={{ color: 'inherit', opacity: 0.15, textDecoration: 'none', fontSize: '0.7rem', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.8} onMouseOut={e => e.currentTarget.style.opacity = 0.15}>🧹</a>
        </div>
        <div style={{ fontWeight: 500, fontSize: '0.82rem', color: '#4B5563' }}>
          Designed and Developed by - <span style={{ color: '#133A26', fontWeight: 700 }}>Ayush Sood</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
