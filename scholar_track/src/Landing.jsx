import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import { motion } from 'framer-motion';
import { BarChart3, Shield, Clock, CalendarRange, ArrowRight } from 'lucide-react';
import { API_URL } from './config';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Landing = () => {
  const [stats, setStats] = useState({ scholars: 500, guides: 45, departments: 12, awardedDegrees: 84 });
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

  const features = [
    { 
      icon: Clock, 
      title: 'Real-Time Tracking', 
      desc: 'Common platform for researchers and supervisors to track daily sessions and monthly attendance logs.' 
    },
    { 
      icon: CalendarRange, 
      title: 'Leave Workflows', 
      desc: 'Multi-tier leave applications with automatic supervisor recommendations and HOD approvals.' 
    },
    { 
      icon: Shield, 
      title: 'Policy Configuration', 
      desc: 'Department-isolated policy engine. Set thresholds, condonation limits, and edit windows.' 
    },
    { 
      icon: BarChart3, 
      title: 'Smart Analytics', 
      desc: 'Real-time monitoring, monthly rosters, and automatic defaulter alerts for administrative transparency.' 
    },
  ];

  return (
    <div className="landing-page">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1" />
        <div className="liquid-blob blob-2" />
        <div className="liquid-blob blob-3" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(var(--color-primary-rgb), 0.08)',
              padding: '6px 16px',
              borderRadius: '30px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              marginBottom: '16px'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            ✨ Unified Attendance & Leave Portal
          </motion.div>

          <h1 className="hero-title">
            Precision <span>Attendance</span> Orchestration for HPU Research.
          </h1>
          <p className="hero-subtitle">
            A centralized platform for scholars, faculty, and departments<br />
            to coordinate schedules, request leaves, and monitor program compliance.
          </p>

          <div className="hero-buttons">
            <a href="#features" className="btn-dark" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Explore Pillars
            </a>
            <Link to="/signup" className="btn-dark" style={{ textDecoration: 'none', background: '#A5D6A7', color: '#133A26', display: 'inline-flex', alignItems: 'center' }}>
              Create Profile <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="hero-image-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ scale: 1.04, transition: { duration: 0.15, ease: 'easeOut' } }}
        >
          <div style={{
            width: '100%', maxWidth: '420px', height: '340px',
            borderRadius: '30px', padding: '32px',
            background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <BarChart3 size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Roster Preview</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Defaulter & Audit Logs</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Present Today', value: '92%', color: 'var(--status-present)' },
                { label: 'Absent Today', value: '4%', color: 'var(--status-absent)' },
                { label: 'Approved Leave', value: '3%', color: 'var(--status-leave)' },
                { label: 'Late In', value: '1%', color: 'var(--status-late)' },
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

      {/* Main Content White Wrapper */}
      <div className="main-content-wrapper" id="features">
        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">Built for Academic Compliance</h2>
            <p className="section-subtitle">
              Every pillar is aligned with university regulations for doctoral research tracks.
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
        </section>

        {/* Dynamic Statistics Banner */}
        <section style={{ marginTop: '80px' }}>
          <div className="section-header" style={{ marginBottom: '40px' }}>
            <h2 className="section-title">Live Portal Statistics</h2>
            <p className="section-subtitle">Real-time status updates across HPU departments.</p>
          </div>

          {loading ? (
            <div className="premium-preloader-container" style={{ minHeight: '150px' }}>
              <div className="premium-preloader-spinner"></div>
              <div className="premium-preloader-text">Loading live statistics...</div>
            </div>
          ) : (
            <motion.div
              className="stats-banner glass-panel"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {[
                { num: stats.scholars, label: 'Active Scholars' },
                { num: stats.guides, label: 'Registered Guides' },
                { num: stats.departments, label: 'HPU Departments' },
                { num: stats.awardedDegrees, label: 'Awarded Degrees' },
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
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Landing;
