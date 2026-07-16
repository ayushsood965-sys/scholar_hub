import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass, GraduationCap, CalendarRange, HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const hostname = window.location.hostname;

  // Determine current portal context
  const isSync = hostname.includes('sync');
  const isTrack = hostname.includes('track');
  const isGateway = !isSync && !isTrack;

  useEffect(() => {
    // Dynamically insert CSS animations and custom fonts into head
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
        @keyframes pulseGlow {
          0% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 0.5; transform: scale(1); }
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
          box-shadow: 0 8px 25px rgba(56, 189, 248, 0.4) !important;
          border-color: rgba(56, 189, 248, 0.8) !important;
        }

        .nf-link-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="nf-container" style={styles.wrapper}>
      {/* Background Mesh Gradients */}
      <div style={{ ...styles.blurBlob, ...styles.blob1 }} />
      <div style={{ ...styles.blurBlob, ...styles.blob2 }} />
      <div style={{ ...styles.blurBlob, ...styles.blob3 }} />

      {/* Main Glassmorphism Card */}
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src="/hpu_logo.png" alt="HPU Logo" style={styles.logo} />
          <span style={styles.logoText}>HPU ScholarHub</span>
        </div>

        {/* 404 Floating Number */}
        <div style={styles.glitchBox}>
          <h1 style={styles.header404}>404</h1>
        </div>

        <h2 style={styles.title}>Lost in the Research Cosmos?</h2>
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
          {!isGateway && (
            <a href="https://scholarhubhpu.in" style={styles.linkCard} className="nf-link-card">
              <Compass size={22} color="#38bdf8" />
              <div style={styles.linkInfo}>
                <span style={styles.linkLabel}>Gateway Hub</span>
                <span style={styles.linkDesc}>Central Router Page</span>
              </div>
            </a>
          )}

          {!isSync && (
            <a href="https://sync.scholarhubhpu.in" style={styles.linkCard} className="nf-link-card">
              <GraduationCap size={22} color="#34d399" />
              <div style={styles.linkInfo}>
                <span style={styles.linkLabel}>ScholarSync</span>
                <span style={styles.linkDesc}>Ph.D. Lifecycle Tracker</span>
              </div>
            </a>
          )}

          {!isTrack && (
            <a href="https://track.scholarhubhpu.in" style={styles.linkCard} className="nf-link-card">
              <CalendarRange size={22} color="#f43f5e" />
              <div style={styles.linkInfo}>
                <span style={styles.linkLabel}>ScholarTrack</span>
                <span style={styles.linkDesc}>Attendance & Leaves</span>
              </div>
            </a>
          )}
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

// Sleek Dark Theme + Glassmorphism Styles (Inline)
const styles = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#030712', // Charcoal tailwind slate-950
    color: '#f3f4f6',
    overflow: 'hidden',
    padding: '20px',
    boxSizing: 'border-box',
  },
  blurBlob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(100px)',
    opacity: 0.15,
    pointerEvents: 'none',
  },
  blob1: {
    width: '450px',
    height: '450px',
    backgroundColor: '#38bdf8', // Cyan
    top: '-10%',
    left: '10%',
    animation: 'drift 25s infinite alternate ease-in-out',
  },
  blob2: {
    width: '500px',
    height: '500px',
    backgroundColor: '#8b5cf6', // Violet
    bottom: '-15%',
    right: '5%',
    animation: 'driftReverse 30s infinite alternate ease-in-out',
  },
  blob3: {
    width: '350px',
    height: '350px',
    backgroundColor: '#f43f5e', // Rose
    bottom: '20%',
    left: '-5%',
    animation: 'drift 20s infinite alternate ease-in-out',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '560px',
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Sleek dark translucent
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '40px 30px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
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
    color: '#e5e7eb',
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
    background: 'linear-gradient(135deg, #38bdf8 0%, #8b5cf6 50%, #f43f5e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
    textShadow: '0 10px 40px rgba(139, 92, 246, 0.15)',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '600',
    margin: '20px 0 10px 0',
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.98rem',
    lineHeight: '1.6',
    color: '#9ca3af',
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
    border: '1px solid rgba(56, 189, 248, 0.5)',
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.25)',
  },
  btnOutline: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#e5e7eb',
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
    color: '#6b7280',
    backgroundColor: '#0a1020',
    padding: '0 12px',
    zIndex: 2,
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
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
    border: '1px solid rgba(255, 255, 255, 0.05)',
    background: 'rgba(255, 255, 255, 0.03)',
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
    color: '#ffffff',
  },
  linkDesc: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '2px',
  },
  footer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '25px',
    fontSize: '0.72rem',
    color: '#6b7280',
    lineHeight: '1.4',
    padding: '0 10px',
  },
};

export default NotFound;
