import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import {
  Code,
  Terminal,
  Cpu,
  Layers,
  Award,
  Calendar,
  Briefcase,
  Globe,
  Sparkles,
  Sun,
  Moon,
  ArrowLeft,
  ChevronRight,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  Database,
  Server,
  Layout,
  ShieldCheck,
  Zap,
  Users,
  Send,
  Copy,
  Check,
  CornerDownLeft,
  GraduationCap,
  HelpCircle,
  Video,
  FileText,
  Phone,
  CloudSun,
  Bot,
  Wrench,
  Workflow,
  Lightbulb,
  Boxes
} from 'lucide-react';
import '../DeveloperProfile.css';
import {
  useLenisScroll,
  ParticleCanvas,
  MouseSpotlight,
  TiltCard,
  MagneticButton,
  ScrambleText,
  AnimatedCounter,
  OrbitalSkills
} from '../components/CreativeComponents';

const DeveloperProfile = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMsg, setContactMsg] = useState({ name: '', email: '', message: '' });
  const [sentStatus, setSentStatus] = useState(false);

  // Initialize Lenis Smooth Scroll
  useLenisScroll(Lenis);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Terminal state
  const [termInput, setTermInput] = useState('');
  const [termHistory, setTermHistory] = useState([
    { type: 'output', content: '⚡ Ayush Sood Cyber Terminal v3.0 (Full-Stack & AI Systems Environment)' },
    { type: 'output', content: 'Type "help" or click suggestion chips below to query interactive developer data.' }
  ]);
  const termBodyRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('ayushsood965@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Projects Dataset
  const projectsData = [
    {
      id: 'scholarsync',
      name: 'ScholarSync Research Platform',
      type: 'SCHOLARHUB ECOSYSTEM',
      category: 'ECOSYSTEM',
      desc: 'Next-gen academic research collaboration portal featuring real-time lab tracking, grant allocations, collaborative publication repositories, and multi-tier milestone approvals.',
      tech: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT RBAC', 'Vanilla CSS'],
      impact: '10,000+ Scholars & Faculty',
      icon: <Layers size={20} />
    },
    {
      id: 'scholartrack',
      name: 'ScholarTrack Attendance Engine',
      type: 'SCHOLARHUB ECOSYSTEM',
      category: 'ECOSYSTEM',
      desc: 'End-to-end scholar progress & attendance lifecycle monitoring engine. Includes automated departmental sign-offs, attendance matrix generators, and automated PDF progress reports.',
      tech: ['React 19', 'Framer Motion', 'jsPDF', 'Axios', 'Recharts'],
      impact: '100% Paperless Progress Tracking',
      icon: <Zap size={20} />
    },
    {
      id: 'student-helpdesk',
      name: 'HPU Student Helpdesk Ticketing System',
      type: 'HELPDESK & SUPPORT',
      category: 'HELPDESK',
      desc: 'Individually designed and developed a comprehensive Helpdesk Ticketing System serving over 3 lakh HPU students. Built using WordPress and Laravel/MySQL featuring Custom User Authentication, Role Management, and report generation.',
      tech: ['Laravel', 'MySQL', 'WordPress', 'PHP', 'JavaScript', 'Custom Auth'],
      impact: 'Serves 3 Lakh+ HPU Students',
      icon: <HelpCircle size={20} />
    },
    {
      id: 'erp-knowledge-base',
      name: 'ERP Knowledge Base & Video Tutorials',
      type: 'ACADEMIC KNOWLEDGE BASE',
      category: 'KNOWLEDGE',
      desc: 'Created an extensive knowledge base and how-to video tutorials for HPU ERP academic modules (recruitment, admissions, registration, migration, fee payment, hostel management). Maintained a YouTube channel for user empowerment.',
      tech: ['WordPress', 'HTML/CSS', 'Video Creation', 'User Docs', 'FAQs'],
      impact: 'University-Wide ERP Adoption',
      icon: <Video size={20} />
    },
    {
      id: 'ai-mcp-automation',
      name: 'AI Agent & MCP Automation Pipeline',
      type: 'AI & AUTOMATION',
      category: 'AI',
      desc: 'Architected intelligent AI automation workflows and Model Context Protocol (MCP) server integrations enabling multi-tool autonomous agent execution and smart code synthesis.',
      tech: ['Python', 'Node.js', 'MCP Protocols', 'LLM Prompting', 'AI Agents'],
      impact: 'Autonomous Multi-Tool AI',
      icon: <Bot size={20} />
    },
    {
      id: 'erp-proj-mgmt',
      name: 'HPU ERP Project Management Tool',
      type: 'ERP UTILITIES',
      category: 'ERP',
      desc: 'Collaborated with ERP developers to build a custom Project Management Tool for university operations, enhancing task tracking, module smoothness, and team coordination.',
      tech: ['PHP', 'Laravel', 'MySQL', 'System Analysis', 'Bootstrap'],
      impact: 'Streamlined HPU Tech Operations',
      icon: <Cpu size={20} />
    },
    {
      id: 'hpu-gateway',
      name: 'HPU Academic Research Gateway',
      type: 'ACADEMIC REPOSITORY',
      category: 'ECOSYSTEM',
      desc: 'Central discovery and analytics portal unifying research output, patents, and faculty profiles across Physics, Forensic Science, Computer Science, and Humanities at HPU.',
      tech: ['Vite', 'React', 'RESTful API', 'Glassmorphism UI', 'Nginx'],
      impact: '25+ HPU Departments Unified',
      icon: <Globe size={20} />
    }
  ];

  const filteredProjects = activeFilter === 'ALL'
    ? projectsData
    : projectsData.filter(p => p.category === activeFilter);

  // Terminal logic
  const handleTermCommand = (cmdStr) => {
    const cleanCmd = cmdStr.trim().toLowerCase();
    const newHist = [...termHistory, { type: 'prompt', content: `$ ${cmdStr}` }];

    switch (cleanCmd) {
      case 'help':
        newHist.push({
          type: 'output',
          content: `Available Commands:
• bio        - View Ayush's professional summary
• frontend   - View Frontend Mastery details
• backend    - View Backend Architecture details
• ai         - View AI, LLM & MCP Server skills
• experience - See HPU Computer Programmer career history
• projects   - List ScholarSync, ScholarTrack & Helpdesk systems
• education  - View Graduation (HPU) & Post Graduation (IGNOU)
• certs      - View 3 Coursera Certifications
• contact    - Get email & phone contact info
• clear      - Clear terminal screen`
        });
        break;
      case 'bio':
        newHist.push({
          type: 'output',
          content: `👨‍💻 Ayush Sood — Programmer & AI Automation Specialist
Dedicated Programmer with 7+ years of experience at Himachal Pradesh University (HPU), Shimla.
Expert in React, Node.js, Laravel, ERP Module Refinement, AI Workflows (MCP Servers), and Helpdesk Systems.`
        });
        break;
      case 'frontend':
        newHist.push({
          type: 'output',
          content: `🎨 Frontend Engineering Mastery:
• Frameworks & Libraries: React (18/19), Vite, Framer Motion, Lenis Smooth Scroll, Recharts
• Styling & Design Systems: Vanilla CSS, Glassmorphism, Micro-animations, Responsive UX
• Standards: ES6+ JavaScript, Single Page Applications, Dynamic Rendering, ~65 WPM Typing`
        });
        break;
      case 'backend':
        newHist.push({
          type: 'output',
          content: `⚙️ Backend & Systems Engineering:
• Node.js & Express RESTful APIs, Microservices, JWT Auth
• Laravel (PHP), Custom User Authentication, Granular Role Management
• Databases: MongoDB Aggregation Pipelines, MySQL Schema Design
• Infrastructure: Nginx Reverse Proxy, Linux Server Admin (Ubuntu/Debian)`
        });
        break;
      case 'ai':
        newHist.push({
          type: 'output',
          content: `🤖 AI & Automation Capabilities:
• Advanced LLM Prompt Engineering & Autonomous Agent Architectures
• MCP (Model Context Protocol) Server Tool Integrations
• Automated Workflow Orchestration & AI-Assisted Full-Stack Coding`
        });
        break;
      case 'experience':
        newHist.push({
          type: 'output',
          content: `⏳ Work Experience:
Computer Programmer @ Himachal Pradesh University (2018 - Present)
• System Analysis & Design for recruitment, admissions, registration, migration, fee payment, and hostel management modules.
• Collaborated with ERP developers to refine modules, creating smoothness & UI enhancements.
• Developed Student Helpdesk Ticketing System (3 Lakh+ students), ERP Knowledge Base & YouTube tutorials.`
        });
        break;
      case 'projects':
        newHist.push({
          type: 'output',
          content: `🚀 Featured Systems Built:
1. ScholarSync Research Platform & ScholarTrack Attendance Engine
2. HPU Student Helpdesk Ticketing System (WordPress & Laravel/MySQL for 3 Lakh+ students)
3. ERP Knowledge Base & Video Tutorial Series
4. AI Agent & MCP Tool Automation Pipelines
5. ERP Project Management Tool`
        });
        break;
      case 'contact':
        newHist.push({
          type: 'output',
          content: `📞 Contact Information:
Phone: +91 7018010410
Email: ayushsood965@gmail.com / ayush_94@live.com
Address: 2nd floor, Dinesh Niwas, Dhainda, Shimla 171005`
        });
        break;
      case 'clear':
        setTermHistory([]);
        setTermInput('');
        return;
      default:
        newHist.push({
          type: 'output',
          content: `Command not recognized: "${cmdStr}". Type "help" for valid commands.`
        });
        break;
    }

    setTermHistory(newHist);
    setTermInput('');
  };

  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
    }
  }, [termHistory]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSentStatus(true);
    setTimeout(() => {
      setSentStatus(false);
      setShowContactModal(false);
      setContactMsg({ name: '', email: '', message: '' });
    }, 2000);
  };

  return (
    <div className="dev-profile-container">
      {/* 60 FPS Particle Canvas & Cursor Spotlight */}
      <ParticleCanvas />
      <MouseSpotlight />

      {/* Background Lighting Blobs */}
      <div className="dev-glow-blob dev-blob-1"></div>
      <div className="dev-glow-blob dev-blob-2"></div>
      <div className="dev-glow-blob dev-blob-3"></div>

      {/* Sticky Header Navigation */}
      <nav className="dev-nav">
        <Link to="/" className="dev-nav-brand">
          <div className="dev-brand-badge">AS</div>
          <div>
            <span style={{ display: 'block', lineHeight: 1.1 }}>Ayush Sood</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Creative Full-Stack & AI Architect
            </span>
          </div>
        </Link>

        <div className="dev-nav-links">
          <a href="#orbit" className="dev-nav-link">Constellation</a>
          <a href="#capabilities" className="dev-nav-link">Stack & AI</a>
          <a href="#projects" className="dev-nav-link">Systems</a>
          <a href="#experience" className="dev-nav-link">Career</a>
          <a href="#terminal" className="dev-nav-link">Terminal</a>
        </div>

        <div className="dev-nav-actions">
          <MagneticButton onClick={toggleTheme} className="dev-btn-secondary" style={{ padding: '8px 12px', borderRadius: '50%' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </MagneticButton>
          <MagneticButton onClick={() => navigate('/')} className="dev-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Back to Hub
          </MagneticButton>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="dev-hero-section">
        <div className="dev-hero-grid">
          {/* Avatar Profile Card with 3D Tilt */}
          <TiltCard className="dev-avatar-card">
            <div className="dev-avatar-frame">
              <div className="dev-avatar-ring"></div>
              <div className="dev-avatar-img-inner">
                AS
              </div>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              <ScrambleText text="Ayush Sood" />
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '8px' }}>
              Programmer
            </p>

            <div className="dev-floating-tech-pills">
              <span className="dev-tech-pill">React 19</span>
              <span className="dev-tech-pill">Node.js</span>
              <span className="dev-tech-pill">Laravel</span>
              <span className="dev-tech-pill">AI / MCP</span>
              <span className="dev-tech-pill">Lenis Smooth</span>
            </div>

            <div className="dev-status-badge">
              <div className="dev-pulse-dot"></div>
              Himachal Pradesh University
            </div>
          </TiltCard>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="dev-hero-content"
          >
            <h1 className="dev-hero-title">
              Ayush Sood
            </h1>
            <p className="dev-hero-description">
              Dedicated Software Architect and Computer Programmer with over 7 years of high-impact engineering experience at Himachal Pradesh University (HPU). Master of modern creative frontend design systems (React, Vite, Lenis Smooth Scroll, Framer Motion, Glassmorphism), scalable backend infrastructures (Node.js, Express, Laravel, MongoDB, MySQL), and cutting-edge AI integrations including <strong>Prompt Engineering, AI Automation Workflows, and MCP Server Architectures</strong>.
            </p>

            {/* Stats Ribbon */}
            <div className="dev-stats-grid">
              <div className="dev-stat-card">
                <div className="dev-stat-number">7+</div>
                <div className="dev-stat-label">Years Experience</div>
              </div>
              <div className="dev-stat-card">
                <div className="dev-stat-number">3 Lakh+</div>
                <div className="dev-stat-label">Students Served</div>
              </div>
              <div className="dev-stat-card">
                <div className="dev-stat-number">100%</div>
                <div className="dev-stat-label">Full-Stack Mastery</div>
              </div>
              <div className="dev-stat-card">
                <div className="dev-stat-number">AI & MCP</div>
                <div className="dev-stat-label">Automation Skills</div>
              </div>
            </div>

            {/* Magnetic CTA Group */}
            <div className="dev-cta-group">
              <MagneticButton onClick={() => { document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }); }} className="dev-btn-primary">
                <Layers size={18} /> Explore Featured Systems
              </MagneticButton>
              <MagneticButton onClick={() => { document.getElementById('orbit')?.scrollIntoView({ behavior: 'smooth' }); }} className="dev-btn-secondary">
                <Cpu size={18} /> Interactive Tech Constellation
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* INTERACTIVE ORBITAL SKILLS & TECH WALL SHOWCASE */}
      <section id="orbit" className="dev-section">
        <div className="dev-section-header">
          <div className="dev-section-subtitle">
            <Sparkles size={14} /> Interactive Skill Orbit & Tech Wall
          </div>
          <h2 className="dev-section-title">Technology Constellation</h2>
        </div>

        <OrbitalSkills />
      </section>

      {/* FULL-STACK & AI CAPABILITIES SHOWCASE */}
      <section id="capabilities" className="dev-section">
        <div className="dev-section-header">
          <div className="dev-section-subtitle">
            <Sparkles size={14} /> Comprehensive Engineering Matrix
          </div>
          <h2 className="dev-section-title">Frontend, Backend & AI Mastery</h2>
        </div>

        <div className="dev-capabilities-grid">
          {/* Card 1: Frontend Excellence */}
          <TiltCard className="dev-cap-card">
            <div className="dev-cap-header">
              <div className="dev-cap-icon-box fe">
                <Layout size={26} />
              </div>
              <div className="dev-cap-title">Frontend Engineering</div>
            </div>
            <ul className="dev-cap-bullets">
              <li><strong>Modern React & Vite</strong>: Advanced component state, custom hooks, context providers, SPA routing.</li>
              <li><strong>Creative Animations & Smooth Scroll</strong>: Lenis Smooth Scroll physics, Framer Motion, keyframes, 60 FPS micro-interactions.</li>
              <li><strong>Glassmorphism & Vanilla CSS</strong>: Custom design tokens, glass backdrop-blur, responsive dark/light systems.</li>
              <li><strong>Speed & Documentation</strong>: ~65 WPM typing speed for ultra-fast development and technical writing.</li>
            </ul>
          </TiltCard>

          {/* Card 2: Backend & System Architecture */}
          <TiltCard className="dev-cap-card">
            <div className="dev-cap-header">
              <div className="dev-cap-icon-box be">
                <Server size={26} />
              </div>
              <div className="dev-cap-title">Backend & System Design</div>
            </div>
            <ul className="dev-cap-bullets">
              <li><strong>Node.js & Express</strong>: Scalable RESTful microservices, JWT authentication, RBAC authorization logic.</li>
              <li><strong>PHP & Laravel Framework</strong>: Custom authentication engines, role management, dynamic PDF report engines.</li>
              <li><strong>High-Performance Data Layer</strong>: MongoDB aggregation pipelines, indexed MySQL relational schemas.</li>
              <li><strong>ERP Refinement</strong>: Collaborated with ERP developers to streamline registration, migration, and fee payment systems.</li>
            </ul>
          </TiltCard>

          {/* Card 3: AI & MCP Automation */}
          <TiltCard className="dev-cap-card">
            <div className="dev-cap-header">
              <div className="dev-cap-icon-box ai">
                <Bot size={26} />
              </div>
              <div className="dev-cap-title">AI & MCP Automation</div>
            </div>
            <ul className="dev-cap-bullets">
              <li><strong>Prompt Engineering & LLMs</strong>: Expert prompt design, contextual instruction tuning, structured outputs.</li>
              <li><strong>MCP (Model Context Protocol)</strong>: Custom MCP server creation, multi-tool orchestration, agent integration.</li>
              <li><strong>Autonomous Agent Workflows</strong>: AI-driven task scheduling, automated code synthesis, smart refactoring.</li>
              <li><strong>AI-Assisted Full-Stack Coding</strong>: Leveraging AI agents to accelerate university software delivery.</li>
            </ul>
          </TiltCard>
        </div>
      </section>

      {/* FEATURED PROJECTS SHOWCASE */}
      <section id="projects" className="dev-section">
        <div className="dev-section-header">
          <div className="dev-section-subtitle">
            <Code size={14} /> Mission-Critical Software
          </div>
          <h2 className="dev-section-title">Featured Systems & Projects</h2>
        </div>

        {/* Filter Buttons */}
        <div className="dev-project-filters">
          <button
            className={`dev-filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All Systems ({projectsData.length})
          </button>
          <button
            className={`dev-filter-btn ${activeFilter === 'ECOSYSTEM' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ECOSYSTEM')}
          >
            ScholarHub Ecosystem
          </button>
          <button
            className={`dev-filter-btn ${activeFilter === 'HELPDESK' ? 'active' : ''}`}
            onClick={() => setActiveFilter('HELPDESK')}
          >
            Student Helpdesk & Support
          </button>
          <button
            className={`dev-filter-btn ${activeFilter === 'AI' ? 'active' : ''}`}
            onClick={() => setActiveFilter('AI')}
          >
            AI & Automation
          </button>
          <button
            className={`dev-filter-btn ${activeFilter === 'KNOWLEDGE' ? 'active' : ''}`}
            onClick={() => setActiveFilter('KNOWLEDGE')}
          >
            ERP Knowledge Base
          </button>
        </div>

        {/* Projects Grid with AnimatePresence */}
        <motion.div layout className="dev-projects-grid">
          <AnimatePresence>
            {filteredProjects.map((proj) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35 }}
                key={proj.id}
              >
                <TiltCard className="dev-project-card">
                  <div>
                    <div className="dev-project-type">
                      {proj.icon}
                      {proj.type}
                    </div>
                    <h3 className="dev-project-name">{proj.name}</h3>
                    <p className="dev-project-desc">{proj.desc}</p>
                  </div>

                  <div>
                    <div className="dev-tech-tags">
                      {proj.tech.map((t, i) => (
                        <span key={i} className="dev-tech-tag">{t}</span>
                      ))}
                    </div>
                    <div className="dev-project-impact">
                      <span>Impact:</span>
                      <span>{proj.impact}</span>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* WORK EXPERIENCE SECTION */}
      <section id="experience" className="dev-section">
        <div className="dev-section-header">
          <div className="dev-section-subtitle">
            <Briefcase size={14} /> Career History
          </div>
          <h2 className="dev-section-title">Work Experience at HPU</h2>
        </div>

        <div className="dev-timeline-container">
          <div className="dev-timeline-item">
            <div className="dev-timeline-dot"></div>
            <TiltCard className="dev-timeline-content">
              <span className="dev-timeline-badge">2018 – PRESENT • COMPUTER PROGRAMMER</span>
              <h3 className="dev-timeline-role">Computer Programmer & System Analyst</h3>
              <div className="dev-timeline-org">
                <Building size={18} /> Himachal Pradesh University, Shimla
              </div>
              <ul className="dev-timeline-bullets">
                <li>Played a pivotal role in system analysis and design, actively contributing to the development of various university modules including <strong>recruitment, admissions, registration, migration, fee payment, and hostel management</strong>.</li>
                <li><strong>Collaborated with ERP developers</strong> to create smoothness in modules, refine user interfaces, and optimize system architecture for enhanced user experiences.</li>
                <li>Led decision-making efforts throughout the development lifecycle, ensuring technical solutions align with organizational goals.</li>
                <li>Individually developed a comprehensive <strong>knowledge base and helpdesk ticketing system using WordPress</strong>, providing efficient support solutions for the university community of over <strong>3 lakh students</strong>.</li>
                <li>Created an additional <strong>helpdesk ticketing system using Laravel and MySQL</strong>, featuring Custom User Authentication, Role Management, and report generation.</li>
                <li>Architected the <strong>ScholarSync</strong> research platform and <strong>ScholarTrack</strong> attendance lifecycle engine for doctoral scholars.</li>
                <li>Demonstrated proficiency in frontend technologies (HTML, CSS, JavaScript, Bootstrap, React, Framer Motion) by contributing to the UI/UX design of projects within the ERP.</li>
                <li>Initiated and maintained video tutorials for the helpdesk and knowledge base, fostering knowledge sharing and user empowerment.</li>
                <li>Achieved a typing speed of approximately <strong>65 words per minute</strong>, enhancing efficiency in documentation and communication.</li>
              </ul>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEVELOPER TERMINAL */}
      <section id="terminal" className="dev-section">
        <div className="dev-section-header">
          <div className="dev-section-subtitle">
            <Terminal size={14} /> Interactive CLI
          </div>
          <h2 className="dev-section-title">Ayush Sood Dev Terminal</h2>
        </div>

        <div className="dev-terminal-wrapper">
          <div className="dev-terminal-header">
            <div className="dev-terminal-dots">
              <div className="dev-term-dot red"></div>
              <div className="dev-term-dot yellow"></div>
              <div className="dev-term-dot green"></div>
            </div>
            <div className="dev-terminal-title">ayushsood@hpu-systems-shell:~</div>
            <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>bash v3.0</div>
          </div>

          <div className="dev-terminal-body" ref={termBodyRef}>
            {termHistory.map((item, index) => (
              <div key={index} className="dev-term-line">
                {item.type === 'prompt' ? (
                  <span className="dev-term-prompt">{item.content}</span>
                ) : (
                  <div className="dev-term-output">{item.content}</div>
                )}
              </div>
            ))}


            <form onSubmit={(e) => { e.preventDefault(); if (termInput) handleTermCommand(termInput); }} className="dev-term-input-form">
              <span className="dev-term-prompt">ayush@hpu:~$</span>
              <input
                type="text"
                className="dev-term-input"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                placeholder="type a command e.g. help, bio, frontend, backend, ai, projects..."
              />
              <CornerDownLeft size={14} style={{ color: '#8b949e' }} />
            </form>

            <div className="dev-term-suggestions">
              <span style={{ fontSize: '0.75rem', color: '#8b949e', alignSelf: 'center' }}>Quick query:</span>
              {['bio', 'frontend', 'backend', 'ai', 'experience', 'projects', 'clear'].map((cmd) => (
                <button key={cmd} onClick={() => handleTermCommand(cmd)} className="dev-term-chip">
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION (NO REFERENCE BOX) */}
      <footer className="dev-footer">
        <div className="dev-footer-content">
          <div className="dev-brand-badge" style={{ margin: '0 auto' }}>AS</div>
          <h3 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
            Ayush Sood — Computer Programmer & Full-Stack Architect
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '650px', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Himachal Pradesh University, Summer Hill, Shimla 171005.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '14px' }}>
            <MagneticButton onClick={handleCopyEmail} className="dev-btn-primary" style={{ padding: '12px 26px', fontSize: '0.92rem' }}>
              {copiedEmail ? <Check size={18} style={{ color: '#fff' }} /> : <Copy size={18} />}
              {copiedEmail ? 'Email Copied!' : 'Copy Email (ayushsood965@gmail.com)'}
            </MagneticButton>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '26px', borderTop: '1px solid var(--color-border)', paddingTop: '24px', width: '100%' }}>
            © {new Date().getFullYear()} Ayush Sood. Computer Programmer, Himachal Pradesh University. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DeveloperProfile;
