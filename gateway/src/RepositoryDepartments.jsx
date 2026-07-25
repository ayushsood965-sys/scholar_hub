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
  ArrowUpRight,
  GraduationCap
} from 'lucide-react';
import { API_URL } from './config';
import ResearchMetricsHero from './components/ResearchMetricsHero';
import TopResearchersLeaderboard from './components/TopResearchersLeaderboard';
import DepartmentAnalyticsChart from './components/DepartmentAnalyticsChart';

const getAPIUrl = () => API_URL || 'http://localhost:5000/api';

const HODAvatar = ({ hod }) => {
  const [imgError, setImgError] = useState(false);

  const getAvatarUrl = () => {
    if (!hod?.avatarUrl) return null;
    if (hod.avatarUrl.startsWith('http')) return hod.avatarUrl;
    return `${getAPIUrl().replace('/api', '')}${hod.avatarUrl}`;
  };

  const url = getAvatarUrl();

  if (url && !imgError) {
    return (
      <img 
        src={url} 
        alt={hod.name} 
        onError={() => setImgError(true)}
        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)', flexShrink: 0 }}
      />
    );
  }

  // Fallback: Stylized initial badge icon
  const initial = (hod?.name || 'H').replace(/^HOD\s*/i, '').trim().charAt(0).toUpperCase() || 'H';

  return (
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--color-sync-light) 0%, rgba(26, 90, 59, 0.25) 100%)',
      color: 'var(--color-primary)',
      fontWeight: 800,
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--color-primary)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      flexShrink: 0
    }}>
      {initial}
    </div>
  );
};

const RepositoryDepartments = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [topResearchers, setTopResearchers] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [deptsRes, statsRes, topRes, analyticsRes] = await Promise.all([
          fetch(`${getAPIUrl()}/public/repository/departments`),
          fetch(`${getAPIUrl()}/public/repository/stats`),
          fetch(`${getAPIUrl()}/public/repository/top-researchers`),
          fetch(`${getAPIUrl()}/public/repository/analytics`)
        ]);

        if (deptsRes.ok) setDepartments(await deptsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
        if (topRes.ok) setTopResearchers(await topRes.json());
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      } catch (err) {
        console.error("Failed to load repository data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const filteredDepts = departments.filter(dept => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (searchField === 'department' || searchField === 'all') {
      if (dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q)) return true;
    }
    if (searchField === 'name' || searchField === 'all') {
      if (dept.hod?.name?.toLowerCase().includes(q)) return true;
    }
    return dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
  });

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      {/* Background blobs */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      {/* Navigation Header */}
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
          <Link to="/discovery" className="nav-link-btn" style={{ color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }}>Academic Research Directory</Link>
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
      <main style={{ flex: 1, zIndex: 1, padding: '40px 8% 100px', width: '100%', boxSizing: 'border-box' }}>
        {/* Title Badge */}
        <div style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto 36px' }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto 14px', background: 'var(--color-sync-light)', color: 'var(--color-primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
            <Building2 size={15} /> Academic Research Directory
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '14px', background: 'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Himachal Pradesh University Research Directory Portal
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Showcasing academic expertise, scholarly publications, citations impact, and department research output across Himachal Pradesh University.
          </p>
        </div>

        {/* Metrics Hero Card Component */}
        <ResearchMetricsHero 
          stats={stats} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          searchField={searchField}
          setSearchField={setSearchField}
          onSearchSubmit={() => {}}
        />

        {/* Top Researchers Leaderboard (Top 10 Publications, Top 10 Citations, Top 10 Shernies) */}
        <TopResearchersLeaderboard topData={topResearchers} />

        {/* Department Analytics Chart (Recharts Dual-Axis Graph) */}
        <DepartmentAnalyticsChart analyticsData={analytics} />

        {/* Department Catalog Grid Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              University Academic Departments
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Showing {filteredDepts.length} active departments & faculties
            </span>
          </div>
        </div>

        {/* Department Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            <Sparkles size={32} className="spin-icon" style={{ marginBottom: '12px', color: 'var(--color-primary)' }} />
            <p style={{ fontWeight: 600 }}>Loading academic departments and research data...</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
          }}>
            {filteredDepts.map(dept => (
              <div 
                key={dept._id} 
                className="dept-card"
                onClick={() => navigate(`/discovery/department/${dept.code.toLowerCase()}`)}
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'var(--color-sync-light)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(26, 90, 59, 0.15)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}>
                      <Building size={24} strokeWidth={2.2} color="var(--color-primary)" />
                    </div>
                    <span style={{
                      background: 'var(--color-bg)',
                      color: 'var(--color-primary)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      border: '1px solid var(--color-border)'
                    }}>
                      {dept.code}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '8px', lineHeight: '1.3' }}>
                    {dept.name}
                  </h3>

                  {dept.hod && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', background: 'var(--color-bg)', padding: '10px 14px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                      <HODAvatar hod={dept.hod} />
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Head of Department</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{dept.hod.name}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <UserCheck size={16} color="var(--color-primary)" />
                      <span><strong>{dept.facultyCount}</strong> Faculty</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <GraduationCap size={16} color="var(--color-track)" />
                      <span><strong>{dept.scholarCount}</strong> Scholars</span>
                    </div>
                  </div>

                  <div className="arrow-btn" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-border)'
                  }}>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer - Fixed Alignment & Logo Visibility */}
      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '24px 8%', zIndex: 1, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/hpu_logo.png" alt="HPU Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>Himachal Pradesh University • Academic Research Directory Portal</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            © {new Date().getFullYear()} ScholarHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RepositoryDepartments;
