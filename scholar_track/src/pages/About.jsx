import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Shield, Clock, CalendarRange, CheckCircle2, 
  Users, Activity, FileText, Building, Info, Cpu, HelpCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  // Animation presets
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
      {/* Background Animated Blobs */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1" />
        <div className="liquid-blob blob-2" />
        <div className="liquid-blob blob-3" />
      </div>

      <Navbar />

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '120px 8% 80px', zIndex: 1 }}>
        <motion.div 
          className="container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: '1100px', margin: '0 auto' }}
        >
          {/* Hero Banner Section */}
          <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--color-sync-light)',
              color: 'var(--color-primary)',
              padding: '6px 16px',
              borderRadius: '30px',
              fontSize: '0.88rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
              border: '1px solid rgba(26, 90, 59, 0.1)'
            }}>
              <Info size={14} /> About the Portal
            </span>
            <h1 style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              letterSpacing: '-1px',
              lineHeight: '1.2',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, var(--color-sidebar) 0%, var(--color-primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ScholarTrack Attendance & Leave Management
            </h1>
            <p style={{
              fontSize: '1.15rem',
              color: 'var(--color-text-secondary)',
              maxWidth: '750px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              ScholarTrack is Himachal Pradesh University's dedicated digital framework for academic tracking, 
              streamlining attendance compliance and leave administration for research scholars and PG students.
            </p>
          </motion.div>

          {/* Grid Layout - Vision & Core Mission */}
          <motion.div 
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px',
              marginBottom: '70px'
            }}
          >
            {/* Core Card 1 */}
            <div className="clay-card" style={{
              padding: '40px 30px',
              borderRadius: '24px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'transform 0.3s ease',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'var(--color-sync-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>System Objective</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                To establish a high-accuracy, transparent tracking framework. ScholarTrack eliminates tedious paper-based registries and replaces them with an audited, real-time logging platform conforming to official UGC and University mandates.
              </p>
            </div>

            {/* Core Card 2 */}
            <div className="clay-card" style={{
              padding: '40px 30px',
              borderRadius: '24px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'transform 0.3s ease',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'var(--color-sync-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Compliance & Transparency</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Built around trust and openness, the system gives scholars complete control over their metrics, providing real-time safe-absence analysis, automated alerts, and clear criteria for exam eligibility.
              </p>
            </div>
          </motion.div>

          {/* Interactive Role Workflow Showcase */}
          <motion.div variants={itemVariants} style={{ marginBottom: '80px' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: '40px',
              letterSpacing: '-0.5px'
            }}>
              System Architecture & Stakeholders
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '24px'
            }}>
              {/* Student */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '30px 24px',
                textAlign: 'center',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <Activity size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Scholars & Students</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Track attendance, check exam eligibility, apply for leaves, and appeal errors within a 7-day window.
                </p>
              </div>

              {/* Faculty */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '30px 24px',
                textAlign: 'center',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <Users size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Faculty Supervisors</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Mark attendance via daily class grids, recommend student leave requests, and resolve correction appeals.
                </p>
              </div>

              {/* HOD */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '30px 24px',
                textAlign: 'center',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <Building size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Heads of Department</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Configure timetables, verify attendance batches, grant final approvals for leaves, and inspect analytics.
                </p>
              </div>

              {/* Administrator */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '30px 24px',
                textAlign: 'center',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <Shield size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Super Admin</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Maintain system settings, seed university holiday calendars, approve new staff, and manage database health.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Technical Specifications / FAQ Info block */}
          <motion.div 
            variants={itemVariants}
            style={{
              background: 'var(--color-surface)',
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              padding: '40px',
              boxShadow: 'var(--shadow)',
              marginBottom: '40px'
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--color-sync-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <HelpCircle size={22} />
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>Integrated Ecosystem</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '12px' }}>
                  ScholarTrack works seamlessly in tandem with <strong>ScholarSync</strong>, the primary Doctoral Lifecycle and Thesis Progress Portal. Once profiles are verified by the department head in ScholarSync, scholars gain immediate access to track their attendance on the ScholarTrack portal.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--color-success)" /> UGC Compliant Rules
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--color-success)" /> Immutable Audit Logging
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--color-success)" /> Multi-role Dashboard Integration
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
