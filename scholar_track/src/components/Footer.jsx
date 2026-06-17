import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="landing-logo">
            <div className="landing-logo-wrapper" style={{ width: '36px', height: '36px' }}>
              <img src="/hpu_logo.png" alt="HPU ScholarTrack Logo" className="landing-logo-img" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            </div>
            <span className="logo-text">ScholarTrack</span>
          </div>
          <p className="footer-text">
            Simplifying attendance tracking, scheduling, and smart analytics for students, faculty, and administrators.
          </p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>System Links</h4>
            <Link to="/about" className="footer-link-item">About Portal</Link>
            <Link to="/features" className="footer-link-item">Key Features</Link>
          </div>
          <div className="footer-col">
            <h4>Access Portals</h4>
            <Link to="/login" className="footer-link-item">User Login</Link>
            <Link to="/signup" className="footer-link-item">Register Profile</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/support" className="footer-link-item">Help Center</Link>
            <Link to="/privacy" className="footer-link-item">Privacy Policy</Link>
          </div>
        </div>
        <div className="footer-social">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
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
        <div>
          <span>© {new Date().getFullYear()} ScholarTrack Smart Attendance System. All rights reserved.</span>
        </div>
        <div style={{ fontWeight: 500, fontSize: '0.82rem', color: '#4B5563' }}>
          Designed and Developed by - <span className="footer-dev-name" style={{ fontWeight: 700 }}>Ayush Sood</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
