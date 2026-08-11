import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';
import { SCHOLAR_SYNC_URL } from '../config';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const isHomePage = location.pathname === '/';

  const dashMap = {
    SUPER_ADMIN: '/super-dashboard',
    HOD: '/hod-dashboard',
    ADMIN: '/hod-dashboard',
    FACULTY: '/faculty-dashboard',
    STUDENT: '/student-dashboard',
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    const origin = localStorage.getItem("login_origin") || "track";
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("login_origin");
    sessionStorage.clear();

    if (origin === "sync" && SCHOLAR_SYNC_URL) {
      window.location.href = `${SCHOLAR_SYNC_URL}/logout-bridge?toast=Logged%20out%20successfully`;
    } else {
      window.location.href = "/logout-bridge?toast=Logged%20out%20successfully";
    }
  };

  const goToDashboard = () => {
    navigate(dashMap[user?.role] ?? '/student-dashboard');
  };

  const handleHomeClick = (e) => {
    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="landing-nav">
      <Link to="/" className="landing-logo" onClick={handleHomeClick}>
        <div className="landing-logo-wrapper">
          <BarChart3 size={22} className="landing-logo-img" style={{ color: 'var(--color-primary)' }} />
        </div>
        <span className="logo-text">ScholarTrack</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${isHomePage ? 'active' : ''}`} onClick={handleHomeClick}>Home</Link>
        {isHomePage && (
          <>
            <a href="#features" className="nav-link">Features</a>
            <a href="#stats" className="nav-link">Statistics</a>
          </>
        )}
      </div>

      <div className="nav-actions">
        <ThemeToggle />
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="header-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-primary)' }}
              >
                <Bell size={18} />
                {(unreadCount ?? 0) > 0 && (
                  <span className="notification-badge" />
                )}
              </button>
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* User Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}
              >
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--color-sidebar, #133A26)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown size={16} color="#6b7280" />
              </button>

              {showDropdown && (
                <div style={{ position: 'absolute', top: '45px', right: 0, width: '210px', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', fontSize: '0.92rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>{user.role?.replace('_', ' ')}</div>
                  </div>
                  <button onClick={goToDashboard} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text-primary)', fontSize: '0.88rem' }}>
                    <User size={16} /> My Dashboard
                  </button>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#EF4444', fontSize: '0.88rem', fontWeight: '600' }}>
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <button className="btn btn-outline" onClick={() => navigate('/login')}>Log In</button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
