import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Facebook, Instagram, Twitter, GitBranch } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="landing-logo">
            <Shield size={24} color="#133A26" />
            <span className="logo-text">ScholarSync</span>
          </div>
          <p className="footer-text">
            Orchestrating PhD Lifecycles & State-of-the-Art Research Collaborative Hubs.
          </p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>University Links</h4>
            <Link to="/about" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>About System</Link>
            <Link to="/labs" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>Research Labs</Link>
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
        <div className="footer-social">
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
        color: '#6B7280',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>© {new Date().getFullYear()} ScholarSync Doctoral Lifecycle & Research Portal. All rights reserved.</span>
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
