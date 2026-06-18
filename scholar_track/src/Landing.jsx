import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scan, 
  BarChart3, 
  CalendarRange, 
  BellRing, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import axios from 'axios';
import { API_URL } from './config';
import { AuthContext } from './context/AuthContext';

const Landing = () => {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [cohortData, setCohortData] = useState([]);

  const fetchRegistryData = async () => {
    setLoading(true);
    try {
      // Fetch public doctoral projects count to show integration
      const res = await axios.get(`${API_URL}/public/projects`);
      const phdCount = res.data.length || 0;
      
      setCohortData([
        { id: 'ug', name: 'Undergraduate (UG)', program: 'B.Tech, B.Sc, BCA, B.Com, B.A.', enrolled: 12450, attRate: '85.4%', status: 'Normal' },
        { id: 'pg', name: 'Postgraduate (PG)', program: 'M.Tech, M.Sc, MCA, MBA, M.A.', enrolled: 4890, attRate: '89.2%', status: 'Good' },
        { id: 'phd', name: 'PhD Research Scholars', program: 'Doctoral Studies', enrolled: phdCount || 950, attRate: '95.1%', status: 'Excellent' },
        { id: 'diploma', name: 'Diploma Candidates', program: 'Professional Diplomas', enrolled: 1650, attRate: '82.8%', status: 'Defalcation Warning' },
        { id: 'cert', name: 'Certificate Programs', program: 'Short-term Certifications', enrolled: 820, attRate: '87.6%', status: 'Normal' }
      ]);
    } catch (err) {
      console.warn('Error syncing registry data from backend, using default counts:', err);
      setCohortData([
        { id: 'ug', name: 'Undergraduate (UG)', program: 'B.Tech, B.Sc, BCA, B.Com, B.A.', enrolled: 12450, attRate: '85.4%', status: 'Normal' },
        { id: 'pg', name: 'Postgraduate (PG)', program: 'M.Tech, M.Sc, MCA, MBA, M.A.', enrolled: 4890, attRate: '89.2%', status: 'Good' },
        { id: 'phd', name: 'PhD Research Scholars', program: 'Doctoral Studies', enrolled: 950, attRate: '95.1%', status: 'Excellent' },
        { id: 'diploma', name: 'Diploma Candidates', program: 'Professional Diplomas', enrolled: 1650, attRate: '82.8%', status: 'Defalcation Warning' },
        { id: 'cert', name: 'Certificate Programs', program: 'Short-term Certifications', enrolled: 820, attRate: '87.6%', status: 'Normal' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistryData();
  }, []);

  return (
    <div className="landing-page">
      {/* Background blobs */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(26, 90, 59, 0.08)', padding: '6px 16px', borderRadius: '30px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '16px' }}>
            <Sparkles size={14} /> HPU Unified Portal
          </div>
          <h1 className="hero-title">
            HPU Attendance <br/>
            <span>Management System</span>
          </h1>
          <p className="hero-subtitle">
            A centralized, state-of-the-art attendance auditing suite built specifically for Himachal Pradesh University (HPU). Seamlessly tracking and registering biometric and digital attendance for UG, PG, PhD Scholars, Diploma, and Certificate programs.
          </p>
          <div className="hero-buttons">
            {user ? (
              <>
                <Link to={
                  user.role === 'SUPER_ADMIN' ? '/super-dashboard' :
                  user.role === 'HOD' ? '/hod-dashboard' :
                  user.role === 'ADMIN' ? '/admin-dashboard' :
                  user.role === 'FACULTY' ? '/faculty-dashboard' :
                  '/student-dashboard'
                } className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
                <button onClick={logout} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: '30px', padding: '12px 28px', color: 'inherit' }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signup" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  Register Profile <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  Account Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-image-container">
          {/* Animated SVG (Lottie Style) containing HPU logo in center */}
          <div className="glass-panel animated-svg-box" style={{ background: 'var(--glass-bg)', padding: '30px' }}>
            <svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#133A26" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>

              {/* Grid Background lines */}
              <g opacity="0.12" stroke="var(--color-text-secondary)" strokeWidth="1">
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

              {/* Main Claymorphic Device Card */}
              <rect x="80" y="80" width="240" height="240" rx="36" fill="#f0fdf4" filter="drop-shadow(0px 16px 32px rgba(19, 58, 38, 0.12))" stroke="#e5e7eb" strokeWidth="2" />
              
              {/* Bevel reflection inside claymorphic card */}
              <rect x="83" y="83" width="234" height="234" rx="33" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.9" />

              {/* Outer scanner spin ring */}
              <circle cx="200" cy="200" r="70" fill="none" stroke="url(#primary-grad)" strokeWidth="3" strokeDasharray="300" strokeDashoffset="0">
                <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="12s" repeatCount="indefinite" />
              </circle>

              {/* Inner scanner spin ring */}
              <circle cx="200" cy="200" r="55" fill="none" stroke="url(#accent-grad)" strokeWidth="2" strokeDasharray="80 60">
                <animateTransform attributeName="transform" type="rotate" from="360 200 200" to="0 200 200" dur="8s" repeatCount="indefinite" />
              </circle>

              {/* Glowing signal waves */}
              <circle cx="200" cy="200" r="40" fill="rgba(52, 211, 153, 0.08)" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="1">
                <animate attributeName="r" values="35;48;35" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* Center scanner radar line */}
              <line x1="140" y1="150" x2="260" y2="150" stroke="#34d399" strokeWidth="3" opacity="0.8">
                <animate attributeName="y1" values="150; 250; 150" dur="4s" repeatCount="indefinite" />
                <animate attributeName="y2" values="150; 250; 150" dur="4s" repeatCount="indefinite" />
              </line>

              {/* Floating check mark */}
              <circle cx="275" cy="115" r="18" fill="#34d399" filter="drop-shadow(0px 6px 12px rgba(52, 211, 153, 0.35))">
                <animate attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <path d="M269 115 L273 119 L282 110" fill="none" stroke="#133A26" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Logo embedded directly inside the SVG so it scales and aligns perfectly in the center */}
              <circle cx="200" cy="200" r="34" fill="#ffffff" stroke="rgba(19, 58, 38, 0.1)" strokeWidth="2" />
              <image href="/hpu_logo.png" x="176" y="176" width="48" height="48" />
            </svg>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        
        {/* HPU Portals Grid Section */}
        <section>
          <div className="section-header">
            <h2 className="section-title">HPU Academic Cohorts</h2>
            <p className="section-subtitle">Track, audit, and regulate student registers across all major divisions of Himachal Pradesh University.</p>
          </div>

          <div className="features-grid">
            <div className="clay-card feature-card">
              <div className="feature-icon-wrapper">
                <GraduationCap size={26} color="#133A26" />
              </div>
              <h3 className="feature-title">Undergraduate (UG)</h3>
              <p className="feature-text">Centralized attendance registers for all UG programs (B.Tech, B.Sc, BCA, BA, B.Com) across HPU departments.</p>
              <Link to="/track" className="btn-feature">Audit UG Portal <ArrowRight size={14} /></Link>
            </div>

            <div className="clay-card feature-card">
              <div className="feature-icon-wrapper">
                <GraduationCap size={26} color="#133A26" />
              </div>
              <h3 className="feature-title">Postgraduate (PG)</h3>
              <p className="feature-text">Dynamic log synchronizations for postgraduate programs (M.Tech, M.Sc, MCA, MBA) with automatic deficiency alert systems.</p>
              <Link to="/track" className="btn-feature">Audit PG Portal <ArrowRight size={14} /></Link>
            </div>

            <div className="clay-card feature-card">
              <div className="feature-icon-wrapper">
                <GraduationCap size={26} color="#133A26" />
              </div>
              <h3 className="feature-title">PhD Research Scholars</h3>
              <p className="feature-text">Biometric registry systems designed for PhD candidates, syncs guide approvals and research lab attendance clocks.</p>
              <Link to="/track" className="btn-feature">Audit PhD Portal <ArrowRight size={14} /></Link>
            </div>

            <div className="clay-card feature-card">
              <div className="feature-icon-wrapper">
                <GraduationCap size={26} color="#133A26" />
              </div>
              <h3 className="feature-title">Diploma & Certificates</h3>
              <p className="feature-text">Simplified digital check-ins for diploma candidates and short-term certificate program batches.</p>
              <Link to="/track" className="btn-feature">Audit Diploma Portal <ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>

        {/* Dynamic HPU Registry Data Fetcher preloader section */}
        <section style={{ marginTop: '100px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="section-header">
            <h2 className="section-title">HPU Registry Synchronization</h2>
            <p className="section-subtitle">Simulate real-time data synchronization directly from the official HPU academic databases.</p>
          </div>

          <div className="glass-panel" style={{ padding: '40px', minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            
            {loading ? (
              /* Fetching API preloader style - identical to scholar sync portal */
              <div className="premium-preloader-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="premium-preloader-spinner"></div>
                <div className="premium-preloader-text">Fetching data from HPU Academic Registry...</div>
              </div>
            ) : (
              /* Success Registry Grid Display */
              <div style={{ width: '100%', animation: 'premium-pulse 3s infinite alternate' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🟢 HPU Database Node Connected
                  </h3>
                  <button className="btn-primary" onClick={fetchRegistryData} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.88rem' }}>
                    <RefreshCw size={14} /> Synchronize Now
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '12px' }}>
                        <th style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Academic Division</th>
                        <th style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Covers Degrees</th>
                        <th style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Enrolled Students</th>
                        <th style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Avg Attendance</th>
                        <th style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Registry Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohortData.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)', hover: { background: 'rgba(0,0,0,0.02)' } }}>
                          <td style={{ padding: '16px 12px', fontSize: '0.95rem', fontWeight: 600 }}>{c.name}</td>
                          <td style={{ padding: '16px 12px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{c.program}</td>
                          <td style={{ padding: '16px 12px', fontSize: '0.88rem', textAlign: 'center', fontWeight: 500 }}>{c.enrolled.toLocaleString()}</td>
                          <td style={{ padding: '16px 12px', fontSize: '0.92rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>{c.attRate}</td>
                          <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                            <span style={{ 
                              fontSize: '0.72rem', 
                              fontWeight: 700, 
                              background: c.status.includes('Defalcation') ? '#FEE2E2' : c.status === 'Excellent' ? '#D1FAE5' : '#FEF3C7', 
                              color: c.status.includes('Defalcation') ? '#991B1B' : c.status === 'Excellent' ? '#065F46' : '#D97706', 
                              padding: '4px 10px', 
                              borderRadius: '12px' 
                            }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* System Functionalities cards */}
        <section style={{ marginTop: '100px' }}>
          <div className="section-header">
            <h2 className="section-title">ScholarTrack Features</h2>
            <p className="section-subtitle">Automated workflows built to handle attendance management tasks seamlessly.</p>
          </div>

          <div className="features-grid">
            <div className="clay-card feature-card">
              <div className="feature-icon-wrapper">
                <Scan size={26} color="#133A26" />
              </div>
              <h3 className="feature-title">Scan Integration</h3>
              <p className="feature-text">Support face scanner terminals, student RFID cards, and class-level QR scan tokens.</p>
            </div>

            <div className="clay-card feature-card">
              <div className="feature-icon-wrapper">
                <BarChart3 size={26} color="#133A26" />
              </div>
              <h3 className="feature-title">Analytics Reports</h3>
              <p className="feature-text">HOD and registrars download monthly rosters, defalcation details, and university statistics logs.</p>
            </div>

            <div className="clay-card feature-card">
              <div className="feature-icon-wrapper">
                <CalendarRange size={26} color="#133A26" />
              </div>
              <h3 className="feature-title">Leave Request Portal</h3>
              <p className="feature-text">Students submit leave logs with documents. HOD / professors approve or reject leaves dynamically.</p>
            </div>

            <div className="clay-card feature-card">
              <div className="feature-icon-wrapper">
                <BellRing size={26} color="#133A26" />
              </div>
              <h3 className="feature-title">Automatic Warnings</h3>
              <p className="feature-text">Sends alerts for students whose attendance ratio falls below the HPU mandatory 75% limit.</p>
            </div>
          </div>
        </section>

        {/* Summary Statistics Counter Banner */}
        <div className="clay-card stats-banner" style={{ background: 'var(--color-surface)' }}>
          <div className="stat-item">
            <div className="stat-number">20k+</div>
            <div className="stat-label">HPU Students</div>
          </div>
          <div className="stat-item" style={{ borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)', paddingLeft: '40px', paddingRight: '40px' }}>
            <div className="stat-number">98.4%</div>
            <div className="stat-label">Scan Precision</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">15+</div>
            <div className="stat-label">HPU Departments</div>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default Landing;
