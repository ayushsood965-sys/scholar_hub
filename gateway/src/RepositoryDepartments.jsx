import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  GraduationCap,
  X,
  RefreshCw,
  Filter,
  MapPin
} from 'lucide-react';
import { API_URL } from './config';
import GatewayNavbar from './components/GatewayNavbar';
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
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const catalogRef = useRef(null);
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

  const executeSearch = async (term, field) => {
    if (!term.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setIsSearching(true);
      const res = await fetch(`${getAPIUrl()}/public/repository/search?q=${encodeURIComponent(term)}&field=${encodeURIComponent(field)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search API failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    const term = searchQuery.trim();
    if (!term) return;
    setActiveSearchTerm(term);
    setActiveTab('all');
    executeSearch(term, searchField);
    
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearchFieldChange = (newField) => {
    setSearchField(newField);
    if (activeSearchTerm) {
      executeSearch(activeSearchTerm, newField);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchTerm('');
    setSearchResults(null);
    setActiveTab('all');
    setSearchField('all');
  };

  // Fallback filtering if search API response pending or using offline departments list
  const filteredDepts = searchResults ? searchResults.departments : departments.filter(dept => {
    const q = (activeSearchTerm || searchQuery).toLowerCase().trim();
    if (!q) return true;
    if (searchField === 'department') {
      return dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
    }
    if (searchField === 'name') {
      return dept.hod?.name?.toLowerCase().includes(q);
    }
    return (
      dept.name.toLowerCase().includes(q) || 
      dept.code.toLowerCase().includes(q) ||
      (dept.hod?.name && dept.hod.name.toLowerCase().includes(q))
    );
  });

  const matchingFaculties = searchResults?.faculties || [];
  const matchingScholars = searchResults?.scholars || [];
  const totalMatches = (filteredDepts?.length || 0) + matchingFaculties.length + matchingScholars.length;

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      {/* Background blobs */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      {/* Navigation Header */}
      <GatewayNavbar />

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

        {/* Metrics Hero Card Component with Interactive Search */}
        <ResearchMetricsHero 
          stats={stats} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          searchField={searchField}
          setSearchField={handleSearchFieldChange}
          onSearchSubmit={handleSearchSubmit}
          isSearching={isSearching}
        />

        {/* Top Researchers Leaderboard */}
        <TopResearchersLeaderboard topData={topResearchers} />

        {/* Department Analytics Chart */}
        <DepartmentAnalyticsChart analyticsData={analytics} />

        {/* Anchor for Smooth Scroll Target */}
        <div ref={catalogRef} id="departments-catalog" style={{ scrollMarginTop: '100px' }} />

        {/* Active Search Results Feedback Banner */}
        {activeSearchTerm !== '' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: 'linear-gradient(135deg, var(--color-sync-light) 0%, rgba(2, 132, 199, 0.08) 100%)',
              border: '1px solid var(--color-primary)',
              borderRadius: '20px',
              padding: '20px 24px',
              marginBottom: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(26, 90, 59, 0.3)',
                  flexShrink: 0
                }}>
                  <Search size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      Search Results for "{activeSearchTerm}"
                    </h4>
                    <span style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: '10px',
                      textTransform: 'uppercase'
                    }}>
                      Scope: {searchField === 'all' ? 'All Fields' : searchField}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Found <strong style={{ color: 'var(--color-primary)' }}>{totalMatches}</strong> match{totalMatches === 1 ? '' : 'es'} across Departments, Faculty & HODs, and Student Scholars
                  </span>
                </div>
              </div>

              <button
                onClick={handleClearSearch}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={15} /> Clear Search Filter
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
              {[
                { id: 'all', label: 'All Results', count: totalMatches },
                { id: 'departments', label: 'Departments', count: filteredDepts.length, icon: Building },
                { id: 'faculties', label: 'Faculty & HODs', count: matchingFaculties.length, icon: UserCheck },
                { id: 'scholars', label: 'Students & Scholars', count: matchingScholars.length, icon: GraduationCap }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isActive ? '#FFFFFF' : 'var(--color-text-primary)',
                      border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {Icon && <Icon size={14} />}
                    <span>{tab.label}</span>
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--color-bg)',
                      color: isActive ? '#FFFFFF' : 'var(--color-primary)',
                      padding: '1px 7px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Section Header when NOT searching */}
        {activeSearchTerm === '' && (
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
        )}

        {/* Main Content Grid / State Rendering */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            <Sparkles size={32} className="spin-icon" style={{ marginBottom: '12px', color: 'var(--color-primary)' }} />
            <p style={{ fontWeight: 600 }}>Loading academic departments and research data...</p>
          </div>
        ) : activeSearchTerm !== '' && totalMatches === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--color-surface)',
              borderRadius: '24px',
              border: '1px dashed var(--color-border)',
              maxWidth: '550px',
              margin: '20px auto 40px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Search size={30} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              No Matching Directory Records
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginBottom: '20px', lineHeight: '1.5' }}>
              No department, faculty, HOD, or student scholar matching "<strong>{activeSearchTerm}</strong>" was found in {searchField === 'all' ? 'any field' : searchField}.
            </p>
            <button
              onClick={handleClearSearch}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                borderRadius: '14px',
                fontSize: '0.9rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} /> Reset Search Query
            </button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* 1. DEPARTMENTS SECTION */}
            {(activeTab === 'all' || activeTab === 'departments') && filteredDepts.length > 0 && (
              <div>
                {activeSearchTerm !== '' && (
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building size={20} color="var(--color-primary)" />
                    <span>Matching Departments ({filteredDepts.length})</span>
                  </h3>
                )}
                <motion.div 
                  layout
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '24px'
                  }}
                >
                  <AnimatePresence>
                    {filteredDepts.map(dept => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        key={dept._id} 
                        className="dept-card"
                        onClick={() => navigate(`/discovery/department/${dept.code.toLowerCase()}`)}
                        style={{
                          background: 'var(--color-surface)',
                          borderRadius: '20px',
                          padding: '24px',
                          border: activeSearchTerm !== '' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          boxShadow: activeSearchTerm !== '' ? '0 6px 20px rgba(26, 90, 59, 0.12)' : 'var(--shadow-sm)',
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

                          {(dept.matchingFacultyCount > 0 || dept.matchingScholarCount > 0) && (
                            <div style={{ marginBottom: '14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {dept.matchingFacultyCount > 0 && (
                                <span style={{ fontSize: '0.75rem', background: 'var(--color-sync-light)', color: 'var(--color-primary)', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>
                                  Includes {dept.matchingFacultyCount} matching faculty
                                </span>
                              )}
                              {dept.matchingScholarCount > 0 && (
                                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>
                                  Includes {dept.matchingScholarCount} matching scholars
                                </span>
                              )}
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* 2. FACULTY & HODs SECTION */}
            {(activeTab === 'all' || activeTab === 'faculties') && matchingFaculties.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} color="var(--color-primary)" />
                  <span>Matching Faculty & HODs ({matchingFaculties.length})</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {matchingFaculties.map(faculty => (
                    <motion.div
                      key={faculty._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="dept-card"
                      onClick={() => navigate(`/discovery/profile/${faculty.username}`)}
                      style={{
                        background: 'var(--color-surface)',
                        borderRadius: '20px',
                        padding: '22px',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                          <HODAvatar hod={{ name: faculty.name, avatarUrl: faculty.avatarUrl }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                                {faculty.name}
                              </h4>
                              {faculty.role === 'HOD' && (
                                <span style={{ background: 'var(--color-sync-light)', color: 'var(--color-primary)', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', textTransform: 'uppercase' }}>
                                  HOD
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                              {faculty.designation}
                            </span>
                          </div>
                        </div>

                        {faculty.department && (
                          <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={14} color="var(--color-text-muted)" />
                            <span>{faculty.department}</span>
                          </div>
                        )}

                        {faculty.specialization && (
                          <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Specialization</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{faculty.specialization}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem' }}>
                          <span style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '3px 8px', borderRadius: '8px', color: 'var(--color-primary)', fontWeight: 700 }}>
                            {faculty.publicationCount} Pubs
                          </span>
                          <span style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '8px', color: '#d97706', fontWeight: 700 }}>
                            {faculty.citationCount} Cites
                          </span>
                        </div>

                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Profile <ArrowRight size={14} />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. STUDENTS & SCHOLARS SECTION */}
            {(activeTab === 'all' || activeTab === 'scholars') && matchingScholars.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={20} color="var(--color-track)" />
                  <span>Matching Students & Scholars ({matchingScholars.length})</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                  {matchingScholars.map(scholar => (
                    <motion.div
                      key={scholar._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="dept-card"
                      onClick={() => navigate(`/discovery/profile/${scholar.username}`)}
                      style={{
                        background: 'var(--color-surface)',
                        borderRadius: '20px',
                        padding: '22px',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                          <HODAvatar hod={{ name: scholar.name, avatarUrl: scholar.avatarUrl }} />
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                              {scholar.name}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-track)', fontWeight: 700 }}>
                              {scholar.degreeName || 'Doctoral Scholar'}
                            </span>
                          </div>
                        </div>

                        {scholar.department && (
                          <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={14} color="var(--color-text-muted)" />
                            <span>{scholar.department}</span>
                          </div>
                        )}

                        {(scholar.subject || scholar.thesisTitle) && (
                          <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Research / Subject</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {scholar.thesisTitle || scholar.subject}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Scholar Profile <ArrowRight size={14} />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-wrapper" style={{ width: '36px', height: '36px' }}>
                <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </div>
              <span className="logo-text" style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #34d399 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
              }}>HPU ScholarHub</span>
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
            Designed and Developed by - <Link to="/ayush-sood" style={{ fontWeight: 700, textDecoration: 'underline', color: '#ffffff' }}>Ayush Sood</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RepositoryDepartments;
