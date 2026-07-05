import React, { useState, useEffect, useRef } from 'react';
import { Search, Beaker, Users, FileText, Banknote } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from './context/ToastContext';
import { API_URL, API_BASE_URL } from './config';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Landing = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const toastShown = useRef(null);

  useEffect(() => {
    const toastMsg = searchParams.get('toast');
    if (toastMsg && toastShown.current !== toastMsg) {
      toastShown.current = toastMsg;
      toast.success(toastMsg);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/projects`);
        if (Array.isArray(res.data)) {
          setProjects(res.data);
        } else {
          console.error('Expected array of projects but got:', res.data);
          setProjects([]);
        }
      } catch (err) {
        console.error('Error fetching doctoral projects:', err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const getDeptImage = (dept = '') => {
    const d = dept.toLowerCase();
    if (d.includes('computer') || d.includes('data science') || d.includes('information technology') || d.includes('it') || d.includes('cs')) {
      return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80';
    }
    if (d.includes('phys') || d.includes('electr') || d.includes('math') || d.includes('quantum')) {
      return 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=400&q=80';
    }
    if (d.includes('chem') || d.includes('bio') || d.includes('forensic') || d.includes('micro')) {
      return 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=400&q=80';
  };

  return (
    <div className="landing-page">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Unify Your Research Journey<br/>with ScholarSync.</h1>
          <p className="hero-subtitle">
            A centralized platform for researchers, faculty, and departments<br/>
            to connect, collaborate, and thrive.
          </p>
          <div className="hero-buttons">
            <a href="#featured-projects" className="btn-dark" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Explore Projects</a>
            <Link to="/signup" className="btn-dark" style={{ textDecoration: 'none', background: '#A5D6A7', color: '#133A26', display: 'inline-flex', alignItems: 'center' }}>Create Profile</Link>
          </div>
        </div>
      </section>

      {/* Main Content White Wrapper */}
      <div className="main-content-wrapper">
        {/* Overlapping Feature Cards */}
        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Beaker size={32} color="#133A26" /></div>
              <h3 className="feature-title">Discover Research Labs</h3>
              <p className="feature-text">Common platform for researchers, faculty, and department labs.</p>
              <Link to="/labs" className="btn-feature" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Browse Labs</Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Users size={32} color="#133A26" /></div>
              <h3 className="feature-title">Find Collaborators</h3>
              <p className="feature-text">Centralized platform for researchers, faculty, and sponsors.</p>
              <Link to="/collaborate" className="btn-feature" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Connect Now</Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><FileText size={32} color="#133A26" /></div>
              <h3 className="feature-title">Access Publications</h3>
              <p className="feature-text">Search in journals, papers, graphs, and access publications.</p>
              <Link to="/publications" className="btn-feature" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>Search Archive</Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Banknote size={32} color="#133A26" /></div>
              <h3 className="feature-title">Manage Grants & Funding</h3>
              <p className="feature-text">Centralized platform to researchers, faculty, manage grants, and funding.</p>
              <Link to="/funding" className="btn-feature" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>View Opportunities</Link>
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="projects-section" id="featured-projects">
          <h2 className="section-title">Featured Doctoral Projects</h2>
          
          {loading ? (
            <div className="premium-preloader-container" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="premium-preloader-spinner"></div>
              <div className="premium-preloader-text">Loading doctoral projects...</div>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
              No active doctoral projects logged in the portal yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
              {projects.slice(0, 4).map((proj, idx) => (
                <div className="project-card" key={proj._id || idx}>
                  <img 
                    src={proj.imageUrl || getDeptImage(proj.department)} 
                    alt={proj.title} 
                    className="project-image" 
                    style={{ width: '100%', height: '140px', borderRadius: '12px', objectFit: 'cover' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', background: '#EAF4EE', color: '#133A26', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        {proj.department ? proj.department.replace('Department of ', '') : 'Research'}
                      </span>
                      <span style={{ fontSize: '0.65rem', background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>
                        {proj.status ? proj.status.replace('_', ' ') : 'ACTIVE'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0, lineHeight: '1.4' }}>{proj.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {proj.abstract}
                    </p>
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '10px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#374151' }}>
                        <strong>Scholar:</strong> {proj.scholarId?.name || proj.scholarName || 'Academic Scholar'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#4B5563' }}>
                        <strong>Guide:</strong> {proj.supervisorId?.name || proj.supervisorName || 'Faculty Guide'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
