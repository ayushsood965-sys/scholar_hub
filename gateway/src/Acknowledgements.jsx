import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Sun, 
  Moon, 
  Award, 
  Users, 
  ArrowLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  Building,
  Heart,
  Sparkles,
  Terminal,
  ArrowUpRight
} from 'lucide-react';

const AvatarPlaceholder = ({ name }) => (
  <div className="avatar-placeholder-container" style={{
    position: 'relative',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(26, 90, 59, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    margin: '0 auto 20px',
    overflow: 'hidden'
  }}>
    <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: 'var(--color-text-muted)' }}>
      <path d="M18 21a6 6 0 0 0-12 0" />
      <circle cx="12" cy="10" r="4" />
    </svg>
    <div style={{
      position: 'absolute',
      bottom: '0',
      width: '100%',
      background: 'rgba(0, 0, 0, 0.05)',
      padding: '4px 0',
      textAlign: 'center',
      fontSize: '0.7rem',
      fontWeight: '600',
      color: 'var(--color-text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      Placeholder
    </div>
  </div>
);

const Acknowledgements = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavClick = (sectionId) => {
    navigate('/', { state: { scrollTo: sectionId } });
  };

  return (
    <div className="landing-page acknowledgements-page" style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* Background blobs */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="landing-logo" style={{ textDecoration: 'none' }}>
          <div className="landing-logo-wrapper">
            <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <span className="logo-text">HPU ScholarHub</span>
        </a>

        {/* Center Navigation Links */}
        <div className="nav-links">
          <button onClick={() => navigate('/')} className="nav-link-btn">Home</button>
          <button onClick={() => handleNavClick('about')} className="nav-link-btn">About</button>
          <button onClick={() => handleNavClick('portals')} className="nav-link-btn">Portals</button>
          <Link to="/acknowledgements" className="nav-link-btn" style={{ color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }}>Acknowledgements</Link>
        </div>

        <div className="nav-actions">
          <button 
            onClick={toggleTheme} 
            className="icon-btn" 
            title="Toggle theme mode"
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
          
          <button 
            onClick={() => handleNavClick('portals')} 
            className="btn-primary login-nav-btn"
          >
            Login Portal <ArrowUpRight size={16} />
          </button>
        </div>
      </nav>

      {/* Main Acknowledgements Section */}
      <main style={{ flex: 1, zIndex: 1, padding: '60px 8% 100px' }}>
        {/* Page Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 60px' }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto 16px', background: 'var(--color-sync-light)', color: 'var(--color-primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
            <Award size={14} /> Official Acknowledgements
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '20px', background: 'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Vision, Guidance & Contributions
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            ScholarHub is built on a foundation of collaboration, academic advice, and institutional support. We express our deepest gratitude to the esteemed leaders and mentors of Himachal Pradesh University who guided and shaped this project.
          </p>
        </div>

        {/* 1. Vice Chancellor Section (Full Width / Hero Card) */}
        <div className="glass-panel vc-card-layout" style={{
          maxWidth: '1000px',
          margin: '0 auto 40px',
          padding: '40px',
          display: 'grid',
          gridTemplateColumns: '3fr 1fr',
          gap: '30px',
          alignItems: 'center',
          borderLeft: '4px solid var(--color-primary)'
        }}>
          <div className="vc-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: 'var(--color-primary)' }}>Visionary Patron</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Hon'ble Vice Chancellor
            </h2>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Himachal Pradesh University, Summer Hill, Shimla
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.75', fontSize: '1.05rem', fontStyle: 'italic' }}>
              "We express our profound gratitude and highest respects to the Hon'ble Vice Chancellor of Himachal Pradesh University. His visionary stewardship, constant administrative patronage, and enabling guidance have been the driving force behind the design and implementation of the ScholarHub portals. Under his leadership, the university continues to pioneer digital transformation, making research tracking and compliance processes seamless, transparent, and state-of-the-art."
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <AvatarPlaceholder name="Vice Chancellor" />
            <span style={{ fontWeight: '700', display: 'block', color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>Office of the Vice Chancellor</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>H.P. University, Shimla</span>
          </div>
        </div>

        {/* 2. Advisors Grid (Physics & Forensic Science) */}
        <div className="advisors-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          maxWidth: '1000px',
          margin: '0 auto 40px'
        }}>
          {/* Prof. Nainjeet Singh Negi */}
          <div className="clay-card" style={{ padding: '35px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <AvatarPlaceholder name="Prof. Nainjeet Singh Negi" />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '700', color: 'var(--color-primary)', display: 'block', marginBottom: '8px' }}>Academic Advisor</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '4px' }}>Prof. Nainjeet Singh Negi</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '600', marginBottom: '20px' }}>Department of Physics, HPU Shimla</p>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65', fontSize: '0.95rem' }}>
                Thank you for your expert academic guidance and support. Your deep knowledge and advice on the implementation framework helped align the portals with the core research needs and standards of the physics department and the university.
              </p>
            </div>
          </div>

          {/* Prof. Pradeep Kumar Bhardwaj */}
          <div className="clay-card" style={{ padding: '35px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <AvatarPlaceholder name="Prof. Pradeep Kumar Bhardwaj" />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: '700', color: 'var(--color-track)', display: 'block', marginBottom: '8px' }}>Workflows Advisor</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '4px' }}>Prof. Pradeep Kumar Bhardwaj</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: '600', marginBottom: '20px' }}>Assistant Professor, Department of Forensic Science, HPU Shimla</p>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65', fontSize: '0.95rem' }}>
                We express sincere appreciation for your valuable guidance and feedback. Your detailed input regarding compliance tracking and portal workflows played a key role in refining system usability and verification stages.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Developer / Maintainer Profile */}
        <div className="glass-panel dev-card-layout" style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '40px',
          display: 'grid',
          gridTemplateColumns: '1fr 3fr',
          gap: '30px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(26, 90, 59, 0.03) 0%, rgba(2, 132, 199, 0.03) 100%)',
          borderRight: '4px solid var(--color-track)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <AvatarPlaceholder name="Ayush Sood" />
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: '4px' }}>Ayush Sood</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Developer & Designer</span>
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(2, 132, 199, 0.08)', color: 'var(--color-track)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Terminal size={12} /> Creator Profile
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '10px' }}>
              Designer, Developer & Maintainer of ScholarHub
            </h4>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: '15px' }}>
              ScholarHub was designed, custom-coded, and is maintained by Ayush Sood. Driven by a commitment to simplify academic processes, modernise research systems, and build robust, high-performance digital tools for Himachal Pradesh University. 
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💻</span> Stack: Vite, React, Vanilla CSS, Node.js, Express, MongoDB.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer" style={{ zIndex: 1 }}>
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-wrapper" style={{ width: '36px', height: '36px' }}>
                <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </div>
              <span className="logo-text">HPU ScholarHub</span>
            </div>
            <p className="footer-text">
              Centralized digital service gateway for PG attendance and PhD thesis tracking at Himachal Pradesh University (HPU), Summer Hill, Shimla.
            </p>
          </div>
          <div className="footer-contact-info">
            <div className="contact-item">
              <MapPin size={16} />
              <span>HPU Campus, Summer Hill, Shimla, HP, India</span>
            </div>
            <div className="contact-item">
              <Building size={16} />
              <span>Himachal Pradesh University Shimla</span>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom-bar">
          <div>
            <span>© {new Date().getFullYear()} Himachal Pradesh University. All rights reserved.</span>
          </div>
          <div className="developer-tag">
            Developed by - <span style={{ fontWeight: 700 }}>Ayush Sood</span>
          </div>
        </div>
      </footer>

      {/* Style tweaks for grid responses and responsiveness */}
      <style>{`
        @media (max-width: 820px) {
          .vc-card-layout {
            grid-template-columns: 1fr !important;
            text-align: center !important;
            padding: 30px 20px !important;
          }
          .vc-card-layout div:last-child {
            order: -1 !important;
            margin-bottom: 20px;
          }
          .advisors-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .dev-card-layout {
            grid-template-columns: 1fr !important;
            text-align: center !important;
            padding: 30px 20px !important;
          }
          .dev-card-layout div:last-child {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Acknowledgements;
