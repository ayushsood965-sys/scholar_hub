import { useState, useEffect, useRef, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import { AuthContext } from './context/AuthContext';
import { motion } from 'framer-motion';
import Lenis from 'lenis';
import {
  BarChart3, Shield, Clock, CalendarRange, ArrowRight, ArrowUpRight,
  CheckCircle2, Users, UserCheck, BookOpen, ClipboardCheck, FileText,
  AlertTriangle, TrendingUp, Calendar, Settings, Layers, Activity,
  GraduationCap, Building, Eye, PieChart, Bell, Upload, GitBranch
} from 'lucide-react';
import { API_URL } from './config';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import {
  useLenisScroll,
  ParticleCanvas,
  MouseSpotlight,
  TiltCard,
  MagneticButton
} from './components/CreativeComponents';

// ─── Role-based feature data ───
const roleFeatures = {
  student: [
    { text: 'Real-Time Dashboard', desc: 'View cumulative attendance %, per-course breakdown, and weekly trend charts at a glance.', icon: Activity },
    { text: 'Safe Absence Calculator', desc: 'Know exactly how many classes you can still miss before falling below the 75% threshold.', icon: Shield },
    { text: 'Leave Applications', desc: 'Apply for Medical, Casual, Duty, or On-Duty leave with multi-tier approval tracking.', icon: CalendarRange },
    { text: 'Correction Appeals', desc: 'Challenge wrongly marked absences within a 7-day window. Attach supporting documents.', icon: FileText },
    { text: 'PhD Research Tracker', desc: 'Track months elapsed since DRC synopsis approval, 36-month residency progress, and thesis status.', icon: Clock },
    { text: 'Academic Standing', desc: 'Instant Good / Warning / Defaulter status indicator with actionable recovery guidance.', icon: AlertTriangle },
  ],
  faculty: [
    { text: 'Bulk Attendance Matrix', desc: 'Mark Present / Absent for an entire class in one go against mapped timetable slots.', icon: ClipboardCheck },
    { text: 'Course Statistics Cards', desc: 'Per-course overview: total students, present %, absent %, and low-attendance alerts.', icon: PieChart },
    { text: 'Defaulter Drill-Down', desc: 'Identify students below threshold per course and take proactive intervention measures.', icon: AlertTriangle },
    { text: 'Student-Subject Mapping', desc: 'Map and manage which students are enrolled in which courses for accurate tracking.', icon: Users },
    { text: 'Leave Recommendations', desc: 'Review student leave requests and forward recommendations to the HOD for final approval.', icon: CheckCircle2 },
    { text: 'Correction Reviews', desc: 'Approve or reject student attendance correction appeals with full audit trail.', icon: Eye },
  ],
  hod: [
    { text: 'Department KPIs', desc: 'At-a-glance metrics: total students, faculty, department attendance rate, pending approvals.', icon: TrendingUp },
    { text: 'Timetable Orchestration', desc: 'Create, edit, and clone timetable slots across semesters. Assign faculty to courses.', icon: Calendar },
    { text: 'Attendance Verification', desc: 'Second-pass verification of faculty-forwarded attendance before records become permanent.', icon: CheckCircle2 },
    { text: 'Leave Final Authority', desc: 'Approve or reject escalated leave applications. Full leave history and audit logs.', icon: Shield },
    { text: 'Defaulter Register', desc: 'Live list of all students below 75% with per-course drill-down analytics.', icon: AlertTriangle },
    { text: 'Department Audit Trail', desc: 'Complete chronological log of every attendance action in the department.', icon: Eye },
  ],
  admin: [
    { text: 'Master Data Management', desc: 'Manage departments, degree types, degree names, semesters, sessions, and semester-degree mappings.', icon: Settings },
    { text: 'Holiday Calendar', desc: 'Configure university holidays that auto-exclude from attendance calculations. Bulk seed support.', icon: Calendar },
    { text: 'Policy Configuration', desc: 'Set department-level attendance thresholds, condonation limits, and correction edit windows.', icon: Layers },
    { text: 'Leave Rules Engine', desc: 'Define leave types, maximum allowed days, carry-forward rules, and approval chains.', icon: FileText },
    { text: 'User Verification Pipeline', desc: 'Review and approve newly registered users before granting system access.', icon: UserCheck },
    { text: 'Faculty & HOD Master', desc: 'Register faculty accounts and assign HOD roles per department.', icon: Building },
  ],
};

// ─── Lifecycle steps ───
const lifecycleSteps = [
  { num: '01', title: 'Timetable Setup', desc: 'HOD creates course slots with faculty assignments, day/time schedules, and session configs.', icon: Calendar },
  { num: '02', title: 'Mark Attendance', desc: 'Faculty opens the attendance matrix and bulk-marks Present or Absent for each class.', icon: ClipboardCheck },
  { num: '03', title: 'Student Monitors', desc: 'Students track cumulative attendance, per-course stats, and academic standing in real-time.', icon: Activity },
  { num: '04', title: 'Leave & Corrections', desc: 'Students apply for leaves or file correction appeals. Documents can be uploaded as proof.', icon: FileText },
  { num: '05', title: 'HOD Verifies', desc: 'Faculty-forwarded records undergo HOD verification. Leave applications get final approval.', icon: CheckCircle2 },
  { num: '06', title: 'Compliance Audit', desc: 'System flags defaulters below 75% and generates department-wide compliance reports.', icon: Shield },
];

// ─── Policy highlights ───
const policyCards = [
  { title: '75% Minimum', desc: 'HPU mandates 75% cumulative attendance for exam eligibility. Auto-defaulter detection enforces this.', icon: TrendingUp, color: 'var(--status-present)' },
  { title: '7-Day Window', desc: 'Students can file correction appeals within 7 days of a wrongly marked absence entry.', icon: Clock, color: 'var(--status-late)' },
  { title: '2 Attempts Max', desc: 'Each class slot allows a maximum of 2 correction attempts. Choose wisely.', icon: AlertTriangle, color: 'var(--status-absent)' },
  { title: 'Multi-Tier Approval', desc: 'Leave chain: Student applies → Faculty recommends → HOD approves or rejects.', icon: GitBranch, color: 'var(--status-leave)' },
  { title: 'Dept. Isolation', desc: 'Each department sets its own thresholds, condonation limits, and edit windows independently.', icon: Building, color: 'var(--color-primary)' },
  { title: 'Holiday Exclusion', desc: 'University holidays are auto-excluded from attendance calculations. No manual intervention needed.', icon: Calendar, color: 'var(--color-success)' },
];

const Landing = () => {
  const [stats, setStats] = useState({ scholars: 500, guides: 45, departments: 12, awardedDegrees: 84 });
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState('student');
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const toastShown = useRef(null);
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize Lenis Smooth Scroll
  useLenisScroll(Lenis);

  useEffect(() => {
    if (!authLoading && user) {
      const dashMap = {
        SUPER_ADMIN: '/super-dashboard',
        HOD: '/hod-dashboard',
        ADMIN: '/hod-dashboard',
        FACULTY: '/faculty-dashboard',
        STUDENT: '/student-dashboard',
      };
      navigate(dashMap[user.role] ?? '/student-dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const toastMsg = searchParams.get('toast');
    if (toastMsg && toastShown.current !== toastMsg) {
      toastShown.current = toastMsg;
      toast.success(toastMsg);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    fetch(`${API_URL}/public/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setStats({
            scholars: data.scholars ?? 500,
            guides: data.guides ?? 45,
            departments: data.departments ?? 12,
            awardedDegrees: data.awardedDegrees ?? 84
          });
        }
      })
      .catch(err => console.error('Error fetching public stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const roles = ['student', 'faculty', 'hod', 'admin'];
  const roleLabels = { student: 'Student', faculty: 'Faculty', hod: 'HOD', admin: 'Admin' };

  if (authLoading) {
    return (
      <div className="premium-preloader-container" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <div className="premium-preloader-spinner" />
        <div className="premium-preloader-text">Authenticating session...</div>
      </div>
    );
  }

  return (
    <div className="st-landing" style={{ position: 'relative' }}>
      {/* 60 FPS Particle Canvas & Cursor Spotlight */}
      <ParticleCanvas />
      <MouseSpotlight />

      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1" />
        <div className="liquid-blob blob-2" />
        <div className="liquid-blob blob-3" />
      </div>

      <Navbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="st-hero" id="home">
        <motion.div
          className="st-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            className="st-hero-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Activity size={14} /> Unified Attendance & Leave Portal
          </motion.div>

          <h1 className="st-hero-title">
            Know Your <span>Attendance.</span><br />
            Control Your Academic Standing.
          </h1>
          <p className="st-hero-subtitle">
            ScholarTrack monitors daily attendance, automates multi-tier leave workflows, and enforces
            HPU's <strong>75% compliance threshold</strong> across every department — giving students,
            faculty, and administrators a single source of truth.
          </p>

          <div className="st-hero-buttons">
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <MagneticButton className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={16} />
              </MagneticButton>
            </Link>
            <a href="#features" style={{ textDecoration: 'none' }}>
              <MagneticButton className="btn btn-outline btn-lg">
                Explore Features
              </MagneticButton>
            </a>
          </div>
        </motion.div>

        {/* Hero Visual — Roster Preview */}
        <motion.div
          className="st-hero-visual"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <TiltCard className="st-roster-widget glass-panel">
            <div className="st-roster-header">
              <div className="st-roster-icon-box">
                <BarChart3 size={22} />
              </div>
              <div>
                <div className="st-roster-title">Roster Preview</div>
                <div className="st-roster-subtitle">Live Attendance Snapshot</div>
              </div>
              <span className="st-roster-live-dot" />
            </div>

            <div className="st-roster-grid">
              {[
                { label: 'Present Today', value: '93%', color: 'var(--status-present)' },
                { label: 'Absent Today', value: '4%', color: 'var(--status-absent)' },
                { label: 'Medical Leave', value: '2%', color: 'var(--status-leave)' },
                { label: 'Duty Leave', value: '1%', color: 'var(--color-primary)' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="st-roster-stat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="st-roster-stat-label">{stat.label}</div>
                  <div className="st-roster-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="st-roster-stat-bar" style={{ background: stat.color, width: stat.value }} />
                </motion.div>
              ))}
            </div>

            <div className="st-roster-footer">
              <span className="st-roster-footer-badge">Session 2026–27</span>
              <span className="st-roster-footer-text">Threshold: 75%</span>
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="st-section st-lifecycle-section" id="how-it-works">
        <motion.div
          className="st-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="st-section-badge">How It Works</span>
          <h2 className="st-section-title">The Attendance Lifecycle</h2>
          <p className="st-section-subtitle">
            From timetable creation to compliance reporting — six stages that run every academic day.
          </p>
        </motion.div>

        <div className="st-lifecycle-grid">
          {lifecycleSteps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <TiltCard className="st-lifecycle-card glass-panel">
                <div className="st-lifecycle-num">{step.num}</div>
                <div className="st-lifecycle-icon-box">
                  <step.icon size={22} />
                </div>
                <h4 className="st-lifecycle-card-title">{step.title}</h4>
                <p className="st-lifecycle-card-desc">{step.desc}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ ROLE-BASED FEATURES ═══════════════ */}
      <section className="st-section st-features-section" id="features">
        <motion.div
          className="st-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="st-section-badge">Features</span>
          <h2 className="st-section-title">Built for Every Role</h2>
          <p className="st-section-subtitle">
            Four purpose-built dashboards, each loaded with tools tailored to your responsibilities.
          </p>
        </motion.div>

        {/* Role Tabs */}
        <div className="st-role-tabs">
          {roles.map(role => (
            <button
              key={role}
              className={`st-role-tab ${activeRole === role ? 'active' : ''}`}
              onClick={() => setActiveRole(role)}
            >
              {roleLabels[role]}
            </button>
          ))}
        </div>

        {/* Feature Grid */}
        <motion.div
          className="st-features-grid"
          key={activeRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {roleFeatures[activeRole].map((feat, i) => (
            <TiltCard
              key={feat.text}
              className="st-feature-card clay-card"
            >
              <div className="st-feature-icon">
                <feat.icon size={22} />
              </div>
              <h4 className="st-feature-title">{feat.text}</h4>
              <p className="st-feature-desc">{feat.desc}</p>
            </TiltCard>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════ ATTENDANCE POLICY ═══════════════ */}
      <section className="st-section st-policy-section" id="policy">
        <motion.div
          className="st-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="st-section-badge">Compliance</span>
          <h2 className="st-section-title">Attendance Policy at a Glance</h2>
          <p className="st-section-subtitle">
            HPU's academic regulations, encoded and enforced digitally.
          </p>
        </motion.div>

        <div className="st-policy-grid">
          {policyCards.map((card, i) => (
            <TiltCard
              key={card.title}
              className="st-policy-card glass-panel"
            >
              <div className="st-policy-icon" style={{ color: card.color, background: `${card.color}15` }}>
                <card.icon size={20} />
              </div>
              <h4 className="st-policy-title">{card.title}</h4>
              <p className="st-policy-desc">{card.desc}</p>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ═══════════════ MOCK DASHBOARD PREVIEW ═══════════════ */}
      <section className="st-section st-preview-section" id="preview">
        <div className="st-preview-grid">
          <motion.div
            className="st-preview-text"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="st-section-badge">Dashboard Preview</span>
            <h2 className="st-section-title" style={{ textAlign: 'left' }}>See Your Attendance at a Glance</h2>
            <p className="st-section-subtitle" style={{ textAlign: 'left' }}>
              Every student gets a personalised dashboard with cumulative attendance, per-course breakdowns,
              safe-absence projections, and a real-time academic standing indicator.
            </p>
            <div className="st-preview-highlights">
              {[
                'Cumulative % with 75% compliance gauge',
                'Per-course attendance bars with status badges',
                'Weekly trend line chart',
                'Safe absences remaining calculator',
                'Leave status tracker with approval chain',
              ].map((text, i) => (
                <div key={i} className="st-preview-highlight-item">
                  <CheckCircle2 size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <Link to="/signup" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '24px' }}>
              <MagneticButton className="btn btn-primary">
                Create Your Profile <ArrowRight size={16} />
              </MagneticButton>
            </Link>
          </motion.div>

          {/* Mock Dashboard Widget */}
          <motion.div
            className="st-preview-widget-wrapper"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <TiltCard className="st-mock-dashboard glass-panel">
              <div className="st-mock-header">
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Attendance Overview</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Session 2026–27</div>
                </div>
                <span className="st-mock-status-badge met">Compliance Met</span>
              </div>

              {/* Gauge */}
              <div className="st-mock-gauge-row">
                <div className="st-mock-gauge">
                  <svg viewBox="0 0 80 80" width="80" height="80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-border)" strokeWidth="7" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="var(--color-primary)" strokeWidth="7"
                      strokeDasharray={`${0.78 * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                    <text x="40" y="37" textAnchor="middle" fill="var(--color-text-primary)" fontSize="16" fontWeight="800">78%</text>
                    <text x="40" y="50" textAnchor="middle" fill="var(--color-text-muted)" fontSize="7" fontWeight="700" textTransform="uppercase">CUMULATIVE</text>
                  </svg>
                </div>
                <div className="st-mock-gauge-info">
                  <div className="st-mock-gauge-threshold">
                    <Shield size={14} /> 75% Compliance Rule
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    You are <strong style={{ color: 'var(--color-primary)' }}>3% above</strong> the minimum threshold.
                  </div>
                </div>
              </div>

              {/* Per-course bars */}
              <div className="st-mock-courses">
                <div className="st-mock-courses-title">Per-Course Attendance</div>
                {[
                  { name: 'RM-901 (Research Methodology)', pct: 82, status: 'met' },
                  { name: 'AT-903 (Advanced Topic Analysis)', pct: 72, status: 'warning' },
                ].map(c => (
                  <div key={c.name} className="st-mock-course-row">
                    <div className="st-mock-course-info">
                      <strong>{c.name}</strong>
                    </div>
                    <span className={`st-mock-course-pct ${c.status}`}>{c.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Status vocabulary */}
              <div className="st-mock-vocab">
                <span className="st-vocab present">Present</span>
                <span className="st-vocab absent">Absent</span>
                <span className="st-vocab leave">Leave</span>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ LIVE STATISTICS ═══════════════ */}
      <section className="st-section st-stats-section" id="stats">
        <motion.div
          className="st-section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="st-section-badge">Platform Metrics</span>
          <h2 className="st-section-title">Live Portal Statistics</h2>
          <p className="st-section-subtitle">Real-time data from the ScholarHub shared database.</p>
        </motion.div>

        <div className="st-stats-grid">
          {[
            { num: stats.scholars, label: 'Registered Scholars' },
            { num: stats.departments, label: 'HPU Departments' },
            { num: stats.scholars, label: 'Unified Profiles' },
          ].map((s, i) => (
            <TiltCard
              key={s.label}
              className="st-stat-card clay-card"
            >
              {loading ? (
                <div className="st-stat-skeleton" />
              ) : (
                <div className="st-stat-num">{s.num}</div>
              )}
              <div className="st-stat-label">{s.label}</div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section className="st-section st-cta-section">
        <TiltCard
          className="st-cta-card glass-panel"
        >
          <h2 className="st-cta-title">Ready to take control of your attendance?</h2>
          <p className="st-cta-desc">
            Create your ScholarTrack profile today and start monitoring your academic compliance in real-time.
          </p>
          <div className="st-cta-buttons">
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <MagneticButton className="btn btn-primary btn-lg">
                Create Profile <ArrowRight size={16} />
              </MagneticButton>
            </Link>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <MagneticButton className="btn btn-outline btn-lg">
                Log In <ArrowUpRight size={16} />
              </MagneticButton>
            </Link>
          </div>
        </TiltCard>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
