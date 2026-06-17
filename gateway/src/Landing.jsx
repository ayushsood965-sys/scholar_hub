import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  CalendarRange, 
  Database, 
  MapPin, 
  Sun, 
  Moon,
  Sparkles,
  Building,
  BellRing,
  ExternalLink,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  Award,
  Globe,
  ArrowUpRight
} from 'lucide-react';

const Landing = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const announcements = [
    { id: 1, type: 'Notice', title: 'Admissions open for Ph.D. session 2026-27. Last date to submit applications is July 15, 2026.', date: 'June 15, 2026', tag: 'Academic' },
    { id: 2, type: 'Event', title: 'Annual HPU Research Colloquium scheduled for June 28 at Summer Hill Campus Auditorium.', date: 'June 14, 2026', tag: 'Research' },
    { id: 3, type: 'Alert', title: 'ScholarTrack Attendance audit warning: PG candidates with less than 75% attendance must submit leaves by June 22.', date: 'June 12, 2026', tag: 'Attendance' },
    { id: 4, type: 'Update', title: 'HPU library access tokens migrated to unified student profiles database.', date: 'June 10, 2026', tag: 'Library' }
  ];

  const quickLinks = [
    { name: 'HPU Official Website', icon: <Globe size={20} />, url: 'https://www.hpuniv.ac.in/' },
    { name: 'Examinations Portal', icon: <FileSpreadsheet size={20} />, url: '#' },
    { name: 'Academic Calendar 2026', icon: <CalendarRange size={20} />, url: '#' },
    { name: 'Library Catalog (OPAC)', icon: <BookOpen size={20} />, url: '#' },
    { name: 'Scholarships & Grants', icon: <Award size={20} />, url: '#' },
    { name: 'Student Help Desk', icon: <HelpCircle size={20} />, url: '#' }
  ];

  return (
    <div className="landing-page">
      {/* Background blobs */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <a href="/" className="landing-logo" style={{ textDecoration: 'none' }}>
          <div className="landing-logo-wrapper">
            <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <span className="logo-text">HPU ScholarHub</span>
        </a>

        <div className="nav-actions">
          <button 
            onClick={toggleTheme} 
            className="icon-btn" 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.02)'
            }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(26, 90, 59, 0.08)', padding: '6px 16px', borderRadius: '30px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '16px' }}>
            <Sparkles size={14} /> Himachal Pradesh University Portal Gateway
          </div>
          <h1 className="hero-title">
            HPU Unified <br/>
            <span>Student Gateway</span>
          </h1>
          <p className="hero-subtitle">
            A centralized service directory connecting students, researchers, and faculty to academic nodes. Select a portal below to access doctoral candidate lifecycles, research networks, or track class attendance registers.
          </p>
          <div className="hero-buttons">
            <a href="#services" className="btn-primary">Go to Services</a>
            <a href="https://www.hpuniv.ac.in/" target="_blank" rel="noopener noreferrer" className="btn-outline">
              HPU Official Site <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className="hero-image-container">
          <div className="glass-panel animated-svg-box" style={{ background: 'var(--glass-bg)', padding: '30px' }}>
            {/* Lottie-style central server node visualization */}
            <svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hub-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#133A26" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="hub-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              {/* Grid Background lines */}
              <g opacity="0.1" stroke="var(--color-text-secondary)" strokeWidth="1">
                <line x1="50" y1="50" x2="350" y2="50" />
                <line x1="50" y1="120" x2="350" y2="120" />
                <line x1="50" y1="190" x2="350" y2="190" />
                <line x1="50" y1="260" x2="350" y2="260" />
                <line x1="50" y1="330" x2="350" y2="330" />
                
                <line x1="50" y1="50" x2="50" y2="350" />
                <line x1="120" y1="50" x2="120" y2="350" />
                <line x1="190" y1="50" x2="190" y2="350" />
                <line x1="260" y1="50" x2="260" y2="350" />
                <line x1="330" y1="50" x2="330" y2="350" />
              </g>

              {/* Data streams radiating from center */}
              <g stroke="var(--color-primary)" strokeWidth="2" opacity="0.3">
                <line x1="200" y1="200" x2="90" y2="130">
                  <animate attributeName="stroke-dasharray" values="0,150; 150,0" dur="4s" repeatCount="indefinite" />
                </line>
                <line x1="200" y1="200" x2="310" y2="130">
                  <animate attributeName="stroke-dasharray" values="0,150; 150,0" dur="4.5s" repeatCount="indefinite" />
                </line>
                <line x1="200" y1="200" x2="200" y2="320">
                  <animate attributeName="stroke-dasharray" values="0,150; 150,0" dur="5s" repeatCount="indefinite" />
                </line>
              </g>

              {/* Glowing radar rings */}
              <circle cx="200" cy="200" r="80" fill="none" stroke="url(#hub-grad-1)" strokeWidth="1.5" strokeDasharray="10 15">
                <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="16s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="200" r="110" fill="none" stroke="url(#hub-grad-2)" strokeWidth="1" strokeDasharray="30 20">
                <animateTransform attributeName="transform" type="rotate" from="360 200 200" to="0 200 200" dur="20s" repeatCount="indefinite" />
              </circle>

              {/* Satellite nodes */}
              {/* ScholarSync node */}
              <g transform="translate(90, 130)">
                <circle cx="0" cy="0" r="28" fill="var(--color-surface)" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.08))" stroke="var(--color-border)" strokeWidth="1" />
                <circle cx="0" cy="0" r="20" fill="rgba(26, 90, 59, 0.08)" />
                <path d="M-8 -6 L0 -12 L8 -6 L8 4 L-8 4 Z" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                <path d="M-10 -4 L0 -10 L10 -4" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                <animate attributeName="transform" type="translate" values="90,130; 90,124; 90,130" dur="3s" repeatCount="indefinite" />
              </g>

              {/* ScholarTrack node */}
              <g transform="translate(310, 130)">
                <circle cx="0" cy="0" r="28" fill="var(--color-surface)" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.08))" stroke="var(--color-border)" strokeWidth="1" />
                <circle cx="0" cy="0" r="20" fill="rgba(2, 132, 199, 0.08)" />
                <rect x="-7" y="-7" width="14" height="14" rx="3" fill="none" stroke="#0284c7" strokeWidth="1.5" />
                <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#0284c7" strokeWidth="1.5" />
                <line x1="-3" y1="2" x2="1" y2="2" stroke="#0284c7" strokeWidth="1.5" />
                <animate attributeName="transform" type="translate" values="310,130; 310,136; 310,130" dur="3.5s" repeatCount="indefinite" />
              </g>

              {/* Shared Database node */}
              <g transform="translate(200, 320)">
                <circle cx="0" cy="0" r="24" fill="var(--color-surface)" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.08))" stroke="var(--color-border)" strokeWidth="1" />
                <circle cx="0" cy="0" r="16" fill="rgba(251, 191, 36, 0.08)" />
                <ellipse cx="0" cy="-4" rx="6" ry="2.5" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <path d="M-6 -4 A 6 2.5 0 0 0 6 -4" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <path d="M-6 -4 L-6 4 A 6 2.5 0 0 0 6 4 L6 -4" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <animate attributeName="transform" type="translate" values="200,320; 204,320; 200,320" dur="4s" repeatCount="indefinite" />
              </g>

              {/* Central HPU Server Node */}
              <circle cx="200" cy="200" r="44" fill="#ffffff" filter="drop-shadow(0px 12px 24px rgba(19, 58, 38, 0.15))" stroke="rgba(19, 58, 38, 0.1)" strokeWidth="2" />
              <image href="/hpu_logo.png" x="172" y="172" width="56" height="56" />
            </svg>
          </div>
        </div>
      </section>

      {/* Main Content Portals Showcase */}
      <div className="main-content-wrapper" id="services">
        {/* Portals Section */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <h2 className="section-title">HPU Integrated Service Portals</h2>
            <p className="section-subtitle">Select an application below. Both portals operate on the same student profiles database and HPU registry node.</p>
          </div>

          <div className="projects-grid">
            {/* ScholarSync Card */}
            <div 
              className="clay-card project-launch-card"
              onClick={() => window.location.href = 'http://localhost:5173'}
            >
              <div className="project-icon-wrapper" style={{ background: 'rgba(26, 90, 59, 0.08)' }}>
                <GraduationCap size={32} color="#133A26" />
              </div>
              <div style={{ width: '100%' }}>
                <h3 className="project-card-title">ScholarSync</h3>
                <p style={{ color: 'var(--color-primary)', fontSize: '0.88rem', fontWeight: 700, margin: '4px 0 12px' }}>
                  PhD Candidate Lifecycle Portal
                </p>
                <p className="project-card-desc">
                  Track your doctoral registration checkpoints, schedule review meetings, log research milestones, and coordinate guide allocations. Perfect for managing publication records and collaboration networking.
                </p>
              </div>
              <div className="project-tags">
                <span className="project-tag">Doctoral Lifecycle</span>
                <span className="project-tag">Research Labs</span>
                <span className="project-tag">FACULTY Reviews</span>
                <span className="project-tag">Publications</span>
              </div>
              <a href="http://localhost:5173" className="btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
                Launch ScholarSync Portal <ArrowUpRight size={16} />
              </a>
            </div>

            {/* ScholarTrack Card */}
            <div 
              className="clay-card project-launch-card"
              onClick={() => window.location.href = 'http://localhost:5174'}
            >
              <div className="project-icon-wrapper" style={{ background: 'rgba(2, 132, 199, 0.08)' }}>
                <CalendarRange size={32} color="#0284c7" />
              </div>
              <div style={{ width: '100%' }}>
                <h3 className="project-card-title">ScholarTrack</h3>
                <p style={{ color: '#0284c7', fontSize: '0.88rem', fontWeight: 700, margin: '4px 0 12px' }}>
                  Smart Attendance Auditing Suite
                </p>
                <p className="project-card-desc">
                  Log biometric scanner registers, manage monthly attendance rosters, review minimum defalcation limits (75%), and request academic leaves with supervisor document verification.
                </p>
              </div>
              <div className="project-tags">
                <span className="project-tag" style={{ background: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }}>Biometric Registry</span>
                <span className="project-tag" style={{ background: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }}>Leaves Audit</span>
                <span className="project-tag" style={{ background: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }}>HOD Approvals</span>
                <span className="project-tag" style={{ background: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }}>Defalcation Alerts</span>
              </div>
              <a href="http://localhost:5174" className="btn-primary" style={{ width: '100%', marginTop: 'auto', background: 'linear-gradient(135deg, #075985 0%, #0284c7 100%)', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.2)' }}>
                Launch ScholarTrack Portal <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* Announcements and Quick Links Section */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', marginBottom: '80px' }}>
          {/* Announcements block */}
          <div className="glass-panel" style={{ padding: '36px', background: 'var(--glass-bg)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BellRing size={22} color="var(--color-primary)" /> Campus Announcements & Bulletins
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {announcements.map(notice => (
                <div key={notice.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 12px', background: 'var(--color-bg)', borderRadius: '12px', minWidth: '80px', height: 'fit-content' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>{notice.tag}</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: '1.4' }}>{notice.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>{notice.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links & Directory */}
          <div className="glass-panel" style={{ padding: '36px', background: 'var(--glass-bg)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>University Directory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {quickLinks.map((link, idx) => (
                <a 
                  key={idx}
                  href={link.url}
                  className="clay-card"
                  style={{ 
                    padding: '16px 20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '14px', 
                    background: 'var(--color-surface)',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ color: 'var(--color-primary)' }}>{link.icon}</div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{link.name}</span>
                  <ArrowUpRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Infrastructure Status */}
        <div className="clay-card" style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(217, 119, 6, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={24} color="#d97706" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Shared Student Infrastructure</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Both portals read and write to the same student database cluster.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>Active</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Database Node</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--color-border)', paddingLeft: '24px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>Port 5000</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>REST API Server</div>
            </div>
          </div>
        </div>

        {/* Stats counter banner */}
        <div className="clay-card" style={{ display: 'flex', justifyContent: 'space-around', margin: '80px auto 0', padding: '30px', maxWidth: '1200px', background: 'var(--color-surface)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>20k+</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Enrolled Students</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)', paddingLeft: '40px', paddingRight: '40px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>47+</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>HPU Departments</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>1</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Shared Database</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-wrapper" style={{ width: '36px', height: '36px' }}>
                <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </div>
              <span className="logo-text">HPU ScholarHub</span>
            </div>
            <p className="footer-text">
              Centralized access point for academic, research, and attendance services at Himachal Pradesh University (HPU).
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} />
              <span>HPU Campus, Summer Hill, Shimla, HP, India</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} />
              <span>Himachal Pradesh University</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <div>
            <span>© {new Date().getFullYear()} Himachal Pradesh University. All rights reserved.</span>
          </div>
          <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
            Developed by - <span style={{ fontWeight: 700 }}>Ayush Sood</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
