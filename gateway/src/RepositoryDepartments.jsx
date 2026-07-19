import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building, 
  Users, 
  UserCheck, 
  ArrowRight, 
  Sun, 
  Moon, 
  Search,
  Building2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { API_URL } from './config';

const getAPIUrl = () => API_URL || 'http://localhost:5000/api';

const RepositoryDepartments = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch(`${getAPIUrl()}/public/repository/departments`);
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (err) {
        console.error("Failed to load departments repository:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const filteredDepts = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
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

        <div className="nav-links">
          <button onClick={() => navigate('/')} className="nav-link-btn">Home</button>
          <button onClick={() => navigate('/', { state: { scrollTo: 'about' } })} className="nav-link-btn">About</button>
          <button onClick={() => navigate('/', { state: { scrollTo: 'portals' } })} className="nav-link-btn">Portals</button>
          <Link to="/discovery" className="nav-link-btn" style={{ color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }}>Academic Research Discovery</Link>
          <Link to="/acknowledgements" className="nav-link-btn">Acknowledgements</Link>
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
            onClick={() => navigate('/', { state: { scrollTo: 'portals' } })} 
            className="btn-primary login-nav-btn"
          >
            Login Portal <ArrowUpRight size={16} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, zIndex: 1, padding: '40px 8% 100px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px' }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto 16px', background: 'var(--color-sync-light)', color: 'var(--color-primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
            <Building2 size={14} /> Academic Directory
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '16px', background: 'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            University Departments & Scholars
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Explore Himachal Pradesh University's research divisions, active faculty members, and doctoral scholars. 
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ maxWidth: '500px', margin: '0 auto 40px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search departments by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-glass)',
              backdropFilter: 'blur(10px)',
              fontSize: '0.95rem',
              color: 'var(--color-text-primary)',
              outline: 'none',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>

        {/* Loading / Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading departments data...</p>
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto', borderRadius: '16px' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', margin: 0 }}>No departments match your search query.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredDepts.map((dept) => (
              <div key={dept._id} className="glass-panel" style={{
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '4px 8px', borderRadius: '6px', background: 'var(--color-sync-light)', color: 'var(--color-primary)', letterSpacing: '0.5px' }}>
                      {dept.code}
                    </span>
                    <Building size={20} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                    {dept.name}
                  </h3>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                    <UserCheck size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>HOD:</span>
                    {dept.hod ? (
                      <Link 
                        to={`/discovery/profile/${dept.hod.username}`} 
                        style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {dept.hod.name}
                      </Link>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Not Assigned</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div 
                    onClick={() => navigate(`/discovery/department/${dept.code}?tab=faculties`)}
                    style={{
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-sync-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                  >
                    <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      {dept.facultyCount}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      Faculties <ArrowRight size={10} />
                    </span>
                  </div>

                  <div 
                    onClick={() => navigate(`/discovery/department/${dept.code}?tab=scholars`)}
                    style={{
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-sync-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                  >
                    <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      {dept.scholarCount}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      Scholars <ArrowRight size={10} />
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/discovery/department/${dept.code}`)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  View Department Hub <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '30px 8%', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', zIndex: 1 }}>
        <p>© 2026 Himachal Pradesh University. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default RepositoryDepartments;
