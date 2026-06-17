import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════
 *  ANIMATED PRESENTATION — ScholarSync Portal Walkthrough
 *  For university authorities (non-technical audience)
 * ═══════════════════════════════════════════════════════════════ */

/* ── ACT 1: STUDENT JOURNEY ────────────────────────────────── */
const STUDENT_SCENES = [
  {
    id: 's1', phase: 'Registration',
    title: 'Step 1 — Student Creates Account',
    narrative: 'The scholar visits the ScholarSync portal and creates an account by entering their full name, email, phone number, department, and password. They select "Student / Scholar" as their role.',
    mockUI: 'signup',
    highlight: 'All dashboard features remain LOCKED at this stage.',
    icon: '📝', color: '#3b82f6',
  },
  {
    id: 's2', phase: 'Registration',
    title: 'Step 2 — Profile Completion & Thesis Registration',
    narrative: 'After logging in, the student sees the Profile Onboarding modal. They must fill in personal details (DOB, category, address), academic qualifications (Graduation, Post-Graduation with certificates), preferred research guide, specialization, and tentative thesis title with abstract.',
    mockUI: 'profile',
    highlight: 'Dashboard sidebar shows all tabs LOCKED 🔒 until verification.',
    icon: '📋', color: '#8b5cf6',
  },
  {
    id: 's3', phase: 'Registration',
    title: 'Step 3 — Submit for HOD Approval',
    narrative: 'The student clicks "Submit for HOD Approval" from the Overview tab. A notification is instantly sent to the Head of Department of their department: "⏳ New Scholar Profile Verification".',
    mockUI: 'submit_approval',
    highlight: 'Student enters a "Waiting Room" — all uploads remain disabled.',
    icon: '📤', color: '#f59e0b',
  },
  {
    id: 's4', phase: 'HOD Verification',
    title: 'Step 4 — HOD Reviews & Verifies Enrollment',
    narrative: 'The HOD receives the notification on their dashboard. They open the scholar\'s full profile — personal info, academic credentials, certificates, thesis details — and click "Verify Enrollment". The HOD also assigns a Faculty Supervisor to guide the scholar.',
    mockUI: 'hod_verify',
    highlight: 'Notification sent to student: "🎉 Enrollment Verified!" + "👨‍🏫 Supervisor Allocated"',
    icon: '✅', color: '#10b981',
  },
  {
    id: 's5', phase: 'Dashboard Unlocks',
    title: 'Step 5 — Student Dashboard Unfreezes',
    narrative: 'Once verified, the student\'s dashboard comes alive! The sidebar tabs progressively unlock based on the current milestone phase. The student can now see their full PhD Research Progression Timeline showing all 7 milestones from Registration to Degree Award.',
    mockUI: 'dashboard_unlock',
    highlight: 'Milestones unlock automatically as the scholar progresses through each phase.',
    icon: '🔓', color: '#06b6d4',
  },
  {
    id: 's6', phase: 'Coursework',
    title: 'Step 6 — Coursework Phase',
    narrative: 'The student completes mandatory doctoral coursework (offline exams and classes). The supervisor or HOD clears the coursework on the portal. The system automatically creates the SYNOPSIS milestone.',
    mockUI: 'coursework',
    highlight: 'Tabs unlocked: My Thesis, Milestones. Notification: "📚 Coursework Cleared!"',
    icon: '📚', color: '#8b5cf6',
  },
  {
    id: 's7', phase: 'Synopsis & DRC',
    title: 'Step 7 — Synopsis Submission & DRC Approval',
    narrative: 'Student uploads the synopsis document + plagiarism report. The supervisor reviews it — approves or requests revision. Once approved, the HOD schedules a DRC (Departmental Research Committee) meeting with date, time, venue. The DRC panel evaluates and approves the synopsis.',
    mockUI: 'synopsis',
    highlight: 'On DRC approval → Status moves to ACTIVE RESEARCH. 6-Month Report #1 auto-created.',
    icon: '📝', color: '#06b6d4',
  },
  {
    id: 's8', phase: 'Active Research',
    title: 'Step 8 — Active Research & RAC Reviews',
    narrative: 'The core research phase lasting 3+ years. Every 6 months, a progress report milestone is auto-generated. The student uploads reports, the supervisor reviews. Students also submit research publications (journals, conferences, Intellectual Property Rights (IPRs)). The HOD conducts periodic RAC (Research Advisory Committee) reviews.',
    mockUI: 'active_research',
    highlight: 'Tabs unlocked: RAC Progress, 6-Month Reports, Research Outputs, Meetings, Documents, Changes.',
    icon: '🔬', color: '#10b981',
  },
  {
    id: 's9', phase: 'Pre-Submission',
    title: 'Step 9 — Pre-Submission Seminar & Final Submission',
    narrative: 'After 36+ months with all reports approved, 2 verified journals, and 2 verified conferences — the Pre-Submission milestone unlocks. Student uploads rough thesis draft. HOD schedules a pre-submission seminar defense. After clearance, the FINAL_SUBMISSION milestone is created. Student uploads final thesis, supervisor provides digital sign-off.',
    mockUI: 'pre_submission',
    highlight: 'Prerequisites enforced automatically: 2 Journals + 2 Conferences + All Reports.',
    icon: '📤', color: '#f97316',
  },
  {
    id: 's10', phase: 'Evaluation & Degree',
    title: 'Step 10 — Viva-Voce & Degree Award',
    narrative: 'HOD dispatches thesis to external examiners (logs date, method, tracking number). After favorable reports, the HOD schedules a Viva-Voce defense (date, time, venue, panel). The viva panel conducts the examination. HOD records the outcome — SUCCESSFUL or UNSUCCESSFUL. On success, the HOD awards the PhD degree.',
    mockUI: 'degree_award',
    highlight: '🎓 PhD Degree Awarded! Scholar\'s journey on ScholarSync is complete.',
    icon: '🎓', color: '#ef4444',
  },
];

/* ── ACT 2: HOD & FACULTY SIGNUP ───────────────────────────── */
const FACULTY_SCENES = [
  {
    id: 'f1',
    title: 'Faculty / HOD Creates Account',
    narrative: 'Faculty members and HODs visit the same signup page. They enter their name, email, phone, and select their department. They choose their role — either "Faculty / Supervisor" or "Head of Department (HOD)". Account is created instantly.',
    icon: '👨‍🏫', color: '#8b5cf6',
    mockUI: 'faculty_signup',
  },
  {
    id: 'f2',
    title: 'Account Verification by Super Admin / HOD',
    narrative: 'After signup, the faculty/HOD account is in an UNVERIFIED state. All dashboard tabs except "Profile" are locked (🔒). The department HOD or Super Admin reviews the account and marks it as "Verified". Only verified accounts can access system features.',
    icon: '🔐', color: '#f59e0b',
    mockUI: 'faculty_locked',
  },
  {
    id: 'f3',
    title: 'Dashboard Activates After Verification',
    narrative: 'Once verified, the faculty/HOD dashboard fully activates. All sidebar navigation items unlock — My Scholars, Pending Reviews, Guidance Meetings, Reports, Search, Public Portal Config, and more. The system sends a welcome notification.',
    icon: '✅', color: '#10b981',
    mockUI: 'faculty_active',
  },
];

