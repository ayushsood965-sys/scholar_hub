import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Shield, Clock, Users, CalendarRange, FileCheck, ArrowRight } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const features = [
  { icon: Clock, title: 'Real-Time Tracking', desc: 'Mark, monitor, and audit attendance with live dashboard analytics and biometric-ready integrations.' },
  { icon: Shield, title: 'Policy Engine', desc: 'Department-isolated configurable rules. HODs set thresholds, condonation limits, and correction windows.' },
  { icon: CalendarRange, title: 'Leave Workflows', desc: 'Multi-tier approval chain: Scholar → Supervisor → HOD. Auto-credited records on approval.' },
  { icon: FileCheck, title: 'Dispute Resolution', desc: 'Student-initiated corrections with faculty recommendation and HOD final authority with full audit trail.' },
  { icon: Users, title: 'Role-Based Access', desc: 'Four-tier RBAC: Student, Faculty, HOD, and Super Admin. Each with precisely scoped operational views.' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Dynamic defaulter detection, ERP predictions, safe-absence calculations — all stateless and real-time.' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero */}
      <section className="hero-section">
        <div className="liquid-bg-wrapper">
          <div className="liquid-blob blob-1" />
          <div className="liquid-blob blob-2" />
          <div className="liquid-blob blob-3" />
        </div>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(var(--color-primary-rgb), 0.08)', padding: '6px 16px',
              borderRadius: '30px', fontSize: '0.82rem', fontWeight: 600,
              color: 'var(--color-primary)', marginBottom: '16px'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            ✨ Enterprise Attendance Suite
          </motion.div>

          <h1 className="hero-title">
            Precision <span>Attendance</span> Intelligence for Academic Excellence
          </h1>
          <p className="hero-subtitle">
            ScholarTrack delivers enterprise-grade attendance management with configurable policy engines, 
            multi-tier leave workflows, and real-time defaulter analytics — purpose-built for HPU's research scholar ecosystem.
          </p>

          <div className="hero-buttons">
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started <ArrowRight size={18} />
            </motion.button>
            <motion.button
              className="btn btn-outline btn-lg"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign In
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="hero-image-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div style={{
            width: '100%', maxWidth: '420px', height: '340px',
            borderRadius: '30px', padding: '32px',
            background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            animation: 'float-blob 8s ease-in-out infinite alternate'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <BarChart3 size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Attendance Report</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Current Session Analytics</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Present', value: '87%', color: 'var(--status-present)' },
                { label: 'Absent', value: '8%', color: 'var(--status-absent)' },
                { label: 'On Leave', value: '3%', color: 'var(--status-leave)' },
                { label: 'Late', value: '2%', color: 'var(--status-late)' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  style={{
                    padding: '14px', borderRadius: '12px',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)'
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color, marginTop: '4px' }}>{stat.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="main-content-wrapper" id="features">
        <div className="section-header">
          <h2 className="section-title">Built for Academic Rigor</h2>
          <p className="section-subtitle">
            Every feature is designed around the operational reality of university departments.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="feature-card glass-panel"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="feature-icon-wrapper">
                <feat.icon size={24} />
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-text">{feat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          className="stats-banner glass-panel"
          id="stats"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {[
            { num: '500+', label: 'Scholars Tracked' },
            { num: '12', label: 'Departments' },
            { num: '99.9%', label: 'Uptime SLA' },
            { num: '48hr', label: 'Edit Lock Window' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="stat-item"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <div className="stat-number">{s.num}</div>
              <div className="stat-label-text">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
