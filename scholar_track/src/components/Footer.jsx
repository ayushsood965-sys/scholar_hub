import { Link } from 'react-router-dom';
import { BarChart3, GitBranch } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="landing-logo">
            <BarChart3 size={24} style={{ color: 'var(--color-primary)' }} />
            <span className="logo-text">ScholarTrack</span>
          </div>
          <p className="footer-text">
            Enterprise-Grade Attendance & Leave Management for HPU Research Scholars.
          </p>
        </div>
        <div className="footer-links">
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
        <div className="footer-social" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
