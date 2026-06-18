import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const dashMap = {
    SUPER_ADMIN: '/super-dashboard',
    HOD: '/hod-dashboard',
    ADMIN: '/hod-dashboard',
    FACULTY: '/faculty-dashboard',
    STUDENT: '/student-dashboard',
  };

  return (
    <nav className="landing-nav">
      <Link to="/" className="landing-logo">
        <div className="landing-logo-wrapper">
          <BarChart3 size={22} className="landing-logo-img" style={{ color: 'var(--color-primary)' }} />
        </div>
        <span className="logo-text">ScholarTrack</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link active">Home</Link>
        <a href="#features" className="nav-link">Features</a>
        <a href="#stats" className="nav-link">Statistics</a>
      </div>

      <div className="nav-actions">
        <ThemeToggle />
        {user ? (
          <button className="btn btn-primary" onClick={() => navigate(dashMap[user.role] ?? '/student-dashboard')}>
            Dashboard
          </button>
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
