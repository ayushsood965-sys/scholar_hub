import React, { useContext, useState } from 'react';
import { Search, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { notifications, markAsRead } = useContext(NotificationContext);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const goToDashboard = () => {
    if (user?.role === 'ADMIN') navigate('/admin-dashboard');
    else if (user?.role === 'FACULTY') navigate('/faculty-dashboard');
    else navigate('/student-dashboard');
  };

  return (
    <nav className="landing-nav">
      <Link to="/" className="landing-logo" style={{ textDecoration: 'none' }}>
        <div className="landing-logo-wrapper">
          <img src="/hpu_logo.png" alt="ScholarSync Logo" className="landing-logo-img" />
        </div>
        <span className="logo-text">ScholarSync</span>
      </Link>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${currentPath === '/' ? 'active' : ''}`}>Home</Link>
        <Link to="/labs" className={`nav-link ${currentPath === '/labs' ? 'active' : ''}`}>Research Labs</Link>
        <Link to="/collaborate" className={`nav-link ${currentPath === '/collaborate' ? 'active' : ''}`}>Collaborate</Link>
        <Link to="/publications" className={`nav-link ${currentPath === '/publications' ? 'active' : ''}`}>Publications</Link>
        <Link to="/funding" className={`nav-link ${currentPath === '/funding' ? 'active' : ''}`}>Funding</Link>
        <Link to="/events" className={`nav-link ${currentPath === '/events' ? 'active' : ''}`}>Events</Link>
        <Link to="/about" className={`nav-link ${currentPath === '/about' ? 'active' : ''}`}>About</Link>
      </div>
      
      <div className="nav-actions">
        <ThemeToggle style={{ color: '#133A26' }} />
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {showSearch && (
            <input 
              type="text" 
              placeholder="Search ScholarSync..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                  setShowSearch(false);
                  setSearchQuery('');
                }
              }}
              style={{
                width: '180px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                marginRight: '8px',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              autoFocus
            />
          )}
          <button 
            className="icon-btn" 
            onClick={() => {
              if (showSearch && searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                setShowSearch(false);
                setSearchQuery('');
              } else {
                setShowSearch(!showSearch);
              }
            }}
          >
            <Search size={20} />
          </button>
        </div>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -5, right: -5, background: '#F87171', color: 'white', fontSize: '10px', borderRadius: '50%', padding: '2px 6px', fontWeight: 'bold' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div style={{ position: 'absolute', top: '40px', right: '-50px', width: '300px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Notifications</div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div key={notif.id} onClick={() => markAsRead(notif.id)} style={{ padding: '15px', borderBottom: '1px solid #eee', background: notif.read ? 'white' : '#f0fdf4', cursor: 'pointer', fontSize: '0.9rem' }}>
                          {notif.message}
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '5px' }}>{new Date(notif.date).toLocaleTimeString()}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '15px', textAlign: 'center', color: '#6b7280' }}>No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#133A26', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                  {user.name.charAt(0)}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#111827' }}>{user.name.split(' ')[0]}</span>
                <ChevronDown size={16} color="#6b7280" />
              </button>
              
              {showDropdown && (
                <div style={{ position: 'absolute', top: '45px', right: 0, width: '200px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ fontWeight: 'bold', color: '#111827' }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{user.role}</div>
                  </div>
                  <button onClick={goToDashboard} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 15px', background: 'none', border: 'none', borderBottom: '1px solid #e5e7eb', cursor: 'pointer', textAlign: 'left', color: '#374151' }}>
                    <User size={16} /> My Dashboard
                  </button>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 15px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#F87171' }}>
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-outline">Log In</Link>
            <Link to="/signup" className="btn-primary">Join Portal</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
