import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, CheckCircle2, AlertTriangle, FileText, 
  Calendar, Award, BookOpen, Clock, HeartPulse, Scale,
  CalendarRange
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Policies = () => {
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
          {/* Header */}
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
              <Scale size={14} /> Regulations
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
              Policy Guidelines & Compliance
            </h1>
            <p style={{
              fontSize: '1.15rem',
              color: 'var(--color-text-secondary)',
              maxWidth: '750px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Official academic regulations, attendance compliance standards, and leave management guidelines 
              governing Postgraduate and Doctoral Scholars at Himachal Pradesh University.
            </p>
          </motion.div>

          {/* Section 1: Attendance Compliance */}
          <motion.div variants={itemVariants} style={{ marginBottom: '60px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              borderBottom: '2px solid var(--color-border)',
              paddingBottom: '12px'
            }}>
              <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Attendance Standards</h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {/* Rule 1 */}
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: '20px',
                padding: '30px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                gap: '16px'
              }}>
                <div style={{ color: 'var(--status-absent)', flexShrink: 0 }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>75% Minimum Threshold</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                    Under HPU Ordinance, a cumulative attendance of <strong>75%</strong> is mandatory across all registered academic slots. Falloff below this limit automatically triggers "Defaulter Status" and disqualifies scholars from term-end exams.
                  </p>
                </div>
              </div>

              {/* Rule 2 */}
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: '20px',
                padding: '30px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                gap: '16px'
              }}>
                <div style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
                  <Award size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Attendance Condonation</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                    A maximum shortage condonation of <strong>10%</strong> may be granted by the HOD or Vice Chancellor under exceptional circumstances (e.g., serious medical emergencies or official representation of HPU in national events).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 2: Leave Policy & Rules */}
          <motion.div variants={itemVariants} style={{ marginBottom: '60px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              borderBottom: '2px solid var(--color-border)',
              paddingBottom: '12px'
            }}>
              <CalendarRange size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Leave Administration</h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {/* CL */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '30px 24px',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <Calendar size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Casual Leave (CL)</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Scholars are entitled to a maximum of <strong>8 days</strong> of Casual Leave in an academic session. CL cannot be combined with duty leave and requires advance notice.
                </p>
              </div>

              {/* ML */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '30px 24px',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <HeartPulse size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Medical Leave (ML)</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Must be supported by a registered medical practitioner's certificate. ML requests should be submitted within <strong>3 days</strong> of returning to the campus.
                </p>
              </div>

              {/* DL */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '30px 24px',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <FileText size={28} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px' }}>Duty Leave (DL)</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Granted for academic seminars, field-work, and university research duties. Prior written permission from the Supervisor is required before departure.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Correction Appeals Policy */}
          <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              borderBottom: '2px solid var(--color-border)',
              paddingBottom: '12px'
            }}>
              <Clock size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Correction & Appeals Window</h2>
            </div>

            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: 'var(--shadow)'
            }}>
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
                  <Scale size={22} />
                </div>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Correction Rules</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={18} color="var(--color-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        <strong>7-Day Window:</strong> Scholars must appeal against incorrect attendance entries within 7 days of the class occurrence. The window closes automatically at midnight of the 7th day.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={18} color="var(--color-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        <strong>Limit of 2 Attempts:</strong> A maximum of two correction appeals is allowed per timetable slot to prevent abuse and maintain audit trail cleanliness.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={18} color="var(--color-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        <strong>Mandatory Evidence:</strong> All medical or official absence correction requests must upload official supporting files or reference numbers.
                      </span>
                    </div>
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

export default Policies;
