import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Building, 
  Users, 
  UserCheck, 
  ArrowLeft, 
  Sun, 
  Moon, 
  ArrowUpRight,
  GraduationCap,
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { API_URL } from './config';

const getAPIUrl = () => API_URL || 'http://localhost:5000/api';

const RepositoryDepartmentDetail = () => {
  const { code } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'faculties';
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [deptInfo, setDeptInfo] = useState(null);
  const [entities, setEntities] = useState([]);
  const [loadingDept, setLoadingDept] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch department details first
  useEffect(() => {
    const fetchDeptDetails = async () => {
      try {
        const res = await fetch(`${getAPIUrl()}/public/repository/departments`);
        if (res.ok) {
          const data = await res.json();
          const found = data.find(d => d.code.toUpperCase() === code.toUpperCase());
          if (found) {
            setDeptInfo(found);
          }
        }
      } catch (err) {
        console.error("Failed to fetch department info:", err);
      } finally {
        setLoadingDept(false);
      }
    };
    fetchDeptDetails();
  }, [code]);

  // Fetch faculties or scholars depending on activeTab
  useEffect(() => {
    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        const endpoint = activeTab === 'scholars' ? 'scholars' : 'faculties';
        const res = await fetch(`${getAPIUrl()}/public/repository/departments/${code}/${endpoint}`);
        if (res.ok) {
          const data = await res.json();
          setEntities(data);
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab}:`, err);
      } finally {
        setLoadingEntities(false);
      }
    };
    fetchEntities();
  }, [code, activeTab]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

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
        {/* Back Button */}
        <button 
          onClick={() => navigate('/discovery')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '32px'
          }}
        >
          <ArrowLeft size={16} /> Back to Directory
        </button>

        {loadingDept ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        ) : !deptInfo ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', borderRadius: '16px' }}>
            <h2>Department Not Found</h2>
            <p>We could not retrieve details for department code: {code}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '4px 8px', borderRadius: '6px', background: 'var(--color-sync-light)', color: 'var(--color-primary)', letterSpacing: '0.5px' }}>
                  {deptInfo.code}
                </span>
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0, color: 'var(--color-text-primary)' }}>
                {deptInfo.name}
              </h1>
            </div>

            {/* HOD Card and Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* HOD Card */}
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--color-sync-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {deptInfo.hod?.avatarUrl ? (
                    <img src={deptInfo.hod.avatarUrl.startsWith('http') ? deptInfo.hod.avatarUrl : `http://localhost:5000${deptInfo.hod.avatarUrl}`} alt={deptInfo.hod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserCheck size={36} style={{ color: 'var(--color-primary)' }} />
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                    Head of Department (HOD)
                  </span>
                  {deptInfo.hod ? (
                    <>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--color-text-primary)' }}>
                        {deptInfo.hod.name}
                      </h3>
                      {deptInfo.hod.profile?.specialization && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 8px 0' }}>
                          Specialization: {deptInfo.hod.profile.specialization}
                        </p>
                      )}
                      <Link 
                        to={`/discovery/profile/${deptInfo.hod.username}`} 
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        View HOD Profile <ArrowUpRight size={12} />
                      </Link>
                    </>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Not Assigned</span>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid var(--color-border)', paddingRight: '16px' }}>
                  <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                    {deptInfo.facultyCount}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Faculty Members</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                    {deptInfo.scholarCount}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>PhD Scholars</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
                <button
                  onClick={() => handleTabChange('faculties')}
                  style={{
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: activeTab === 'faculties' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'faculties' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'color 0.2s, border-color 0.2s'
                  }}
                >
                  <Users size={16} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  Faculty Members ({deptInfo.facultyCount})
                </button>
                <button
                  onClick={() => handleTabChange('scholars')}
                  style={{
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: activeTab === 'scholars' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'scholars' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'color 0.2s, border-color 0.2s'
                  }}
                >
                  <GraduationCap size={18} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  Research Scholars ({deptInfo.scholarCount})
                </button>
              </div>

              {/* Entity List */}
              {loadingEntities ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="spinner" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : entities.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>No active {activeTab} found in this department.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {entities.map((user) => {
                    const isPrivate = user.profile?.isPrivate === true;
                    return (
                      <div key={user._id} className="glass-panel" style={{
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/discovery/profile/${user.username}`)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                      >
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--color-sync-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            activeTab === 'scholars' ? (
                              <GraduationCap size={24} style={{ color: 'var(--color-primary)' }} />
                            ) : (
                              <Users size={24} style={{ color: 'var(--color-primary)' }} />
                            )
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--color-text-primary)', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.name}
                          </h4>
                          
                          {activeTab === 'scholars' ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user.profile?.degreeName || 'Ph.D. Scholar'}
                            </p>
                          ) : (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user.profile?.designation || 'Faculty'}
                            </p>
                          )}

                          {isPrivate && (
                            <span style={{ display: 'inline-block', fontSize: '0.68rem', color: '#b45309', background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', fontWeight: '600', marginTop: '4px' }}>
                              🔒 Private Profile
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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

export default RepositoryDepartmentDetail;
