import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  CalendarRange, 
  Database, 
  MapPin, 
  Sun, 
  Moon,
  Sparkles,
  Building,
  BellRing,
  ExternalLink,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  Award,
  Globe,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Layers,
  BookOpenCheck,
  Server,
  Activity,
  UserCheck,
  Shield,
  FileText,
  Search,
  Lock,
  ChevronRight,
  Sparkle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { API_URL, SCHOLAR_SYNC_URL, SCHOLAR_TRACK_URL } from './config';

// Custom hook to trigger scroll animations (Reveal on scroll)
const useScrollReveal = () => {
  const [revealed, setRevealed] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, []);

  return [elementRef, revealed];
};

const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M17.523 15.3l1.816 3.146a.5.5 0 1 1-.866.5l-1.833-3.177a8.97 8.97 0 0 1-9.28 0L5.53 19.446a.5.5 0 1 1-.866-.5L6.48 15.3A9 9 0 0 1 3 7.59h18a9 9 0 0 1-3.477 7.71zM7 9.5c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1zm10 0c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.4z" />
  </svg>
);

const Landing = () => {
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [activeSyncRole, setActiveSyncRole] = useState('student');
  const [activeTrackRole, setActiveTrackRole] = useState('student');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Live stats from HPU MongoDB
  const [stats, setStats] = useState({
    scholars: 500,
    guides: 45,
    departments: 47,
    publications: 320,
    awardedDegrees: 84
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Scroll reveal hooks for each major section
  const [aboutRef, aboutRevealed] = useScrollReveal();
  const [syncRef, syncRevealed] = useScrollReveal();
  const [trackRef, trackRevealed] = useScrollReveal();
  const [statsRef, statsRevealed] = useScrollReveal();
  const [announcementsRef, announcementsRevealed] = useScrollReveal();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch live statistics
  useEffect(() => {
    if (!API_URL) {
      setStatsLoading(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/public/stats`);
        if (response.ok) {
          const data = await response.json();
          if (data && typeof data === 'object') {
            setStats({
              scholars: data.scholars ?? 500,
              guides: data.guides ?? 45,
              departments: data.departments ?? 47,
              publications: data.publications ?? 320,
              awardedDegrees: data.awardedDegrees ?? 84
            });
          }
        }
      } catch (err) {
        console.warn('Unable to reach HPU server API for stats. Using seed fallback values.', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Canonical stages from server/models/Thesis.js status enum
  const scholarSyncStages = [
    { num: 1, title: 'Registration & Enrollment', desc: 'Initial intake, guide assignment, and unique 9-digit ScholarHub No. generation.' },
    { num: 2, title: 'Coursework Clearance', desc: 'PG coursework validation with supervisor and HOD digital sign-off.' },
    { num: 3, title: 'Synopsis & DRC Approval', desc: 'Doctoral Research Committee defense and verification of thesis synopsis.' },
    { num: 4, title: 'RAC Periodic Evaluations', desc: 'Active research stage. Research Advisory Committee monitors audits periodically.' },
    { num: 5, title: 'Colloquium Defense', desc: 'Pre-Submission seminar presentation to the department faculty panel.' },
    { num: 6, title: 'Thesis Submission', desc: 'Formatting compliance verification and dissertation document uploading.' },
    { num: 7, title: 'Supervisor & HOD Sign-off', desc: 'Plagiarism check verification and final endorsement of research.' },
    { num: 8, title: 'Viva-Voce Oral Defense', desc: 'Evaluation reports by external panel culminating in open public defense.' },
    { num: 9, title: 'Degree Award & Conferral', desc: 'Official academic senate clearance and Ph.D. degree conferral.' }
  ];

  // ScholarSync capabilities by user role
  const syncRoleCapabilities = {
    student: [
      { text: 'Profile with auto-generated SH No.', desc: 'Your unified 9-digit identification thread across portals.' },
      { text: 'Thesis Milestone Tracking', desc: 'Track your thesis status live through all 9 canonical stages.' },
      { text: 'Document Management', desc: 'Upload chapter drafts, course certificates, and supervisor approvals.' },
      { text: 'Publications Log', desc: 'Record peer-reviewed journal papers, conferences, patents, and IPR.' }
    ],
    supervisor: [
      { text: 'Scholar Workspace Management', desc: 'Monitor and guide progress boards of all assigned scholars.' },
      { text: 'Coursework & Draft Reviews', desc: 'Approve coursework completions and review uploaded drafts.' },
      { text: 'RAC Audit Logging', desc: 'Submit mandatory progress review evaluation logs.' },
      { text: 'Request Review Dashboard', desc: 'Authorize scholar supervisor allocations and change requests.' }
    ],
    hod_admin: [
      { text: 'Enrollment & Guides Allocation', desc: 'Onboard new scholars and assign supervisors across departments.' },
      { text: 'DRC & Viva Scheduling', desc: 'Plan DRC proposal defences and schedule external Viva-Voce exams.' },
      { text: 'Cross-Department Auditing', desc: 'Verify scholar records and handle departmental transfers.' },
      { text: 'Comprehensive Reporting', desc: 'Pull statistics, check program timeline violations, and compile reports.' }
    ]
  };

  // ScholarTrack capabilities by user role
  const trackRoleCapabilities = {
    student: [
      { text: 'Attendance Register View', desc: 'Track daily biometric check-ins and per-course records.' },
      { text: '75% Compliance Tracker', desc: 'A forward-projecting gauge indicating if you meet compliance limits.' },
      { text: 'Leave Applications', desc: 'Apply online for academic or medical leaves with document uploads.' },
      { text: 'Correction Submissions', desc: 'Submit claims to rectify missed registers directly to your supervisor.' }
    ],
    faculty: [
      { text: 'Class Registers & Logs', desc: 'Manually mark or edit biometric registers for scheduled lectures.' },
      { text: 'Attendance Statistics Audit', desc: 'Drill down class rosters, logs, and individual candidate stats.' },
      { text: 'Leave & Correction Approvals', desc: 'Review, approve, or reject student leaves and corrections.' },
      { text: 'Defaulter Alerts', desc: 'Instantly view list of candidates falling below the 75% threshold.' }
    ],
    hod: [
      { text: 'Department Auditing', desc: 'Approve escalated leaves and monitor department compliance registers.' },
      { text: 'Timetables Configuration', desc: 'Manage, create, and clone class timetables and sessions.' },
      { text: 'Timetable Log Verifier', desc: 'Verify scheduled classes against actual registers taken.' },
      { text: 'Condonation Review', desc: 'Authorize attendance condonations for students with genuine excuses.' }
    ],
    admin: [
      { text: 'Compliance Policy Engine', desc: 'Set minimum thresholds (75%), condonations, and edit windows.' },
      { text: 'Academic Master Data', desc: 'Setup degree programs, sessions, semesters, and holidays.' },
      { text: 'Account Verification', desc: 'Verify, onboard, and audit login privileges of all HPU members.' },
      { text: 'Compliance Report Exports', desc: 'Generate system-wide monthly registers and compliance records.' }
    ]
  };

  // Refreshed Announcements for today (July 8, 2026)
  const announcements = [
    { 
      id: 1, 
      type: 'Notice', 
      title: 'Admissions open for Ph.D. session 2026-27. Last date to submit applications is July 15, 2026.', 
      date: 'June 15, 2026', 
      tag: 'Academic',
      badgeClass: 'badge-academic'
    },
    { 
      id: 2, 
      type: 'Event', 
      title: 'Annual HPU Research Colloquium scheduled for July 28 at Summer Hill Campus Auditorium.', 
      date: 'July 05, 2026', 
      tag: 'Research',
      badgeClass: 'badge-research'
    },
    { 
      id: 3, 
      type: 'Alert', 
      title: 'ScholarTrack Attendance audit warning: PG candidates with less than 75% attendance must submit leaves by July 22, 2026.', 
      date: 'July 06, 2026', 
      tag: 'Attendance',
      badgeClass: 'badge-attendance'
    },
    { 
      id: 4, 
      type: 'Update', 
      title: 'HPU library access tokens migrated to unified student profiles database.', 
      date: 'July 07, 2026', 
      tag: 'Library',
      badgeClass: 'badge-library'
    }
  ];

  // Quick Directory Links - Official HPU Shimla Portals
  const quickLinks = [
    { 
      name: 'HPU Official Website', 
      icon: <Globe size={18} />, 
      url: 'https://www.hpuniv.ac.in/', 
      status: 'External Link' 
    },
    { 
      name: 'Admissions Portal', 
      icon: <UserCheck size={18} />, 
      url: 'https://nadmissions.hpushimla.in/', 
      status: 'Official Portal' 
    },
    { 
      name: 'Registration & Migration Portal (RME)', 
      icon: <FileSpreadsheet size={18} />, 
      url: 'https://nrme.hpushimla.in/', 
      status: 'Official Portal' 
    },
    { 
      name: 'Examinations Portal', 
      icon: <GraduationCap size={18} />, 
      url: 'https://nexams.hpushimla.in/', 
      status: 'Official Portal' 
    },
    { 
      name: 'HPU Student Portal', 
      icon: <Users size={18} />, 
      url: 'https://nstudentportal.hpushimla.in/', 
      status: 'Official Portal' 
    }
  ];

  // Smooth scroll helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (location.state?.scrollTo) {
      setTimeout(() => {
        scrollToSection(location.state.scrollTo);
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="landing-page">
      {/* Background blobs */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <a href="/" className="landing-logo" style={{ textDecoration: 'none' }}>
          <div className="landing-logo-wrapper">
            <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <span className="logo-text">HPU ScholarHub</span>
        </a>

        {/* Center Navigation Links */}
        <div className="nav-links">
          <button onClick={() => scrollToSection('home')} className="nav-link-btn">Home</button>
          <button onClick={() => scrollToSection('about')} className="nav-link-btn">About</button>
          <button onClick={() => scrollToSection('portals')} className="nav-link-btn">Portals</button>
          <Link to="/discovery" className="nav-link-btn">Academic Research Discovery</Link>
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
            onClick={() => scrollToSection('portals')} 
            className="btn-primary login-nav-btn"
          >
            Login Portal <ArrowUpRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} /> Himachal Pradesh University Portal Gateway
          </div>
          <h1 className="hero-title">
            Every Stage of Research.<br/>
            Every Day of Attendance.<br/>
            <span>One Record.</span>
          </h1>
          <p className="hero-subtitle">
            ScholarHub is HPU's unified digital gateway for tracking Ph.D. research progress and monitoring student attendance. Operating on a single login, one shared record, and two purpose-built application portals.
          </p>
          <div className="hero-buttons">
            <button onClick={() => scrollToSection('portals')} className="btn-primary">
              Explore Portals <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollToSection('about')} className="btn-outline">
              Learn More
            </button>
          </div>
        </div>

        <div className="hero-image-container">
          <div className="glass-panel animated-svg-box" style={{ background: 'var(--glass-bg)', padding: '30px' }}>
            {/* Interactive spoke SVG */}
            <svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hub-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#133A26" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="hub-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              {/* Grid Background lines */}
              <g opacity="0.1" stroke="var(--color-text-secondary)" strokeWidth="1">
                <line x1="50" y1="50" x2="350" y2="50" />
                <line x1="50" y1="120" x2="350" y2="120" />
                <line x1="50" y1="190" x2="350" y2="190" />
                <line x1="50" y1="260" x2="350" y2="260" />
                <line x1="50" y1="330" x2="350" y2="330" />
                
                <line x1="50" y1="50" x2="50" y2="350" />
                <line x1="120" y1="50" x2="120" y2="350" />
                <line x1="190" y1="50" x2="190" y2="350" />
                <line x1="260" y1="50" x2="260" y2="350" />
                <line x1="330" y1="50" x2="330" y2="350" />
              </g>

              {/* Data streams radiating from center */}
              <g stroke="var(--color-primary)" strokeWidth="2.5" opacity="0.4">
                <line x1="200" y1="200" x2="90" y2="130">
                  <animate attributeName="stroke-dasharray" values="0,150; 150,0" dur="4s" repeatCount="indefinite" />
                </line>
                <line x1="200" y1="200" x2="310" y2="130">
                  <animate attributeName="stroke-dasharray" values="0,150; 150,0" dur="4.5s" repeatCount="indefinite" />
                </line>
                <line x1="200" y1="200" x2="200" y2="320">
                  <animate attributeName="stroke-dasharray" values="0,150; 150,0" dur="5s" repeatCount="indefinite" />
                </line>
              </g>

              {/* Glowing radar rings */}
              <circle cx="200" cy="200" r="80" fill="none" stroke="url(#hub-grad-1)" strokeWidth="1.5" strokeDasharray="10 15">
                <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="16s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="200" r="110" fill="none" stroke="url(#hub-grad-2)" strokeWidth="1" strokeDasharray="30 20">
                <animateTransform attributeName="transform" type="rotate" from="360 200 200" to="0 200 200" dur="20s" repeatCount="indefinite" />
              </circle>

              {/* ScholarSync node */}
              <g transform="translate(90, 130)" style={{ cursor: 'pointer' }} onClick={() => scrollToSection('scholarsync')}>
                <circle cx="0" cy="0" r="32" fill="var(--color-surface)" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.08))" stroke="var(--color-primary)" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="22" fill="rgba(26, 90, 59, 0.08)" />
                <path d="M-8 -4 L0 -10 L8 -4 L8 6 L-8 6 Z" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                <path d="M-10 -2 L0 -8 L10 -2" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                <text x="0" y="45" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">ScholarSync</text>
                <animate attributeName="transform" type="translate" values="90,130; 90,124; 90,130" dur="3s" repeatCount="indefinite" />
              </g>

              {/* ScholarTrack node */}
              <g transform="translate(310, 130)" style={{ cursor: 'pointer' }} onClick={() => scrollToSection('scholartrack')}>
                <circle cx="0" cy="0" r="32" fill="var(--color-surface)" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.08))" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="22" fill="rgba(2, 132, 199, 0.08)" />
                <rect x="-7" y="-7" width="14" height="14" rx="2" fill="none" stroke="#0284c7" strokeWidth="1.5" />
                <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#0284c7" strokeWidth="1.5" />
                <line x1="-3" y1="2" x2="1" y2="2" stroke="#0284c7" strokeWidth="1.5" />
                <text x="0" y="45" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">ScholarTrack</text>
                <animate attributeName="transform" type="translate" values="310,130; 310,136; 310,130" dur="3.5s" repeatCount="indefinite" />
              </g>

              {/* Shared Database node */}
              <g transform="translate(200, 320)">
                <circle cx="0" cy="0" r="26" fill="var(--color-surface)" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.08))" stroke="#d97706" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="18" fill="rgba(251, 191, 36, 0.08)" />
                <ellipse cx="0" cy="-4" rx="6" ry="2.5" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <path d="M-6 -4 A 6 2.5 0 0 0 6 -4" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <path d="M-6 -4 L-6 4 A 6 2.5 0 0 0 6 4 L6 -4" fill="none" stroke="#d97706" strokeWidth="1.5" />
                <text x="0" y="38" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">Shared DB</text>
                <animate attributeName="transform" type="translate" values="200,320; 204,320; 200,320" dur="4s" repeatCount="indefinite" />
              </g>

              {/* Central HPU Server Node */}
              <circle cx="200" cy="200" r="44" fill="#ffffff" filter="drop-shadow(0px 12px 24px rgba(19, 58, 38, 0.15))" stroke="rgba(19, 58, 38, 0.1)" strokeWidth="2" />
              <image href="/hpu_logo.png" x="172" y="172" width="56" height="56" />
            </svg>
          </div>
        </div>
      </section>

      {/* "What is ScholarHub" - Shared Identity Section */}
      <section 
        id="about" 
        ref={aboutRef}
        className={`about-identity-section reveal-element ${aboutRevealed ? 'revealed' : ''}`}
      >
        <div className="section-header">
          <h2 className="section-title">One Identity. Two Portals. One Database.</h2>
          <p className="section-subtitle">
            HPU's custom digital architecture bridges PG attendance compliance and PhD thesis tracking workflows under a unified database backend.
          </p>
        </div>

        <div className="identity-grid">
          <div className="clay-card identity-card">
            <div className="identity-icon-wrapper sh-no-icon">
              <Users size={28} />
            </div>
            <h4>One Identity (SH No.)</h4>
            <p>
              Upon registration, every candidate receives a unique 9-digit <strong>ScholarHub Number (SH No.)</strong>. This serves as a common key across both apps, linking attendance registries with research portfolios.
            </p>
          </div>

          <div className="clay-card identity-card">
            <div className="identity-icon-wrapper portals-icon">
              <Layers size={28} />
            </div>
            <h4>Two Specialized Portals</h4>
            <p>
              <strong>ScholarSync</strong> maps the candidate lifecycle and coordinates supervisor approvals, while <strong>ScholarTrack</strong> audits class check-ins against HPU's strict compliance policies.
            </p>
          </div>

          <div className="clay-card identity-card">
            <div className="identity-icon-wrapper database-icon">
              <Database size={28} />
            </div>
            <h4>Unified Database Backend</h4>
            <p>
              Data is synced in real-time to a secure MongoDB cluster, ensuring HODs, supervisors, and administrative offices see identical, tamper-proof student profiles and registers.
            </p>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="portals-hub-section">
        <div className="section-header">
          <div className="section-badge">INTEGRATED PORTALS</div>
          <h2 className="section-title">Launch ScholarHub Applications</h2>
          <p className="section-subtitle">
            Access either portal below using your unified institutional account credentials. Role-based view configurations will apply automatically.
          </p>
        </div>

        <div className="projects-grid">
          {/* ScholarSync Launcher Card */}
          <div 
            className="clay-card project-launch-card sync-launcher"
            onClick={() => SCHOLAR_SYNC_URL && (window.location.href = SCHOLAR_SYNC_URL)}
            style={!SCHOLAR_SYNC_URL ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            <div className="project-icon-wrapper" style={{ background: 'rgba(26, 90, 59, 0.08)' }}>
              <GraduationCap size={32} color="#133A26" />
            </div>
            <div style={{ width: '100%' }}>
              <h3 className="project-card-title">ScholarSync</h3>
              <p style={{ color: 'var(--color-primary)', fontSize: '0.88rem', fontWeight: 700, margin: '4px 0 12px' }}>
                PhD Candidate Lifecycle Portal
              </p>
              <p className="project-card-desc">
                Log doctoral progress checkpoints, review publications and synopsis submissions, coordinate guide allocations, and search department researchers directory.
              </p>
            </div>
            <div className="project-tags">
              <span className="project-tag">9-Stage Milestones</span>
              <span className="project-tag">DRC & RAC Audits</span>
              <span className="project-tag">Publications Directory</span>
              <span className="project-tag">Research Labs</span>
            </div>
            {SCHOLAR_SYNC_URL ? (
              <a href={SCHOLAR_SYNC_URL} className="btn-primary launcher-btn" style={{ width: '100%', marginTop: 'auto' }}>
                Launch ScholarSync Portal <ArrowUpRight size={16} />
              </a>
            ) : (
              <div className="env-error-banner" style={{ width: '100%', marginTop: 'auto' }}>
                ⚠️ VITE_SCHOLAR_SYNC_URL not configured in .env
              </div>
            )}
          </div>

          {/* ScholarTrack Launcher Card */}
          <div 
            className="clay-card project-launch-card track-launcher"
            onClick={() => SCHOLAR_TRACK_URL && (window.location.href = SCHOLAR_TRACK_URL)}
            style={!SCHOLAR_TRACK_URL ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            <div className="project-icon-wrapper" style={{ background: 'rgba(2, 132, 199, 0.08)' }}>
              <CalendarRange size={32} color="#0284c7" />
            </div>
            <div style={{ width: '100%' }}>
              <h3 className="project-card-title">ScholarTrack</h3>
              <p style={{ color: '#0284c7', fontSize: '0.88rem', fontWeight: 700, margin: '4px 0 12px' }}>
                Smart Attendance Auditing Suite
              </p>
              <p className="project-card-desc">
                Audit monthly registers, evaluate daily biometric check-ins against the 75% minimum threshold rule, and submit supervisor-verified leave requests.
              </p>
            </div>
            <div className="project-tags">
              <span className="project-tag" style={{ background: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }}>Biometric Sync</span>
              <span className="project-tag" style={{ background: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }}>75% Threshold</span>
              <span className="project-tag" style={{ background: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }}>Leaves & Corrections</span>
              <span className="project-tag" style={{ background: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }}>HOD Policy Control</span>
            </div>
            {SCHOLAR_TRACK_URL ? (
              <a href={SCHOLAR_TRACK_URL} className="btn-primary launcher-btn" style={{ width: '100%', marginTop: 'auto', background: 'linear-gradient(135deg, #075985 0%, #0284c7 100%)', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.2)' }}>
                Launch ScholarTrack Portal <ArrowUpRight size={16} />
              </a>
            ) : (
              <div className="env-error-banner" style={{ width: '100%', marginTop: 'auto' }}>
                ⚠️ VITE_SCHOLAR_TRACK_URL not configured in .env
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ScholarSync Deep Dive */}
      <section 
        id="scholarsync" 
        ref={syncRef}
        className={`deepdive-section sync-deepdive reveal-element ${syncRevealed ? 'revealed' : ''}`}
      >
        <div className="deepdive-grid">
          <div className="deepdive-text">
            <div className="deepdive-badge sync-accent">
              <GraduationCap size={14} /> ScholarSync
            </div>
            <h2 className="deepdive-title">Ph.D. Progress & Research Monitoring</h2>
            <p className="deepdive-desc">
              ScholarSync provides complete visibility into a PhD candidate's progress, logging each academic checkpoint transparently from university enrollment to final degree conferral.
            </p>

            {/* Interactive Roles Tab */}
            <div className="roles-tab-container">
              <span className="roles-label">Capabilities:</span>
              <div className="roles-tabs">
                {['student', 'supervisor', 'hod_admin'].map((role) => (
                  <button 
                    key={role}
                    onClick={() => setActiveSyncRole(role)}
                    className={`role-tab-btn sync-accent ${activeSyncRole === role ? 'active' : ''}`}
                  >
                    {role === 'hod_admin' ? 'HOD / Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Role features list */}
            <div className="role-features-list">
              {syncRoleCapabilities[activeSyncRole].map((cap, index) => (
                <div key={index} className="role-feature-item">
                  <div className="feature-marker sync-marker"><CheckCircle2 size={16} /></div>
                  <div className="feature-text">
                    <strong>{cap.text}</strong>
                    <span>{cap.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Discovery layer mention */}
            <div className="discovery-layer-box glass-panel">
              <div className="discovery-header">
                <Globe size={16} color="var(--color-primary)" />
                <h5>Research Discovery Directory</h5>
              </div>
              <p>Browse department research labs, collaborate across branches, audit published patents/IPR papers, and check local academic conferences & events schedules.</p>
            </div>
          </div>

          {/* Timeline representation */}
          <div className="deepdive-visual">
            <div className="glass-panel timeline-widget">
              <h4 className="widget-title">PhD Progress Milestones</h4>
              <p className="widget-subtitle">Standard HPU doctoral thesis sequence</p>
              
              <div className="timeline-trail">
                {scholarSyncStages.map((st) => (
                  <div key={st.num} className="timeline-node">
                    <div className="timeline-node-number">{st.num}</div>
                    <div className="timeline-node-info">
                      <h5>{st.title}</h5>
                      <p>{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ScholarTrack Deep Dive */}
      <section 
        id="scholartrack" 
        ref={trackRef}
        className={`deepdive-section track-deepdive reveal-element ${trackRevealed ? 'revealed' : ''}`}
      >
        <div className="deepdive-grid alt-layout">
          {/* Attendance Mock Widget */}
          <div className="deepdive-visual">
            <div className="glass-panel mock-dashboard-card">
              <div className="mock-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#0284c7" />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Attendance Overview</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Session: 2026-27</span>
                  </div>
                </div>
                <div className="mock-badge-status met">Compliance Met</div>
              </div>

              {/* Progress gauge */}
              <div className="mock-gauge-section">
                <div className="mock-gauge-circle">
                  <span className="gauge-number">78%</span>
                  <span className="gauge-label">Cumulative Rate</span>
                </div>
                <div className="mock-gauge-details">
                  <div className="gauge-threshold">
                    <Shield size={14} color="#0284c7" />
                    <span>75% Compliance Rule</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    You are <strong>3% above</strong> the HPU attendance policy threshold limit.
                  </p>
                </div>
              </div>

              {/* Registers breakdown list */}
              <div className="mock-registers-list">
                <h5 className="registers-title">Per-Course Attendance</h5>
                
                <div className="mock-register-item">
                  <div className="register-info">
                    <strong>RM-901 (Research Methodology)</strong>
                    <span>14 Present, 2 Absent, 1 Late</span>
                  </div>
                  <div className="register-percentage met">82%</div>
                </div>

                <div className="mock-register-item">
                  <div className="register-info">
                    <strong>AT-903 (Advanced Topic Analysis)</strong>
                    <span>11 Present, 4 Absent, 1 Leave</span>
                  </div>
                  <div className="register-percentage warning">72%</div>
                </div>
              </div>

              {/* Vocabulary badges */}
              <div className="vocabulary-row">
                <span className="vocab-badge present">Present</span>
                <span className="vocab-badge absent">Absent</span>
                <span className="vocab-badge late">Late</span>
                <span className="vocab-badge leave">Leave</span>
              </div>

              {/* Leave approval ticket */}
              <div className="mock-leave-alert">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} color="#0284c7" />
                  <span style={{ fontWeight: '600' }}>Medical Leave Request</span>
                </div>
                <span className="leave-status-tag">Approved by Guide</span>
              </div>
            </div>
          </div>

          <div className="deepdive-text">
            <div className="deepdive-badge track-accent">
              <CalendarRange size={14} /> ScholarTrack
            </div>
            <h2 className="deepdive-title">Attendance Compliance & Leaves Audit</h2>
            <p className="deepdive-desc">
              ScholarTrack automates register updates and leave application approvals. It evaluates attendance against the university's load-bearing <strong>75% compliance threshold</strong>, triggering defaulter alerts for course violations.
            </p>

            {/* Interactive Roles Tab */}
            <div className="roles-tab-container">
              <span className="roles-label">Capabilities:</span>
              <div className="roles-tabs">
                {['student', 'faculty', 'hod', 'admin'].map((role) => (
                  <button 
                    key={role}
                    onClick={() => setActiveTrackRole(role)}
                    className={`role-tab-btn track-accent ${activeTrackRole === role ? 'active' : ''}`}
                  >
                    {role === 'hod' ? 'HOD' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Role features list */}
            <div className="role-features-list">
              {trackRoleCapabilities[activeTrackRole].map((cap, index) => (
                <div key={index} className="role-feature-item">
                  <div className="feature-marker track-marker"><CheckCircle2 size={16} /></div>
                  <div className="feature-text">
                    <strong>{cap.text}</strong>
                    <span>{cap.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gateway Statistics */}
      <section 
        id="stats"
        ref={statsRef}
        className={`stats-infra-section reveal-element ${statsRevealed ? 'revealed' : ''}`}
      >
        <div className="section-header">
          <h2 className="section-title">Gateway Statistics</h2>
          <p className="section-subtitle">
            Real-time metrics for academic departments and unified scholar profiles across both HPU services.
          </p>
        </div>

        {/* Dynamic statistics counter grid */}
        <div className="stats-counters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', maxWidth: '1000px', margin: '0 auto' }}>
          <div className="clay-card stat-counter-card">
            {statsLoading ? (
              <div className="stat-skeleton"></div>
            ) : (
              <span className="stat-number">{stats.scholars}</span>
            )}
            <span className="stat-label">Registered Scholars</span>
          </div>

          <div className="clay-card stat-counter-card">
            {statsLoading ? (
              <div className="stat-skeleton"></div>
            ) : (
              <span className="stat-number">{stats.departments}</span>
            )}
            <span className="stat-label">HPU Departments</span>
          </div>

          <div className="clay-card stat-counter-card">
            {statsLoading ? (
              <div className="stat-skeleton"></div>
            ) : (
              <span className="stat-number">{stats.scholars}</span>
            )}
            <span className="stat-label">Unified Student Profiles</span>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="footer">
        <div className="footer-content" style={isMobile ? { flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' } : {}}>
          <div className="footer-brand" style={isMobile ? { marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' } : {}}>
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
            <p className="footer-text" style={isMobile ? { marginTop: '8px', maxWidth: '300px' } : {}}>
              Centralized digital service gateway for PG attendance and PhD thesis tracking at Himachal Pradesh University (HPU), Summer Hill, Shimla.
            </p>
          </div>
          <div className="footer-contact-info" style={isMobile ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' } : {}}>
            <div className="contact-item">
              <MapPin size={16} />
              <span>HPU Campus, Summer Hill, Shimla, HP, India</span>
            </div>
            <div className="contact-item">
              <Building size={16} />
              <span>Himachal Pradesh University Shimla</span>
            </div>
          </div>
          
          {isMobile && (
            <div style={{
              width: 'calc(100% - 32px)',
              margin: '20px 16px 10px',
              padding: '22px 16px',
              background: 'rgba(241, 245, 249, 0.45)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '20px',
              border: '1px solid rgba(203, 213, 225, 0.5)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                margin: '0 0 16px 0',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>📲</span> Install Apps
                <span style={{ display: 'inline-flex', gap: '6px', opacity: 0.9 }}>
                  <AndroidIcon />
                  <AppleIcon />
                </span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                <a 
                  href={`${SCHOLAR_SYNC_URL || 'http://localhost:5173'}?install=true&src=SCHOLAR_HUB`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'rgba(15, 23, 42, 0.08)',
                    border: '1px solid rgba(15, 23, 42, 0.15)',
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    width: '100%',
                    maxWidth: '280px',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  <span>🎓</span> <span><strong>Scholar Sync HPU</strong></span>
                </a>
                <a 
                  href={`${SCHOLAR_TRACK_URL || 'http://localhost:5174'}?install=true&src=SCHOLAR_HUB`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'rgba(15, 23, 42, 0.08)',
                    border: '1px solid rgba(15, 23, 42, 0.15)',
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    width: '100%',
                    maxWidth: '280px',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  <span>📊</span> <span><strong>Scholar Track HPU</strong></span>
                </a>
              </div>
            </div>
          )}
        </div>
        
        <div className="footer-bottom-bar">
          <div>
            <span>© {new Date().getFullYear()} Himachal Pradesh University. All rights reserved.</span>
          </div>
          <div className="developer-tag">
            Developed by - <Link to="/acknowledgements" style={{ fontWeight: 700, textDecoration: 'underline', color: '#ffffff' }}>Ayush Sood</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