/* ── ACT 3: DASHBOARD CAPABILITIES ────────────────────────── */
const FACULTY_DASHBOARD_FEATURES = [
  { icon: '🏠', title: 'Dashboard Overview', desc: 'At-a-glance view of all assigned scholars, their current phase, pending reviews, upcoming deadlines, and departmental statistics.', color: '#3b82f6' },
  { icon: '👥', title: 'My Scholars / Department Scholars', desc: 'Complete list of all scholars under supervision (Faculty) or in the department (HOD). Click any scholar to open their full 360° profile — personal info, qualifications, thesis details, milestones, publications.', color: '#8b5cf6' },
  { icon: '📝', title: 'Pending Reviews', desc: 'Queue of all submissions awaiting review — synopsis documents, progress reports, chapter drafts, pre-submission packages. Faculty can approve, request revision, or provide detailed feedback with remarks.', color: '#f59e0b' },
  { icon: '📊', title: 'Detailed Reports & Analytics', desc: 'Generate comprehensive reports — scholar progress summaries, department-wide status distribution, milestone completion rates, publication counts, defaulter lists, and exportable PDF/Excel reports.', color: '#10b981' },
  { icon: '🔍', title: 'Scholar Search', desc: 'Advanced search across all scholars by name, enrollment number, department, status, supervisor, thesis title, or date range. Filter and sort results for quick access.', color: '#06b6d4' },
  { icon: '📅', title: 'Guidance Meetings', desc: 'Manage guidance meeting requests from scholars. HOD approves/rejects meeting requests. All invited faculty and attendees receive notifications with date, time, and venue.', color: '#f97316' },
  { icon: '⚠️', title: 'Defaulter Scholars', desc: 'Identify scholars who have missed deadlines, have overdue progress reports, or are behind schedule. Take corrective action with automated alerts.', color: '#ef4444' },
  { icon: '🔄', title: 'Change Requests (HOD)', desc: 'Review and approve/reject scholar requests for thesis title changes or guide changes. On approval, the system auto-updates records and notifies all parties.', color: '#eab308' },
];

const HOD_EXCLUSIVE_FEATURES = [
  { icon: '✅', title: 'Registration Verification', desc: 'Review and verify new scholar registrations. View complete profiles with academic credentials and certificates. Assign faculty supervisors.' },
  { icon: '📋', title: 'DRC Scheduling & Results', desc: 'Schedule DRC meetings (date, time, venue, panel). Record DRC outcomes — Approved, Revision Required, or Reschedule. Also supports recording offline DRC outcomes.' },
  { icon: '🏛️', title: 'RAC Session Management', desc: 'Schedule and manage periodic RAC (Research Advisory Committee) evaluation sessions. Record outcomes as Satisfactory or Unsatisfactory.' },
  { icon: '📤', title: 'Pre-Submission Seminar', desc: 'Schedule seminar defense. Clear or revise pre-submission packages. System enforces publication prerequisites (2 Journals + 2 Conferences).' },
  { icon: '📬', title: 'Thesis Dispatch & Viva', desc: 'Log dispatch to external examiners. Schedule Viva-Voce (date, time, venue, panel). Record viva outcome. Award PhD degree.' },
  { icon: '🔀', title: 'Scholar Transfer', desc: 'Transfer supervision of any scholar to another verified faculty within the department. System notifies all parties automatically.' },
  { icon: '⚡', title: 'Force Advancement', desc: 'In exceptional cases, HOD can force-advance a scholar\'s thesis status to the next phase, bypassing normal prerequisites.' },
];

/* ── ACT 4: PUBLIC PORTAL VISION ───────────────────────────── */
const PUBLIC_PORTAL_POINTS = [
  { icon: '🌐', title: 'University Research Directory', desc: 'All active doctoral research projects are listed publicly — thesis title, abstract, scholar name, supervisor, department, and current status. Visible to the world without login.', color: '#3b82f6' },
  { icon: '🤝', title: 'Cross-Department Collaboration', desc: 'Researchers from different departments can discover overlapping research areas, find potential collaborators, and initiate joint projects.', color: '#8b5cf6' },
  { icon: '📈', title: 'University Research Dashboard', desc: 'Real-time analytics of the university\'s overall research output — total scholars, active researchers, publications count, department-wise distribution, completion rates.', color: '#10b981' },
  { icon: '🏛️', title: 'Departmental Research Labs', desc: 'Each department\'s research labs, areas of expertise, and ongoing projects are showcased publicly. Attracts external funding and partnerships.', color: '#06b6d4' },
  { icon: '📄', title: 'Publication Archive', desc: 'A searchable repository of all verified publications — journals, conferences, Intellectual Property Rights (IPRs) — linked to scholars and supervisors. Builds the university\'s academic reputation.', color: '#f97316' },
  { icon: '🔔', title: 'Research Events & Seminars', desc: 'Upcoming DRC meetings, RAC sessions, pre-submission seminars, and viva defenses can be listed publicly for transparency and institutional accountability.', color: '#ef4444' },
  { icon: '💰', title: 'Funding & Grants Portal', desc: 'Centralized hub for research funding opportunities, grant applications, and sponsored project management.', color: '#eab308' },
  { icon: '🔒', title: 'Proper Monitoring & Compliance', desc: 'Authorities can monitor all ongoing research in real-time — track defaulters, ensure timely progress, enforce publication requirements, and maintain UGC/regulatory compliance.', color: '#a855f7' },
];


