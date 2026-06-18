import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="logo-text" style={{ fontSize: '1.3rem' }}>ScholarTrack</span>
          <p className="footer-text">
            Enterprise-grade attendance management system for academic institutions. 
            Built with precision for HPU's research scholar ecosystem.
          </p>
          <p className="footer-text" style={{ fontSize: '0.78rem', opacity: 0.5 }}>
            Part of the ScholarHub unified platform.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/" className="footer-link-item">Home</Link>
            <Link to="/login" className="footer-link-item">Login</Link>
            <Link to="/signup" className="footer-link-item">Register</Link>
          </div>
          <div className="footer-col">
            <h4>Features</h4>
            <span className="footer-link-item">Attendance Tracking</span>
            <span className="footer-link-item">Leave Management</span>
            <span className="footer-link-item">Policy Configuration</span>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <span className="footer-link-item">Documentation</span>
            <span className="footer-link-item">Contact IT</span>
            <span className="footer-link-item">HPU Portal</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} ScholarTrack · Himachal Pradesh University. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
