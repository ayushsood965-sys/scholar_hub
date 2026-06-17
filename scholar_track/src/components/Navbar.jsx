import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="landing-nav">
      <Link to="/" className="landing-logo" style={{ textDecoration: 'none' }}>
        <div className="landing-logo-wrapper">
          <img src="/hpu_logo.png" alt="HPU ScholarTrack Logo" className="landing-logo-img" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        </div>
        <span className="logo-text">ScholarTrack</span>
      </Link>

      {/* Desktop Links */}
      <div className="nav-links">
        <Link to="/" className={`nav-link ${currentPath === '/' ? 'active' : ''}`}>Home</Link>
        <Link to="/track" className={`nav-link ${currentPath === '/track' ? 'active' : ''}`}>Track Attendance</Link>
        <Link to="/leaves" className={`nav-link ${currentPath === '/leaves' ? 'active' : ''}`}>Leave Management</Link>
        <Link to="/reports" className={`nav-link ${currentPath === '/reports' ? 'active' : ''}`}>Reports & Analytics</Link>
        <Link to="/about" className={`nav-link ${currentPath === '/about' ? 'active' : ''}`}>About</Link>
      </div>

      <div className="nav-actions">
        <ThemeToggle style={{ color: 'inherit' }} />
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', color: 'var(--color-text-primary)' }}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                {user.name.charAt(0)}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user.name.split(' ')[0]}</span>
              <ChevronDown size={16} color="var(--color-text-secondary)" />
            </button>
            
            {showDropdown && (
              <div style={{ position: 'absolute', top: '45px', right: 0, width: '200px', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.role}</div>
                </div>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 15px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#F87171' }}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-outline">Log In</Link>
            <Link to="/signup" className="btn-primary">Register Profile</Link>
          </>
        )}
        
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn icon-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ display: 'none' }} // Controlled by CSS media queries
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer (visible via state/CSS) */}
      {mobileMenuOpen && (
        <div className="mobile-drawer glass-panel">
          <Link to="/" className={`mobile-nav-link ${currentPath === '/' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/track" className={`mobile-nav-link ${currentPath === '/track' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Track Attendance</Link>
          <Link to="/leaves" className={`mobile-nav-link ${currentPath === '/leaves' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Leave Management</Link>
          <Link to="/reports" className={`mobile-nav-link ${currentPath === '/reports' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Reports & Analytics</Link>
          <Link to="/about" className={`mobile-nav-link ${currentPath === '/about' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            {user ? (
              <button onClick={handleLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LogOut size={16} /> Log Out
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-outline" style={{ textAlign: 'center' }} onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                <Link to="/signup" className="btn-primary" style={{ textAlign: 'center' }} onClick={() => setMobileMenuOpen(false)}>Register Profile</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

