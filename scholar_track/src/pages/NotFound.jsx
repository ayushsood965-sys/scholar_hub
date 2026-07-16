import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, GraduationCap, CalendarRange, HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const styleId = 'notfound-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes drift {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(40px, -40px) rotate(180deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        @keyframes driftReverse {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(-50px, 50px) rotate(-180deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        
        .nf-container {
          font-family: 'Outfit', sans-serif;
        }
        
        .nf-btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.25) !important;
          border-color: rgba(16, 185, 129, 0.5) !important;
        }

        .nf-link-card:hover {
          transform: translateY(-4px);
          background: #ffffff !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
          box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.08) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="nf-container" style={styles.wrapper}>
      {/* Background Mint Mesh Gradients */}
      <div style={{ ...styles.blurBlob, ...styles.blob1 }} />
      <div style={{ ...styles.blurBlob, ...styles.blob2 }} />
      <div style={{ ...styles.blurBlob, ...styles.blob3 }} />

      {/* Main Glassmorphism Card */}
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src="/hpu_logo.png" alt="HPU Logo" style={styles.logo} />
          <span style={styles.logoText}>ScholarTrack</span>
        </div>

        {/* 404 Floating Number */}
        <div style={styles.glitchBox}>
          <h1 style={styles.header404}>404</h1>
        </div>

        <h2 style={styles.title}>Lost in the Attendance Cosmos?</h2>
        <p style={styles.subtitle}>
          The page you are looking for has migrated, does not exist, or is temporarily unavailable in this module.
        </p>

        {/* Action Buttons */}
        <div style={styles.btnRow}>
          <button onClick={() => navigate(-1)} style={styles.btnOutline} className="nf-btn-hover">
            <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Go Back
          </button>
          <button onClick={() => navigate('/')} style={styles.btnPrimary} className="nf-btn-hover">
            <Home size={18} style={{ marginRight: '8px' }} /> Return Home
          </button>
        </div>

        {/* Cross-Portal Navigation Help */}
        <div style={styles.divider}>
          <span style={styles.dividerText}>Need Another Module?</span>
        </div>

        <div style={styles.portalLinks}>
          <a href="https://scholarhubhpu.in" style={styles.linkCard} className="nf-link-card">
            <Compass size={22} color="#059669" />
            <div style={styles.linkInfo}>
              <span style={styles.linkLabel}>Gateway Hub</span>
              <span style={styles.linkDesc}>Central Router Page</span>
            </div>
          </a>

          <a href="https://sync.scholarhubhpu.in" style={styles.linkCard} className="nf-link-card">
            <GraduationCap size={22} color="#10b981" />
            <div style={styles.linkInfo}>
              <span style={styles.linkLabel}>ScholarSync</span>
              <span style={styles.linkDesc}>Ph.D. Lifecycle Tracker</span>
            </div>
          </a>
        </div>

        {/* Bottom Help */}
        <div style={styles.footer}>
          <HelpCircle size={14} style={{ marginRight: '5px' }} />
          <span>If you believe this is an error, please contact HPU Network Administration.</span>
        </div>
      </div>
    </div>
  );
};

// Clean Green Light Theme Styles (Inline)
const styles = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#f4fbf7', // Minty off-white background
    color: '#1e293b',
    overflow: 'hidden',
    padding: '20px',
    boxSizing: 'border-box',
  },
  blurBlob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(100px)',
    opacity: 0.35,
    pointerEvents: 'none',
  },
  blob1: {
    width: '450px',
    height: '450px',
    backgroundColor: '#a7f3d0', // Light Emerald
    top: '-10%',
    left: '10%',
    animation: 'drift 25s infinite alternate ease-in-out',
  },
  blob2: {
    width: '500px',
    height: '500px',
    backgroundColor: '#d1fae5', // Very light mint
    bottom: '-15%',
    right: '5%',
    animation: 'driftReverse 30s infinite alternate ease-in-out',
  },
  blob3: {
    width: '350px',
    height: '350px',
    backgroundColor: '#6ee7b7', // Vibrant Mint
    bottom: '20%',
    left: '-5%',
    animation: 'drift 20s infinite alternate ease-in-out',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '560px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // High opacity white
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(16, 185, 129, 0.15)', // Thin green border
    borderRadius: '24px',
    padding: '40px 30px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(19, 58, 38, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
    boxSizing: 'border-box',
  },
  logoContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  logo: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
  },
  logoText: {
    fontSize: '0.95rem',
    fontWeight: '600',
    letterSpacing: '0.05em',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  glitchBox: {
    animation: 'float 6s infinite ease-in-out',
  },
  header404: {
    fontSize: '8.5rem',
    fontWeight: '800',
    margin: '0',
    lineHeight: '1',
    background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)', // Emerald-Mint gradient
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
    textShadow: '0 10px 40px rgba(16, 185, 129, 0.1)',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '600',
    margin: '20px 0 10px 0',
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.98rem',
    lineHeight: '1.6',
    color: '#475569',
    margin: '0 0 30px 0',
    padding: '0 10px',
  },
  btnRow: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '35px',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)',
  },
  btnOutline: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    background: 'rgba(255, 255, 255, 0.8)',
    color: '#059669',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  divider: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '25px 0 20px 0',
  },
  dividerText: {
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#64748b',
    backgroundColor: '#f3fdf8',
    padding: '4px 12px',
    zIndex: 2,
    borderRadius: '8px',
    border: '1px solid rgba(16, 185, 129, 0.08)',
  },
  portalLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  linkCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '14px 20px',
    borderRadius: '14px',
    border: '1px solid rgba(16, 185, 129, 0.1)',
    background: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    transition: 'all 0.25s ease',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  linkInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  linkLabel: {
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#0f172a',
  },
  linkDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '2px',
  },
  footer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '25px',
    fontSize: '0.72rem',
    color: '#64748b',
    lineHeight: '1.4',
    padding: '0 10px',
  },
};

export default NotFound;