/* ═══════════════════════════════════════════════════════════════
 *  PARTICLE BACKGROUND
 * ═══════════════════════════════════════════════════════════════ */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5, dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${p.opacity})`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x, dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.05 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
};

/* ═══════════════════════════════════════════════════════════════
 *  MOCK UI ILLUSTRATIONS (animated SVG-like components)
 * ═══════════════════════════════════════════════════════════════ */

const MockSidebar = ({ items, frozenAll = false, activeIndex = 0, unlocking = false }) => (
  <div className="pres-mock-sidebar">
    <div className="pres-mock-sidebar-logo">
      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981' }}>📚 ScholarHub</div>
    </div>
    {items.map((item, i) => {
      const isFrozen = frozenAll || (item.frozen && !unlocking);
      const isActive = i === activeIndex && !isFrozen;
      return (
        <div key={i}
          className={`pres-mock-nav-item ${isActive ? 'pres-mock-nav-active' : ''} ${isFrozen ? 'pres-mock-nav-frozen' : ''}`}
          style={{ animationDelay: unlocking ? `${i * 0.12}s` : '0s' }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
          {isFrozen && <span className="pres-mock-lock">🔒</span>}
          {unlocking && !item.frozen && <span className="pres-mock-unlock-badge">✓</span>}
        </div>
      );
    })}
  </div>
);

const MockDashboardFrame = ({ title, children, statusBadge, notification }) => (
  <div className="pres-mock-dashboard">
    <div className="pres-mock-header">
      <div className="pres-mock-header-title">{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {notification && (
          <div className="pres-mock-notification-ping">
            <span>🔔</span>
            <span className="pres-mock-notif-dot" />
          </div>
        )}
        {statusBadge && <div className="pres-mock-status-badge" style={{ background: statusBadge.bg, color: statusBadge.color }}>{statusBadge.text}</div>}
        <div className="pres-mock-avatar" />
      </div>
    </div>
    <div className="pres-mock-body">{children}</div>
  </div>
);

const MockMilestoneTimeline = ({ activeStep = 0, total = 7 }) => {
  const phases = ['Registration', 'Coursework', 'Synopsis', 'Active Research', 'Pre-Submission', 'Thesis Submitted', 'Degree Awarded'];
  return (
    <div className="pres-mock-timeline">
      <div className="pres-mock-timeline-track">
        <div className="pres-mock-timeline-fill" style={{ width: `${(activeStep / (total - 1)) * 100}%` }} />
      </div>
      {phases.map((p, i) => (
        <div key={i} className={`pres-mock-timeline-node ${i < activeStep ? 'pres-mock-tl-done' : i === activeStep ? 'pres-mock-tl-active' : 'pres-mock-tl-pending'}`}>
          <div className="pres-mock-tl-circle">
            {i < activeStep ? '✓' : i + 1}
          </div>
          <div className="pres-mock-tl-label">{p}</div>
        </div>
      ))}
    </div>
  );
};

const MockNotificationToast = ({ title, message, type = 'success' }) => (
  <div className={`pres-mock-toast pres-mock-toast-${type}`}>
    <div className="pres-mock-toast-icon">
      {type === 'success' ? '✅' : type === 'pending' ? '⏳' : type === 'info' ? 'ℹ️' : '🔔'}
    </div>
    <div>
      <div className="pres-mock-toast-title">{title}</div>
      <div className="pres-mock-toast-msg">{message}</div>
    </div>
  </div>
);

/* Scene-specific mock UIs */
const SceneMockUI = ({ mockUI, isActive }) => {
  const sidebarItems = [
    { icon: '🏠', label: 'Dashboard', frozen: false },
    { icon: '👤', label: 'Profile', frozen: false },
    { icon: '📖', label: 'My Thesis', frozen: true },
    { icon: '🏁', label: 'Milestones', frozen: true },
    { icon: '📊', label: 'RAC Progress', frozen: true },
    { icon: '📅', label: '6-Month Reports', frozen: true },
    { icon: '📄', label: 'Chapter Drafts', frozen: true },
    { icon: '🏆', label: 'Research Outputs', frozen: true },
    { icon: '📤', label: 'Pre-Submission', frozen: true },
    { icon: '📅', label: 'Meetings', frozen: true },
    { icon: '📂', label: 'Documents', frozen: true },
    { icon: '✏️', label: 'Request Changes', frozen: true },
    { icon: '🎖️', label: 'Certificates', frozen: true },
  ];

  const unlockedSidebar = sidebarItems.map(item => ({ ...item, frozen: false }));

  switch (mockUI) {
    case 'signup':
      return (
        <div className="pres-mock-scene">
          <div className="pres-mock-signup-form">
            <div className="pres-mock-form-header">Join ScholarSync</div>
            <div className="pres-mock-form-field"><span>Full Name</span><div className="pres-mock-input">Rahul Sharma</div></div>
            <div className="pres-mock-form-field"><span>Email</span><div className="pres-mock-input">rahul@hpuniv.ac.in</div></div>
            <div className="pres-mock-form-field"><span>Phone</span><div className="pres-mock-input">9876543210</div></div>
            <div className="pres-mock-form-field"><span>Department</span><div className="pres-mock-input">Department of Computer Science</div></div>
            <div className="pres-mock-form-field"><span>Role</span><div className="pres-mock-input pres-mock-input-highlight">Student / Scholar</div></div>
            <div className="pres-mock-btn">Create Account →</div>
          </div>
        </div>
      );

    case 'profile':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <MockSidebar items={sidebarItems} frozenAll={false} activeIndex={1} />
          <MockDashboardFrame title="Profile Completion" statusBadge={{ text: 'PENDING VERIFICATION', bg: '#FEF3C7', color: '#D97706' }}>
            <div className="pres-mock-profile-sections">
              <div className="pres-mock-profile-card">
                <div className="pres-mock-card-title">📋 General Info</div>
                <div className="pres-mock-mini-fields">
                  <span>DOB: 15/03/1998</span><span>Gender: Male</span><span>Category: General</span>
                </div>
              </div>
              <div className="pres-mock-profile-card">
                <div className="pres-mock-card-title">🎓 Qualifications</div>
                <div className="pres-mock-mini-fields">
                  <span>PG: M.Sc. CS — 78%</span><span>UG: B.Sc. — 82%</span>
                </div>
              </div>
              <div className="pres-mock-profile-card">
                <div className="pres-mock-card-title">📝 Thesis Details</div>
                <div className="pres-mock-mini-fields">
                  <span>Title: AI in Healthcare</span><span>Guide Preference: Dr. Mehta</span>
                </div>
              </div>
            </div>
          </MockDashboardFrame>
        </div>
      );

    case 'submit_approval':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <MockSidebar items={sidebarItems} activeIndex={0} />
          <MockDashboardFrame title="Dashboard — Overview" statusBadge={{ text: 'REGISTRATION PENDING', bg: '#FEF3C7', color: '#D97706' }}>
            <div className="pres-mock-waiting-room">
              <div className="pres-mock-waiting-icon">⏳</div>
              <div className="pres-mock-waiting-title">Awaiting Admin Verification</div>
              <div className="pres-mock-waiting-text">Your registration has been submitted. All uploads are locked until verification is complete.</div>
              <div className="pres-mock-submit-btn-glow">Submit for HOD Approval ✓</div>
            </div>
            <MockNotificationToast title="⏳ New Scholar Profile Verification" message="Notification sent to HOD of Computer Science dept." type="pending" />
          </MockDashboardFrame>
        </div>
      );

    case 'hod_verify':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <div className="pres-mock-sidebar" style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}>
            <div className="pres-mock-sidebar-logo" style={{ color: '#34d399' }}>🏛️ HOD Panel</div>
            {['Dashboard', 'Registrations ⚡', 'Dept Scholars', 'Meetings', 'Reports'].map((l, i) => (
              <div key={i} className={`pres-mock-nav-item ${i === 1 ? 'pres-mock-nav-active' : ''}`}>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <MockDashboardFrame title="Registration Requests" notification statusBadge={{ text: 'HOD VIEW', bg: '#D1FAE5', color: '#065F46' }}>
            <div className="pres-mock-scholar-card-review">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>🎓 Rahul Sharma</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Dept. of Computer Science | Enr: 2024-CS-001</div>
                </div>
                <div style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>AWAITING</div>
              </div>
              <div className="pres-mock-verify-actions">
                <div className="pres-mock-action-btn pres-mock-action-assign">👨‍🏫 Assign Supervisor ▸ Dr. Mehta</div>
                <div className="pres-mock-action-btn pres-mock-action-verify">✅ Verify Enrollment</div>
              </div>
            </div>
            <MockNotificationToast title="🎉 Enrollment Verified!" message="Sent to Rahul Sharma" type="success" />
          </MockDashboardFrame>
        </div>
      );

    case 'dashboard_unlock':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <MockSidebar items={[
            { icon: '🏠', label: 'Dashboard', frozen: false },
            { icon: '👤', label: 'Profile', frozen: false },
            { icon: '📖', label: 'My Thesis', frozen: false },
            { icon: '🏁', label: 'Milestones', frozen: false },
            { icon: '📊', label: 'RAC Progress', frozen: true },
            { icon: '📅', label: '6-Month Reports', frozen: true },
            { icon: '📄', label: 'Chapter Drafts', frozen: true },
            { icon: '🏆', label: 'Research Outputs', frozen: true },
            { icon: '📤', label: 'Pre-Submission', frozen: true },
            { icon: '📅', label: 'Meetings', frozen: true },
            { icon: '📂', label: 'Documents', frozen: true },
          ]} activeIndex={0} unlocking />
          <MockDashboardFrame title="Dashboard — Overview" statusBadge={{ text: 'COURSEWORK', bg: '#DBEAFE', color: '#1D4ED8' }}>
            <MockMilestoneTimeline activeStep={1} />
            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
              🔓 Thesis & Milestones tabs now accessible!
            </div>
          </MockDashboardFrame>
        </div>
      );

    case 'coursework':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <MockSidebar items={sidebarItems.map((s, i) => ({ ...s, frozen: i > 3 }))} activeIndex={0} />
          <MockDashboardFrame title="Dashboard — Coursework Phase" statusBadge={{ text: 'COURSEWORK', bg: '#DBEAFE', color: '#1D4ED8' }}>
            <MockMilestoneTimeline activeStep={1} />
            <div className="pres-mock-coursework-info">
              <div style={{ fontSize: '2rem', textAlign: 'center' }}>📚</div>
              <div style={{ fontWeight: 800, color: '#1e3a5f', textAlign: 'center' }}>Coursework Phase Active</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>Attend offline classes. Supervisor will clear when complete.</div>
            </div>
            <MockNotificationToast title="📚 Coursework Cleared!" message="Synopsis milestone auto-created" type="success" />
          </MockDashboardFrame>
        </div>
      );

    case 'synopsis':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <MockSidebar items={sidebarItems.map((s, i) => ({ ...s, frozen: i > 3 }))} activeIndex={3} />
          <MockDashboardFrame title="Synopsis & DRC Approval" statusBadge={{ text: 'SYNOPSIS PENDING', bg: '#EDE9FE', color: '#7C3AED' }}>
            <MockMilestoneTimeline activeStep={2} />
            <div className="pres-mock-synopsis-flow">
              {['📝 Upload Synopsis', '👨‍🏫 Supervisor Review', '📅 DRC Scheduled', '✅ DRC Approved'].map((s, i) => (
                <div key={i} className="pres-mock-sub-step" style={{ animationDelay: `${i * 0.3}s` }}>
                  <div className={`pres-mock-sub-dot ${i < 3 ? 'pres-mock-sub-done' : 'pres-mock-sub-active'}`} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </MockDashboardFrame>
        </div>
      );

    case 'active_research':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <MockSidebar items={unlockedSidebar.slice(0, 11)} activeIndex={4} />
          <MockDashboardFrame title="Active Research Phase" statusBadge={{ text: 'ACTIVE RESEARCH', bg: '#D1FAE5', color: '#059669' }}>
            <MockMilestoneTimeline activeStep={3} />
            <div className="pres-mock-research-grid">
              <div className="pres-mock-research-card"><span>📊</span><span>6-Month Reports</span><span className="pres-mock-count">4/6</span></div>
              <div className="pres-mock-research-card"><span>📄</span><span>Publications</span><span className="pres-mock-count">3</span></div>
              <div className="pres-mock-research-card"><span>🏛️</span><span>RAC Reviews</span><span className="pres-mock-count">2</span></div>
              <div className="pres-mock-research-card"><span>📅</span><span>Meetings</span><span className="pres-mock-count">5</span></div>
            </div>
          </MockDashboardFrame>
        </div>
      );

    case 'pre_submission':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <MockSidebar items={unlockedSidebar.slice(0, 11)} activeIndex={8} />
          <MockDashboardFrame title="Pre-Submission & Final Thesis" statusBadge={{ text: 'PRE-SUBMISSION', bg: '#FFE8D6', color: '#EA580C' }}>
            <MockMilestoneTimeline activeStep={4} />
            <div className="pres-mock-prereqs">
              <div className="pres-mock-prereq-title">Prerequisites Check</div>
              <div className="pres-mock-prereq-item pres-mock-prereq-pass">✅ 2 Verified Journals</div>
              <div className="pres-mock-prereq-item pres-mock-prereq-pass">✅ 2 Verified Conferences</div>
              <div className="pres-mock-prereq-item pres-mock-prereq-pass">✅ 36+ Months Completed</div>
              <div className="pres-mock-prereq-item pres-mock-prereq-pass">✅ All Reports Approved</div>
            </div>
          </MockDashboardFrame>
        </div>
      );

    case 'degree_award':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <MockSidebar items={unlockedSidebar.slice(0, 11)} activeIndex={0} />
          <MockDashboardFrame title="🎓 Degree Awarded!" statusBadge={{ text: 'AWARDED', bg: '#ECFDF5', color: '#10B981' }}>
            <MockMilestoneTimeline activeStep={6} total={7} />
            <div className="pres-mock-degree-celebration">
              <div className="pres-mock-degree-icon">🎓</div>
              <div className="pres-mock-degree-text">PhD Degree Officially Awarded!</div>
              <div className="pres-mock-degree-sub">Congratulations, Dr. Rahul Sharma</div>
              <div className="pres-mock-confetti-container">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="pres-mock-confetti" style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    background: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6],
                  }} />
                ))}
              </div>
            </div>
          </MockDashboardFrame>
        </div>
      );

    case 'faculty_signup':
      return (
        <div className="pres-mock-scene">
          <div className="pres-mock-signup-form">
            <div className="pres-mock-form-header">Join ScholarSync — Faculty</div>
            <div className="pres-mock-form-field"><span>Full Name</span><div className="pres-mock-input">Dr. Priya Mehta</div></div>
            <div className="pres-mock-form-field"><span>Email</span><div className="pres-mock-input">priya.mehta@hpuniv.ac.in</div></div>
            <div className="pres-mock-form-field"><span>Department</span><div className="pres-mock-input">Department of Computer Science</div></div>
            <div className="pres-mock-form-field"><span>Role</span><div className="pres-mock-input pres-mock-input-highlight" style={{ background: '#EDE9FE', color: '#7C3AED' }}>Faculty / Supervisor</div></div>
            <div className="pres-mock-btn" style={{ background: '#7C3AED' }}>Create Faculty Account →</div>
          </div>
        </div>
      );

    case 'faculty_locked':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <div className="pres-mock-sidebar" style={{ background: 'linear-gradient(135deg, #312e81, #3730a3)' }}>
            <div className="pres-mock-sidebar-logo" style={{ color: '#a78bfa' }}>👨‍🏫 Faculty Panel</div>
            {['Profile', 'My Scholars 🔒', 'Pending Reviews 🔒', 'Meetings 🔒', 'Reports 🔒', 'Search 🔒'].map((l, i) => (
              <div key={i} className={`pres-mock-nav-item ${i === 0 ? 'pres-mock-nav-active' : 'pres-mock-nav-frozen'}`}>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <MockDashboardFrame title="Account Not Verified" statusBadge={{ text: 'UNVERIFIED', bg: '#FEF2F2', color: '#DC2626' }}>
            <div className="pres-mock-waiting-room">
              <div className="pres-mock-waiting-icon" style={{ fontSize: '3rem' }}>🔐</div>
              <div className="pres-mock-waiting-title" style={{ color: '#DC2626' }}>Account Pending Verification</div>
              <div className="pres-mock-waiting-text">Your account must be verified by the department HOD or Super Admin before you can access any features. Only your Profile tab is accessible.</div>
            </div>
          </MockDashboardFrame>
        </div>
      );

    case 'faculty_active':
      return (
        <div className="pres-mock-scene pres-mock-scene-split">
          <div className="pres-mock-sidebar" style={{ background: 'linear-gradient(135deg, #312e81, #3730a3)' }}>
            <div className="pres-mock-sidebar-logo" style={{ color: '#a78bfa' }}>👨‍🏫 Faculty Panel</div>
            {['Dashboard ✓', 'Profile ✓', 'My Scholars ✓', 'Reviews ✓', 'Meetings ✓', 'Defaulters ✓', 'Search ✓', 'Reports ✓', 'Portal Config ✓'].map((l, i) => (
              <div key={i} className={`pres-mock-nav-item`} style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animation: `presFadeSlide 0.4s forwards ${i * 0.1}s` }}>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <MockDashboardFrame title="Faculty Dashboard — Active" statusBadge={{ text: 'VERIFIED ✅', bg: '#D1FAE5', color: '#059669' }}>
            <div className="pres-mock-research-grid">
              <div className="pres-mock-research-card"><span>👥</span><span>My Scholars</span><span className="pres-mock-count">8</span></div>
              <div className="pres-mock-research-card"><span>📝</span><span>Pending Reviews</span><span className="pres-mock-count">3</span></div>
              <div className="pres-mock-research-card"><span>📅</span><span>Meetings</span><span className="pres-mock-count">2</span></div>
              <div className="pres-mock-research-card"><span>📊</span><span>Reports</span><span className="pres-mock-count">∞</span></div>
            </div>
            <MockNotificationToast title="🎉 Welcome to ScholarSync!" message="Your account has been verified. All features are now active." type="success" />
          </MockDashboardFrame>
        </div>
      );

    default:
      return null;
  }
};


/* ═══════════════════════════════════════════════════════════════
 *  ACT SECTION COMPONENTS
 * ═══════════════════════════════════════════════════════════════ */

const ActHeader = ({ number, title, subtitle, color, icon }) => (
  <div className="pres-act-header" style={{ '--act-color': color }}>
    <div className="pres-act-number">ACT {number}</div>
    <div className="pres-act-icon">{icon}</div>
    <h2 className="pres-act-title">{title}</h2>
    <p className="pres-act-subtitle">{subtitle}</p>
  </div>
);

const ScenePlayer = ({ scenes, actColor }) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((idx) => {
    setCurrentScene(Math.max(0, Math.min(idx, scenes.length - 1)));
  }, [scenes.length]);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        if (currentScene < scenes.length - 1) {
          setCurrentScene(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 6000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentScene, scenes.length]);

  const scene = scenes[currentScene];

  return (
    <div className="pres-scene-player">
      {/* Progress bar */}
      <div className="pres-scene-progress">
        {scenes.map((s, i) => (
          <button
            key={i}
            className={`pres-progress-dot ${i === currentScene ? 'pres-progress-active' : i < currentScene ? 'pres-progress-done' : ''}`}
            style={{ '--dot-color': s.color || actColor }}
            onClick={() => { pause(); goTo(i); }}
            title={s.title}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="pres-scene-controls">
        <button className="pres-ctrl-btn" onClick={() => { pause(); goTo(currentScene - 1); }} disabled={currentScene === 0}>◀ Prev</button>
        <button className="pres-ctrl-btn pres-ctrl-play" onClick={isPlaying ? pause : play}>
          {isPlaying ? '⏸ Pause' : '▶ Auto-Play'}
        </button>
        <span className="pres-scene-counter">{currentScene + 1} / {scenes.length}</span>
        <button className="pres-ctrl-btn" onClick={() => { pause(); goTo(currentScene + 1); }} disabled={currentScene === scenes.length - 1}>Next ▶</button>
      </div>

      {/* Scene content */}
      <div className="pres-scene-card" key={scene.id} style={{ '--scene-color': scene.color || actColor }}>
        {scene.phase && <div className="pres-scene-phase">{scene.phase}</div>}
        <div className="pres-scene-title-row">
          <span className="pres-scene-icon">{scene.icon}</span>
          <h3 className="pres-scene-title">{scene.title}</h3>
        </div>
        <p className="pres-scene-narrative">{scene.narrative}</p>

        {/* Mock UI */}
        {scene.mockUI && (
          <div className="pres-scene-mock-container">
            <SceneMockUI mockUI={scene.mockUI} isActive />
          </div>
        )}

        {scene.highlight && (
          <div className="pres-scene-highlight" style={{ borderColor: scene.color || actColor }}>
            <span className="pres-highlight-icon">💡</span>
            <span>{scene.highlight}</span>
          </div>
        )}
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════
 *  FEATURE GRID COMPONENT
 * ═══════════════════════════════════════════════════════════════ */
const FeatureGrid = ({ features, columns = 2 }) => {
  const [visibleCards, setVisibleCards] = useState([]);
  const gridRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        features.forEach((_, i) => {
          setTimeout(() => setVisibleCards(prev => [...prev, i]), i * 120);
        });
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    if (gridRef.current) obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, [features]);

  return (
    <div ref={gridRef} className="pres-feature-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {features.map((f, i) => (
        <div key={i} className={`pres-feature-card ${visibleCards.includes(i) ? 'pres-feature-visible' : ''}`} style={{ '--feat-color': f.color || '#3b82f6' }}>
          <div className="pres-feature-icon">{f.icon}</div>
          <div className="pres-feature-info">
            <h4 className="pres-feature-title">{f.title}</h4>
            <p className="pres-feature-desc">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════
 *  SCROLL OBSERVER
 * ═══════════════════════════════════════════════════════════════ */
const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, isVisible];
};


/* ═══════════════════════════════════════════════════════════════
 *  MAIN PRESENTATION PAGE
 * ═══════════════════════════════════════════════════════════════ */
const WorkflowPage = () => {
  const navigate = useNavigate();
  const [heroRef, heroVis] = useInView(0.1);
  const [act1Ref, act1Vis] = useInView(0.05);
  const [act2Ref, act2Vis] = useInView(0.05);
  const [act3Ref, act3Vis] = useInView(0.05);
  const [act4Ref, act4Vis] = useInView(0.05);

  return (
    <div className="pres-page">
      <ParticleCanvas />

      {/* Floating nav */}
      <nav className="pres-nav">
        <button className="pres-nav-back" onClick={() => navigate('/')}>← Back to Portal</button>
        <span className="pres-nav-title">ScholarSync — System Walkthrough</span>
        <div className="pres-nav-links">
          <a href="#act-1">Student Journey</a>
          <a href="#act-2">Faculty Signup</a>
          <a href="#act-3">Dashboards</a>
          <a href="#act-4">Public Portal</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className={`pres-hero ${heroVis ? 'pres-visible' : ''}`}>
        <div className="pres-hero-badge">🎯 Presentation Mode</div>
        <h1 className="pres-hero-title">
          <span className="pres-hero-gradient">ScholarSync</span>
          <br />PhD Lifecycle Management Portal
        </h1>
        <p className="pres-hero-subtitle">
          An animated walkthrough of the complete doctoral research journey — from student registration
          to PhD degree award — designed for university authorities and decision makers.
        </p>
        <div className="pres-hero-stats">
          <div className="pres-stat"><span className="pres-stat-num">4</span><span className="pres-stat-label">Acts</span></div>
          <div className="pres-stat"><span className="pres-stat-num">10</span><span className="pres-stat-label">Student Steps</span></div>
          <div className="pres-stat"><span className="pres-stat-num">5</span><span className="pres-stat-label">Roles</span></div>
          <div className="pres-stat"><span className="pres-stat-num">22+</span><span className="pres-stat-label">Auto Notifications</span></div>
        </div>
        <div className="pres-hero-toc">
          <div className="pres-toc-title">Presentation Outline</div>
          <div className="pres-toc-items">
            <a href="#act-1" className="pres-toc-item" style={{ '--toc-color': '#3b82f6' }}>
              <span className="pres-toc-num">01</span>
              <span>Student Journey — Registration to Degree Award</span>
            </a>
            <a href="#act-2" className="pres-toc-item" style={{ '--toc-color': '#8b5cf6' }}>
              <span className="pres-toc-num">02</span>
              <span>HOD & Faculty — Signup & Account Activation</span>
            </a>
            <a href="#act-3" className="pres-toc-item" style={{ '--toc-color': '#10b981' }}>
              <span className="pres-toc-num">03</span>
              <span>Faculty & HOD Dashboard Capabilities</span>
            </a>
            <a href="#act-4" className="pres-toc-item" style={{ '--toc-color': '#f97316' }}>
              <span className="pres-toc-num">04</span>
              <span>Public Portal — Collaborative Research Environment</span>
            </a>
          </div>
        </div>
        <div className="pres-scroll-cue">
          <span>Scroll to begin presentation</span>
          <div className="pres-scroll-arrow">↓</div>
        </div>
      </section>

      {/* ── ACT 1: STUDENT JOURNEY ── */}
      <section id="act-1" ref={act1Ref} className={`pres-act ${act1Vis ? 'pres-visible' : ''}`}>
        <ActHeader number="I" title="The Scholar's Journey" subtitle="How a PhD candidate progresses through the entire doctoral lifecycle — from registration to degree award — with animated dashboard demonstrations." color="#3b82f6" icon="🎓" />
        <ScenePlayer scenes={STUDENT_SCENES} actColor="#3b82f6" />
      </section>

      {/* ── ACT 2: FACULTY SIGNUP ── */}
      <section id="act-2" ref={act2Ref} className={`pres-act ${act2Vis ? 'pres-visible' : ''}`}>
        <ActHeader number="II" title="Faculty & HOD Onboarding" subtitle="How faculty members and heads of department create accounts, get verified, and gain access to the system." color="#8b5cf6" icon="👨‍🏫" />
        <ScenePlayer scenes={FACULTY_SCENES} actColor="#8b5cf6" />
      </section>

      {/* ── ACT 3: DASHBOARD CAPABILITIES ── */}
      <section id="act-3" ref={act3Ref} className={`pres-act ${act3Vis ? 'pres-visible' : ''}`}>
        <ActHeader number="III" title="Dashboard Capabilities" subtitle="What faculty and HOD can do from their dashboard — reviews, reports, search, analytics, and administrative controls." color="#10b981" icon="📊" />

        <div className="pres-capabilities-section">
          <div className="pres-cap-header">
            <div className="pres-cap-badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>👨‍🏫 Faculty + HOD — Shared Features</div>
          </div>
          <FeatureGrid features={FACULTY_DASHBOARD_FEATURES} columns={2} />
        </div>

        <div className="pres-capabilities-section" style={{ marginTop: '48px' }}>
          <div className="pres-cap-header">
            <div className="pres-cap-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>🏛️ HOD-Exclusive Powers</div>
            <p className="pres-cap-desc">These capabilities are available only to the Head of Department role, enabling full lifecycle control and administrative authority.</p>
          </div>
          <FeatureGrid features={HOD_EXCLUSIVE_FEATURES.map(f => ({ ...f, color: '#10b981' }))} columns={2} />
        </div>
      </section>

      {/* ── ACT 4: PUBLIC PORTAL ── */}
      <section id="act-4" ref={act4Ref} className={`pres-act ${act4Vis ? 'pres-visible' : ''}`}>
        <ActHeader number="IV" title="Public Portal & Research Ecosystem" subtitle="How the public-facing portal transforms the university into a collaborative, transparent, and well-monitored research environment." color="#f97316" icon="🌐" />

        <div className="pres-portal-vision">
          <div className="pres-portal-vision-header">
            <h3 className="pres-portal-vision-title">The Vision: A University-Wide Research Hub</h3>
            <p className="pres-portal-vision-desc">
              ScholarSync's public portal configuration turns every department's research into a visible, searchable, and collaborative ecosystem. University authorities gain real-time oversight of all ongoing doctoral research, publications, and scholar progress — without needing to log in.
            </p>
          </div>
          <FeatureGrid features={PUBLIC_PORTAL_POINTS} columns={2} />

          {/* Summary visual */}
          <div className="pres-portal-summary">
            <div className="pres-portal-summary-card">
              <div className="pres-portal-summary-icon">🔄</div>
              <div className="pres-portal-summary-title">Complete Research Lifecycle</div>
              <div className="pres-portal-summary-text">From registration to degree award, every step is tracked, documented, and transparent.</div>
            </div>
            <div className="pres-portal-summary-card">
              <div className="pres-portal-summary-icon">👁️</div>
              <div className="pres-portal-summary-title">Real-Time Monitoring</div>
              <div className="pres-portal-summary-text">Authorities can see department-wise statistics, defaulter alerts, and progress metrics in real-time.</div>
            </div>
            <div className="pres-portal-summary-card">
              <div className="pres-portal-summary-icon">🤝</div>
              <div className="pres-portal-summary-title">Collaborative Environment</div>
              <div className="pres-portal-summary-text">Cross-department research discovery, publication sharing, and collaborative opportunities.</div>
            </div>
            <div className="pres-portal-summary-card">
              <div className="pres-portal-summary-icon">📋</div>
              <div className="pres-portal-summary-title">Regulatory Compliance</div>
              <div className="pres-portal-summary-text">Built-in compliance with UGC guidelines — publication requirements, timeline enforcement, and audit trails.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pres-footer">
        <div className="pres-footer-logo">📚 ScholarSync</div>
        <p>PhD Lifecycle Management Portal — Complete System Walkthrough</p>
        <p style={{ opacity: 0.4, fontSize: '0.75rem', marginTop: 8 }}>Himachal Pradesh University, Shimla</p>
      </footer>

      <style>{presentationCSS}</style>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════
 *  STYLES
 * ═══════════════════════════════════════════════════════════════ */
const presentationCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* ── PAGE ── */
.pres-page {
  background: #07080c;
  color: #e2e8f0;
  font-family: 'Inter', -apple-system, sans-serif;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* ── NAV ── */
.pres-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; gap: 16px;
  padding: 12px 28px;
  background: rgba(7, 8, 12, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.pres-nav-back {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; border-radius: 10px; padding: 8px 18px; cursor: pointer;
  font-size: 0.8rem; font-weight: 600; transition: all 0.2s;
}
.pres-nav-back:hover { background: rgba(255,255,255,0.12); color: #fff; }
.pres-nav-title { font-size: 0.85rem; font-weight: 700; color: #64748b; letter-spacing: 0.5px; }
.pres-nav-links {
  margin-left: auto; display: flex; gap: 6px;
}
.pres-nav-links a {
  color: #64748b; text-decoration: none; font-size: 0.72rem; font-weight: 600;
  padding: 6px 14px; border-radius: 8px; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06); transition: all 0.2s;
}
.pres-nav-links a:hover { color: #34d399; border-color: rgba(52,211,153,0.3); background: rgba(52,211,153,0.06); }

/* ── HERO ── */
.pres-hero {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; padding: 120px 24px 60px; position: relative; z-index: 1;
  opacity: 0; transform: translateY(40px); transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}
.pres-hero.pres-visible { opacity: 1; transform: translateY(0); }
.pres-hero-badge {
  font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 4px;
  color: #f59e0b; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
  padding: 8px 24px; border-radius: 100px; margin-bottom: 28px;
}
.pres-hero-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 900; line-height: 1.1; margin-bottom: 24px;
  color: #ffffff; letter-spacing: -2px;
}
.pres-hero-gradient {
  background: linear-gradient(135deg, #34d399 0%, #3b82f6 50%, #a855f7 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.pres-hero-subtitle {
  max-width: 640px; font-size: 1.05rem; color: #94a3b8; line-height: 1.7; font-weight: 400; margin-bottom: 40px;
}
.pres-hero-stats {
  display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; margin-bottom: 48px;
}
.pres-stat {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 18px 24px; min-width: 90px; transition: all 0.3s;
}
.pres-stat:hover { background: rgba(255,255,255,0.08); transform: translateY(-4px); border-color: rgba(52,211,153,0.3); }
.pres-stat-num { font-size: 1.8rem; font-weight: 900; color: #34d399; }
.pres-stat-label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }

/* Table of contents */
.pres-hero-toc {
  max-width: 500px; width: 100%; margin-bottom: 40px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;
}
.pres-toc-title { font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
.pres-toc-items { display: flex; flex-direction: column; gap: 8px; }
.pres-toc-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 10px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  text-decoration: none; color: #cbd5e1; font-size: 0.85rem; font-weight: 500; transition: all 0.3s;
}
.pres-toc-item:hover { background: rgba(255,255,255,0.06); border-color: var(--toc-color); transform: translateX(6px); }
.pres-toc-num { font-size: 0.7rem; font-weight: 900; color: var(--toc-color); min-width: 24px; }

.pres-scroll-cue {
  position: absolute; bottom: 40px; display: flex; flex-direction: column; align-items: center; gap: 6px;
  color: #475569; font-size: 0.75rem; font-weight: 600; letter-spacing: 1px;
}
.pres-scroll-arrow { animation: presBounce 2s infinite; font-size: 1.2rem; }
@keyframes presBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }

/* ── ACT SECTIONS ── */
.pres-act {
  padding: 100px 24px 80px; max-width: 1100px; margin: 0 auto; position: relative; z-index: 1;
  opacity: 0; transform: translateY(50px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.pres-act.pres-visible { opacity: 1; transform: translateY(0); }

.pres-act-header { text-align: center; margin-bottom: 48px; }
.pres-act-number {
  font-size: 0.7rem; font-weight: 900; color: var(--act-color); letter-spacing: 6px;
  text-transform: uppercase; margin-bottom: 12px;
}
.pres-act-icon { font-size: 3rem; margin-bottom: 16px; }
.pres-act-title { font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 900; color: #fff; letter-spacing: -1px; margin-bottom: 12px; }
.pres-act-subtitle { font-size: 1rem; color: #64748b; max-width: 650px; margin: 0 auto; line-height: 1.7; }

/* ── SCENE PLAYER ── */
.pres-scene-player { margin: 0 auto; max-width: 960px; }
.pres-scene-progress {
  display: flex; gap: 6px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap;
}
.pres-progress-dot {
  width: 32px; height: 6px; border-radius: 3px; border: none; cursor: pointer;
  background: rgba(255,255,255,0.1); transition: all 0.3s;
}
.pres-progress-dot:hover { background: rgba(255,255,255,0.25); }
.pres-progress-done { background: var(--dot-color); opacity: 0.4; }
.pres-progress-active { background: var(--dot-color); opacity: 1; width: 48px; box-shadow: 0 0 12px var(--dot-color); }

.pres-scene-controls {
  display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px;
}
.pres-ctrl-btn {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; border-radius: 10px; padding: 8px 18px; cursor: pointer;
  font-size: 0.78rem; font-weight: 700; transition: all 0.2s;
}
.pres-ctrl-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #fff; }
.pres-ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pres-ctrl-play { background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.3); color: #34d399; }
.pres-ctrl-play:hover { background: rgba(52,211,153,0.2); }
.pres-scene-counter { font-size: 0.75rem; font-weight: 800; color: #475569; min-width: 50px; text-align: center; }

.pres-scene-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px; padding: 32px; animation: presFadeIn 0.5s ease-out;
  border-left: 4px solid var(--scene-color);
}
@keyframes presFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

.pres-scene-phase {
  font-size: 0.65rem; font-weight: 800; color: var(--scene-color); text-transform: uppercase;
  letter-spacing: 3px; margin-bottom: 8px;
}
.pres-scene-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.pres-scene-icon { font-size: 1.8rem; }
.pres-scene-title { font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0; }
.pres-scene-narrative { font-size: 0.9rem; color: #94a3b8; line-height: 1.8; margin-bottom: 20px; }

.pres-scene-mock-container {
  margin: 20px 0; border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.3);
}

.pres-scene-highlight {
  display: flex; align-items: flex-start; gap: 10px; padding: 14px 18px;
  background: rgba(255,255,255,0.03); border-radius: 12px;
  border: 1px solid; font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; font-weight: 600;
}
.pres-highlight-icon { font-size: 1.1rem; flex-shrink: 0; }

/* ── MOCK UI STYLES ── */
.pres-mock-scene { display: flex; justify-content: center; padding: 16px; }
.pres-mock-scene-split { display: flex; gap: 0; align-items: stretch; }

.pres-mock-sidebar {
  width: 180px; background: linear-gradient(135deg, #0c1425, #0f172a);
  padding: 16px 8px; display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.06);
}
.pres-mock-sidebar-logo { padding: 8px 10px 14px; font-size: 0.85rem; font-weight: 900; color: #34d399; text-align: center; }
.pres-mock-nav-item {
  display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 8px;
  font-size: 0.68rem; color: #94a3b8; font-weight: 500; transition: all 0.2s;
  white-space: nowrap; overflow: hidden;
}
.pres-mock-nav-active { background: rgba(52,211,153,0.12); color: #34d399; font-weight: 700; }
.pres-mock-nav-frozen { opacity: 0.35; }
.pres-mock-lock { margin-left: auto; font-size: 0.6rem; }
.pres-mock-unlock-badge { margin-left: auto; font-size: 0.6rem; color: #10b981; font-weight: 900; animation: presPop 0.4s ease-out; }
@keyframes presPop { from { transform: scale(0); } to { transform: scale(1); } }

.pres-mock-dashboard { flex: 1; display: flex; flex-direction: column; background: #0e1422; min-height: 300px; }
.pres-mock-header {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);
}
.pres-mock-header-title { font-size: 0.82rem; font-weight: 800; color: #e2e8f0; }
.pres-mock-status-badge {
  font-size: 0.58rem; font-weight: 800; padding: 4px 10px; border-radius: 6px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.pres-mock-notification-ping { position: relative; }
.pres-mock-notif-dot {
  position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%;
  background: #ef4444; animation: presPulse 1.5s infinite;
}
@keyframes presPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.pres-mock-avatar { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); }
.pres-mock-body { flex: 1; padding: 16px; overflow-y: auto; }

/* Timeline */
.pres-mock-timeline { position: relative; display: flex; justify-content: space-between; padding: 0 8px 16px; margin-bottom: 12px; }
.pres-mock-timeline-track {
  position: absolute; top: 14px; left: 8%; right: 8%; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px;
}
.pres-mock-timeline-fill {
  height: 100%; border-radius: 2px; background: linear-gradient(90deg, #10b981, #3b82f6);
  transition: width 0.6s ease;
}
.pres-mock-timeline-node { display: flex; flex-direction: column; align-items: center; z-index: 2; flex: 1; min-width: 0; }
.pres-mock-tl-circle {
  width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; font-weight: 900; margin-bottom: 6px; transition: all 0.3s;
}
.pres-mock-tl-done .pres-mock-tl-circle { background: #10b981; color: #fff; }
.pres-mock-tl-active .pres-mock-tl-circle { background: #3b82f6; color: #fff; box-shadow: 0 0 12px rgba(59,130,246,0.5); }
.pres-mock-tl-pending .pres-mock-tl-circle { background: rgba(255,255,255,0.06); color: #475569; border: 1.5px solid rgba(255,255,255,0.1); }
.pres-mock-tl-label { font-size: 0.52rem; font-weight: 700; color: #64748b; text-align: center; max-width: 60px; line-height: 1.2; }
.pres-mock-tl-active .pres-mock-tl-label { color: #3b82f6; }

/* Toast */
.pres-mock-toast {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px;
  margin-top: 12px; font-size: 0.72rem; animation: presSlideUp 0.5s ease-out;
}
@keyframes presSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.pres-mock-toast-success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
.pres-mock-toast-pending { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); }
.pres-mock-toast-info { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); }
.pres-mock-toast-icon { font-size: 1.2rem; }
.pres-mock-toast-title { font-weight: 800; color: #e2e8f0; margin-bottom: 2px; }
.pres-mock-toast-msg { color: #94a3b8; font-size: 0.68rem; }

/* Signup form mock */
.pres-mock-signup-form {
  width: 320px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 24px; margin: 16px auto;
}
.pres-mock-form-header { font-size: 1.1rem; font-weight: 900; color: #fff; text-align: center; margin-bottom: 18px; }
.pres-mock-form-field { margin-bottom: 10px; }
.pres-mock-form-field span { font-size: 0.65rem; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.pres-mock-input {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
  padding: 8px 12px; font-size: 0.78rem; color: #cbd5e1; font-weight: 500;
}
.pres-mock-input-highlight { background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.3); color: #34d399; font-weight: 700; }
.pres-mock-btn {
  background: #3b82f6; color: #fff; border-radius: 10px; padding: 10px; text-align: center;
  font-size: 0.82rem; font-weight: 800; margin-top: 16px; cursor: default;
  animation: presBtnPulse 2s infinite;
}
@keyframes presBtnPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); } 50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); } }

/* Profile sections */
.pres-mock-profile-sections { display: flex; flex-direction: column; gap: 10px; }
.pres-mock-profile-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 12px;
}
.pres-mock-card-title { font-size: 0.72rem; font-weight: 800; color: #cbd5e1; margin-bottom: 8px; }
.pres-mock-mini-fields { display: flex; flex-wrap: wrap; gap: 6px; }
.pres-mock-mini-fields span {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px; padding: 4px 8px; font-size: 0.65rem; color: #94a3b8;
}

/* Waiting room */
.pres-mock-waiting-room { text-align: center; padding: 20px 0; }
.pres-mock-waiting-icon { font-size: 2.5rem; margin-bottom: 8px; animation: presFloat 3s ease-in-out infinite; }
@keyframes presFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.pres-mock-waiting-title { font-size: 0.95rem; font-weight: 800; color: #f59e0b; margin-bottom: 8px; }
.pres-mock-waiting-text { font-size: 0.75rem; color: #94a3b8; max-width: 400px; margin: 0 auto; line-height: 1.6; }

.pres-mock-submit-btn-glow {
  display: inline-block; margin-top: 16px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
  color: #34d399; font-weight: 800; font-size: 0.78rem; padding: 10px 24px; border-radius: 10px;
  animation: presGlowBtn 2s infinite;
}
@keyframes presGlowBtn { 0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); } 50% { box-shadow: 0 0 0 10px rgba(52,211,153,0); } }

/* Scholar card review */
.pres-mock-scholar-card-review {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 16px; margin-bottom: 12px;
}
.pres-mock-verify-actions { display: flex; gap: 8px; }
.pres-mock-action-btn {
  flex: 1; padding: 8px 12px; border-radius: 8px; font-size: 0.72rem; font-weight: 700; text-align: center;
}
.pres-mock-action-assign { background: rgba(139,92,246,0.1); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2); }
.pres-mock-action-verify { background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2); animation: presGlowBtn 2s infinite; }

/* Research grid */
.pres-mock-research-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.pres-mock-research-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.pres-mock-research-card span:first-child { font-size: 1.3rem; }
.pres-mock-research-card span:nth-child(2) { font-size: 0.68rem; color: #94a3b8; font-weight: 600; }
.pres-mock-count { font-size: 1.1rem !important; font-weight: 900; color: #34d399 !important; }

/* Synopsis flow */
.pres-mock-synopsis-flow { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.pres-mock-sub-step {
  display: flex; align-items: center; gap: 10px; font-size: 0.75rem; color: #cbd5e1; font-weight: 600;
  opacity: 0; animation: presFadeSlide 0.4s forwards;
}
@keyframes presFadeSlide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
.pres-mock-sub-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.15);
}
.pres-mock-sub-done { background: #10b981; border-color: #10b981; }
.pres-mock-sub-active { background: #3b82f6; border-color: #3b82f6; animation: presPulse 1.5s infinite; }

/* Coursework info */
.pres-mock-coursework-info {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 20px; margin-top: 12px;
}

/* Prerequisites */
.pres-mock-prereqs {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 16px; margin-top: 12px;
}
.pres-mock-prereq-title { font-size: 0.75rem; font-weight: 800; color: #f97316; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
.pres-mock-prereq-item { font-size: 0.78rem; padding: 6px 0; color: #cbd5e1; font-weight: 600; }
.pres-mock-prereq-pass { color: #34d399; }

/* Degree celebration */
.pres-mock-degree-celebration { text-align: center; padding: 16px 0; position: relative; overflow: hidden; }
.pres-mock-degree-icon { font-size: 3.5rem; animation: presFloat 2s ease-in-out infinite; }
.pres-mock-degree-text { font-size: 1.1rem; font-weight: 900; color: #10b981; margin: 8px 0 4px; }
.pres-mock-degree-sub { font-size: 0.82rem; color: #94a3b8; font-weight: 600; }

.pres-mock-confetti-container { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.pres-mock-confetti {
  position: absolute; width: 6px; height: 6px; border-radius: 1px; top: -10px;
  animation: presConfetti 3s linear infinite;
}
@keyframes presConfetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(350px) rotate(720deg); opacity: 0; }
}

/* ── FEATURE GRID ── */
.pres-feature-grid { display: grid; gap: 16px; }
.pres-feature-card {
  display: flex; gap: 16px; padding: 20px; border-radius: 14px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
  opacity: 0; transform: translateY(20px); transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.pres-feature-card.pres-feature-visible { opacity: 1; transform: translateY(0); }
.pres-feature-card:hover { border-color: var(--feat-color); transform: translateY(-3px); box-shadow: 0 8px 24px color-mix(in srgb, var(--feat-color) 8%, transparent); }
.pres-feature-icon { font-size: 1.8rem; flex-shrink: 0; }
.pres-feature-title { font-size: 0.9rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
.pres-feature-desc { font-size: 0.78rem; color: #94a3b8; line-height: 1.6; margin: 0; }

/* ── CAPABILITIES ── */
.pres-capabilities-section { margin-top: 8px; }
.pres-cap-header { margin-bottom: 24px; }
.pres-cap-badge {
  display: inline-block; font-size: 0.78rem; font-weight: 800; padding: 8px 20px; border-radius: 10px;
  margin-bottom: 8px;
}
.pres-cap-desc { font-size: 0.85rem; color: #64748b; max-width: 600px; line-height: 1.6; }

/* ── PUBLIC PORTAL ── */
.pres-portal-vision { margin-top: 8px; }
.pres-portal-vision-header { text-align: center; margin-bottom: 40px; }
.pres-portal-vision-title { font-size: 1.4rem; font-weight: 900; color: #fff; margin-bottom: 12px; }
.pres-portal-vision-desc { font-size: 0.92rem; color: #94a3b8; max-width: 600px; margin: 0 auto; line-height: 1.7; }

.pres-portal-summary {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 40px;
}
.pres-portal-summary-card {
  text-align: center; padding: 24px 16px; border-radius: 16px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.4s;
}
.pres-portal-summary-card:hover { transform: translateY(-6px); border-color: rgba(52,211,153,0.3); }
.pres-portal-summary-icon { font-size: 2rem; margin-bottom: 12px; }
.pres-portal-summary-title { font-size: 0.82rem; font-weight: 800; color: #fff; margin-bottom: 8px; }
.pres-portal-summary-text { font-size: 0.72rem; color: #94a3b8; line-height: 1.5; }

/* ── FOOTER ── */
.pres-footer {
  text-align: center; padding: 60px 24px 40px; color: #334155;
  font-size: 0.8rem; font-weight: 600; position: relative; z-index: 1;
  border-top: 1px solid rgba(255,255,255,0.04);
}
.pres-footer-logo { font-size: 1.2rem; font-weight: 900; color: #34d399; margin-bottom: 8px; }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .pres-mock-scene-split { flex-direction: column; }
  .pres-mock-sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; padding: 8px; gap: 4px; }
  .pres-mock-nav-item { padding: 5px 8px; font-size: 0.6rem; }
  .pres-feature-grid { grid-template-columns: 1fr !important; }
  .pres-portal-summary { grid-template-columns: 1fr 1fr; }
  .pres-nav-links { display: none; }
  .pres-hero-stats { gap: 12px; }
}
@media (max-width: 600px) {
  .pres-portal-summary { grid-template-columns: 1fr; }
  .pres-scene-controls { flex-wrap: wrap; gap: 8px; }
  .pres-act { padding: 60px 16px; }
}
`;

export default WorkflowPage;
