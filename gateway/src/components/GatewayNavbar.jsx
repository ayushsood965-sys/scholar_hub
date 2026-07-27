import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  ArrowUpRight, 
  Menu, 
  X, 
  Home, 
  Info, 
  Globe, 
  Building2, 
  Award, 
  Code,
  LogIn,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const GatewayNavbar = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavClick = (sectionId) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="landing-nav" style={{ position: 'sticky', top: 0, zIndex: 1000, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        {/* Brand Logo */}
        <Link to="/" className="landing-logo" style={{ textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
          <div className="landing-logo-wrapper">
            <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <span className="logo-text">HPU ScholarHub</span>
        </Link>

        {/* Desktop Center Navigation Links - UNIFIED FONTS & STYLES */}
        <div className="nav-links">
          <button 
            onClick={() => handleNavClick('home')} 
            className={`nav-link-btn ${isActive('/') && !location.state?.scrollTo ? 'active' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={() => handleNavClick('about')} 
            className="nav-link-btn"
          >
            About
          </button>
          <button 
            onClick={() => handleNavClick('portals')} 
            className="nav-link-btn"
          >
            Portals
          </button>
          <Link 
            to="/discovery" 
            className={`nav-link-btn ${isActive('/discovery') ? 'active-link' : ''}`}
          >
            Academic Research Discovery
          </Link>
          <Link 
            to="/acknowledgements" 
            className={`nav-link-btn ${isActive('/acknowledgements') ? 'active-link' : ''}`}
          >
            Acknowledgements
          </Link>
        </div>

        {/* Right Desktop Actions & Mobile Menu Toggle */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={toggleTheme} 
            className="icon-btn" 
            title="Toggle theme mode"
            aria-label="Toggle Theme"
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
              backgroundColor: 'rgba(0,0,0,0.04)'
            }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            onClick={() => handleNavClick('portals')} 
            className="btn-primary login-nav-btn desktop-only-login"
          >
            Login Portal <ArrowUpRight size={16} />
          </button>

          {/* Hamburger Menu Toggle Button (Visible on Mobile) */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Mobile Navigation Menu"
            style={{
              background: isMobileMenuOpen ? 'var(--color-primary)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: '10px 12px',
              color: isMobileMenuOpen ? '#ffffff' : 'var(--color-text-primary)',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </motion.button>
        </div>
      </nav>

      {/* Modern Animated Mobile Navigation Overlay & Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mobile-nav-drawer-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 99999,
              padding: '75px 16px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflowY: 'auto'
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="mobile-nav-drawer-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)',
                borderRadius: '24px',
                border: '1px solid var(--color-border)',
                padding: '22px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '480px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Drawer Top Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--color-border)',
                marginBottom: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/hpu_logo.png" alt="HPU" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text-primary)', lineHeight: 1.1 }}>HPU ScholarHub</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>University Gateway</span>
                  </div>
                </div>

                <button 
                  onClick={toggleTheme}
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {theme === 'light' ? <Moon size={14} color="var(--color-primary)" /> : <Sun size={14} color="#f59e0b" />}
                  <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              {/* Navigation Group Header */}
              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', margin: '6px 0 2px 4px' }}>
                Gateway Portals & Pages
              </div>

              {/* Menu Item 1: Home */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavClick('home')} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: isActive('/') && !location.state?.scrollTo ? 'var(--color-sync-light)' : 'var(--color-bg)',
                  color: isActive('/') && !location.state?.scrollTo ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  border: isActive('/') && !location.state?.scrollTo ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                    <Home size={16} color="var(--color-primary)" />
                  </div>
                  <span>Home Gateway</span>
                </div>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </motion.button>

              {/* Menu Item 2: About */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavClick('about')} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                    <Info size={16} color="#0284c7" />
                  </div>
                  <span>About ScholarHub</span>
                </div>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </motion.button>

              {/* Menu Item 3: Application Portals */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavClick('portals')} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                    <Globe size={16} color="#d97706" />
                  </div>
                  <span>Application Portals</span>
                </div>
                <ChevronRight size={16} color="var(--color-text-muted)" />
              </motion.button>

              {/* Menu Item 4: Academic Research Discovery */}
              <Link 
                to="/discovery" 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: isActive('/discovery') ? 'var(--color-sync-light)' : 'var(--color-bg)',
                    color: isActive('/discovery') ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    border: isActive('/discovery') ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    fontWeight: 700,
                    fontSize: '0.92rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                      <Building2 size={16} color="var(--color-primary)" />
                    </div>
                    <span>Academic Research Discovery</span>
                  </div>
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </motion.div>
              </Link>

              {/* Menu Item 5: Acknowledgements */}
              <Link 
                to="/acknowledgements" 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: isActive('/acknowledgements') ? 'var(--color-sync-light)' : 'var(--color-bg)',
                    color: isActive('/acknowledgements') ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    border: isActive('/acknowledgements') ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    fontWeight: 700,
                    fontSize: '0.92rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                      <Award size={16} color="#8b5cf6" />
                    </div>
                    <span>Acknowledgements</span>
                  </div>
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </motion.div>
              </Link>

              {/* Menu Item 6: Ayush Sood Developer Profile */}
              <Link 
                to="/ayush-sood" 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    background: isActive('/ayush-sood') ? 'rgba(2, 132, 199, 0.1)' : 'var(--color-bg)',
                    color: isActive('/ayush-sood') ? '#0284c7' : 'var(--color-text-primary)',
                    border: isActive('/ayush-sood') ? '1px solid #0284c7' : '1px solid var(--color-border)',
                    fontWeight: 700,
                    fontSize: '0.92rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                      <Code size={16} color="#0284c7" />
                    </div>
                    <span>Ayush Sood (Developer)</span>
                  </div>
                  <Sparkles size={14} color="#0284c7" />
                </motion.div>
              </Link>

              {/* CTA Login Section */}
              <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                <motion.button 
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleNavClick('portals')} 
                  className="btn-primary"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    boxShadow: '0 8px 25px rgba(26, 90, 59, 0.25)'
                  }}
                >
                  <LogIn size={18} />
                  <span>Login to Portals</span>
                  <ArrowUpRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GatewayNavbar;
