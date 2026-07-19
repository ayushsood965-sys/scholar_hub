import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  ArrowUpRight,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  Folder,
  Users,
  Bookmark,
  Lock,
  Download,
  Calendar,
  Building,
  Lightbulb,
  MapPin,
  Copyright,
  ShieldAlert,
  Globe
} from 'lucide-react';
import { API_URL } from './config';

const getAPIUrl = () => API_URL || 'http://localhost:5000/api';

const RepositoryProfile = () => {
  const { username } = useParams();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const renderField = (label, value) => {
    if (!value) return null;
    const isPrivateField = value === "Uploaded, but privacy is set to private.";
    return (
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-sync-text-secondary || var(--color-text-muted))', display: 'block' }}>{label}</span>
        {isPrivateField ? (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} style={{ opacity: 0.7 }} /> Uploaded, but privacy is set to private.
          </span>
        ) : (
          <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{value}</strong>
        )}
      </div>
    );
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${getAPIUrl()}/public/repository/profile/${username}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Profile not found or disabled.");
          } else {
            setError("Failed to load profile details.");
          }
          return;
        }
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav className="landing-nav">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="landing-logo" style={{ textDecoration: 'none' }}>
            <div className="landing-logo-wrapper"><img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '28px', height: '28px' }} /></div>
            <span className="logo-text">HPU ScholarHub</span>
          </a>
        </nav>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '500px' }}>
            <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Profile Error</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{error || "An unexpected error occurred."}</p>
            <button onClick={() => navigate('/discovery')} className="btn-primary" style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
              Back to Directory
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isPrivate = !!profileData.privacyMessage;
  const isDocsPrivate = !!profileData.documentsPrivateMessage;
  const profile = profileData.profile || {};
  const isStudent = profileData.role === 'STUDENT';

  // Determine back route
  let backRoute = '/discovery';
  if (profileData.department) {
    backRoute = `/discovery`;
  }

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      {/* Background blobs */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="landing-logo" style={{ textDecoration: 'none' }}>
          <div className="landing-logo-wrapper">
            <img src="/hpu_logo.png" alt="HPU Logo" className="landing-logo-img" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          </div>
          <span className="logo-text">HPU ScholarHub</span>
        </a>

        <div className="nav-links">
          <button onClick={() => navigate('/')} className="nav-link-btn">Home</button>
          <button onClick={() => navigate('/', { state: { scrollTo: 'about' } })} className="nav-link-btn">About</button>
          <button onClick={() => navigate('/', { state: { scrollTo: 'portals' } })} className="nav-link-btn">Portals</button>
          <Link to="/discovery" className="nav-link-btn" style={{ color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)' }}>Academic Research Discovery</Link>
          <Link to="/acknowledgements" className="nav-link-btn">Acknowledgements</Link>
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)', padding: '8px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.02)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={() => navigate('/', { state: { scrollTo: 'portals' } })} className="btn-primary login-nav-btn">
            Login Portal <ArrowUpRight size={16} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, zIndex: 1, padding: '40px 8% 100px', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '32px'
          }}
        >
          <ArrowLeft size={16} /> Go Back
        </button>

        {/* Profile Card Header */}
        <div className="glass-panel" style={{ borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: window.innerWidth <= 600 ? 'column' : 'row', alignItems: 'center', gap: '30px', marginBottom: '32px' }}>
          {/* Avatar */}
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--color-sync-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--color-border)' }}>
            {profileData.avatarUrl ? (
              <img src={profileData.avatarUrl.startsWith('http') ? profileData.avatarUrl : `http://localhost:5000${profileData.avatarUrl}`} alt={profileData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={64} style={{ color: 'var(--color-primary)' }} />
            )}
          </div>

          <div style={{ flex: 1, textAlign: window.innerWidth <= 600 ? 'center' : 'left' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.5px', background: 'var(--color-sync-light)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '8px' }}>
              {profileData.role === 'STUDENT' ? 'Ph.D. Scholar' : profileData.role === 'HOD' ? 'Head of Department' : 'Faculty Member'}
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
              {profileData.name}
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: '0 0 8px 0', fontWeight: '500' }}>
              🏢 {profileData.department}
            </p>
            {isStudent ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                🎓 Course: {profile.degreeName || 'Doctor of Philosophy (Ph.D.)'}
              </p>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                💼 Designation: {profile.designation || 'Academic Staff'}
              </p>
            )}
          </div>
        </div>

        {/* Private Profile Warning Card */}
        {isPrivate ? (
          <div className="glass-panel" style={{ border: '1px solid #ffe69c', background: 'rgba(255, 243, 205, 0.25)', borderRadius: '16px', padding: '32px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <Lock size={32} style={{ color: '#d97706', flexShrink: 0, marginTop: '4px' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#b45309', margin: '0 0 8px 0' }}>Profile Details Private</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {profileData.privacyMessage || "This profile details have been set to private by the user. Showing only basic institutional registration parameters."}
              </p>
              <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', border: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>Email ID:</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{profileData.username}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>HPU Reg No:</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{profile.shNo || 'N/A'}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Public Profile Details */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Main Details and Side Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              
              {/* Left Column: Personal and Bio info */}
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', margin: 0, color: 'var(--color-text-primary)' }}>
                  Personal Profile
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {renderField('Date of Birth', profile.dob)}
                  {renderField('Gender', profile.gender)}
                  {renderField('Category', profile.category)}
                  {renderField('Nationality', profile.nationality)}
                  {renderField('Contact Address', profile.address)}
                </div>
              </div>

              {/* Right Column: Research / Bio / Thesis Details */}
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', margin: 0, color: 'var(--color-text-primary)' }}>
                  {isStudent ? 'Doctoral Research Details' : 'Academic Profile'}
                </h3>
                {isStudent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {renderField('Thesis Title', profile.thesisTitle)}
                    {renderField('Synopsis Summary', profile.thesisSummary)}
                    {renderField('Keywords', profile.thesisKeywords)}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {renderField('Area of Specialization', profile.specialization)}
                    {renderField('Office Room', profile.officeRoom)}
                    {profile.yearsOfServicePrivate ? (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Years of Service</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} /> Uploaded, but privacy is set to private.
                        </span>
                      </div>
                    ) : (profile.yearsOfService !== undefined && profile.yearsOfService !== null) ? (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Years of Service</span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{profile.yearsOfService} Years</strong>
                      </div>
                    ) : null}
                    {renderField('Additional Responsibilities', profile.additionalResponsibilities)}
                  </div>
                )}
              </div>

            </div>

            {/* Expertise Section */}
            {profile.expertise && (profile.expertise.length > 0 || profile.expertise.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={18} style={{ color: 'var(--color-primary)' }} /> Area of Expertise
                </h3>
                {profile.expertise.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      Expertise areas logged, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {profile.expertise.map((tag, idx) => (
                      <span key={idx} style={{ fontSize: '0.8rem', fontWeight: '600', padding: '6px 12px', borderRadius: '20px', background: 'var(--color-sync-light)', color: 'var(--color-primary)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Qualifications & Certificates (Education) */}
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GraduationCap size={20} style={{ color: 'var(--color-primary)' }} /> Education & Qualifications
              </h3>
              
              {isDocsPrivate && (
                <div style={{ border: '1px solid #ffe69c', background: 'rgba(255, 243, 205, 0.15)', borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                  <Lock size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: '#856404' }}>
                    {profileData.documentsPrivateMessage || "Uploaded documents and certificates have been set to private by the candidate."}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Loop Qualifications */}
                {profile.qualifications && Object.keys(profile.qualifications).map((key) => {
                  const qual = profile.qualifications[key];
                  if (!qual || key === 'otherQuals' || key === 'fellowships') return null;
                  
                  // Map display names
                  const displayNames = {
                    class10: 'Class 10th (Matriculation)',
                    class12: 'Class 12th (Senior Secondary)',
                    graduation: 'Undergraduate Degree',
                    postGraduation: 'Postgraduate Degree',
                    mphil: 'M.Phil. Degree',
                    netJrf: 'UGC-NET / JRF Fellowship',
                    ugcNet: 'UGC-NET / JRF Fellowship'
                  };

                  if (qual.isPrivate) {
                    return (
                      <div key={key} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
                            {displayNames[key] || key}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={12} /> Uploaded, but privacy is set to private.
                          </span>
                        </div>
                        {qual.certificatePrivate || isDocsPrivate ? (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                            <Lock size={10} /> Private Document
                          </span>
                        ) : qual.certificateUrl ? (
                          <a 
                            href={qual.certificateUrl.startsWith('http') ? qual.certificateUrl : `http://localhost:5000${qual.certificateUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                          >
                            <Download size={12} /> Certificate
                          </a>
                        ) : null}
                      </div>
                    );
                  }

                  if (!qual.board && !qual.university && !qual.degree && !qual.examName) return null;

                  return (
                    <div key={key} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
                          {displayNames[key] || key}
                        </strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                          {qual.degree || qual.examName || 'Credential'} | {qual.board || qual.university || qual.agency || 'N/A'} ({qual.year || qual.passingYear || 'N/A'})
                        </span>
                        {(qual.percentage || qual.marksObtained) && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>
                            Score: {qual.percentage ? `${qual.percentage}%` : `${qual.marksObtained}/${qual.totalMarks}`}
                          </span>
                        )}
                      </div>

                      {qual.certificateUrl && !isDocsPrivate ? (
                        <a 
                          href={qual.certificateUrl.startsWith('http') ? qual.certificateUrl : `http://localhost:5000${qual.certificateUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                          <Download size={12} /> Certificate
                        </a>
                      ) : (qual.certificatePrivate || isDocsPrivate) ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                          <Lock size={10} /> Private Document
                        </span>
                      ) : null}
                    </div>
                  );
                })}

                {/* Loop other qualifications */}
                {profile.qualifications?.otherQuals && profile.qualifications.otherQuals.map((oq, idx) => {
                  if (oq.isPrivate) {
                    return (
                      <div key={`other_${idx}`} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
                            Other Qualification: {oq.degree || `Qualification #${idx + 1}`}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={12} /> Uploaded, but privacy is set to private.
                          </span>
                        </div>
                        {oq.certificatePrivate || isDocsPrivate ? (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                            <Lock size={10} /> Private Document
                          </span>
                        ) : oq.certificateUrl ? (
                          <a 
                            href={oq.certificateUrl.startsWith('http') ? oq.certificateUrl : `http://localhost:5000${oq.certificateUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                          >
                            <Download size={12} /> Certificate
                          </a>
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <div key={`other_${idx}`} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
                          Other Qualification: {oq.degree || 'Credential'}
                        </strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                          {oq.examName || oq.degree} | {oq.university || oq.board || 'N/A'} ({oq.passingYear || 'N/A'})
                        </span>
                        {(oq.percentage || oq.marksObtained) && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>
                            Score: {oq.percentage ? `${oq.percentage}%` : `${oq.marksObtained}/${oq.totalMarks}`}
                          </span>
                        )}
                      </div>
                      {oq.certificateUrl && !isDocsPrivate ? (
                        <a 
                          href={oq.certificateUrl.startsWith('http') ? oq.certificateUrl : `http://localhost:5000${oq.certificateUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                          <Download size={12} /> Certificate
                        </a>
                      ) : (oq.certificatePrivate || isDocsPrivate) ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                          <Lock size={10} /> Private Document
                        </span>
                      ) : null}
                    </div>
                  );
                })}

                {/* Loop fellowships */}
                {profile.qualifications?.fellowships && profile.qualifications.fellowships.map((f, idx) => {
                  if (f.isPrivate) {
                    return (
                      <div key={`fellow_${idx}`} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
                            Fellowship: {f.name || `Fellowship #${idx + 1}`}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={12} /> Uploaded, but privacy is set to private.
                          </span>
                        </div>
                        {f.certificatePrivate || isDocsPrivate ? (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                            <Lock size={10} /> Private Document
                          </span>
                        ) : f.certificateUrl ? (
                          <a 
                            href={f.certificateUrl.startsWith('http') ? f.certificateUrl : `http://localhost:5000${f.certificateUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                          >
                            <Download size={12} /> Certificate
                          </a>
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <div key={`fellow_${idx}`} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
                          Fellowship: {f.name}
                        </strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                          Awarding Body: {f.awardingBody || f.organization || 'N/A'} | Year: {f.year || 'N/A'}
                        </span>
                        {f.amount && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>
                            Amount: {f.amount}
                          </span>
                        )}
                      </div>
                      {f.certificateUrl && !isDocsPrivate ? (
                        <a 
                          href={f.certificateUrl.startsWith('http') ? f.certificateUrl : `http://localhost:5000${f.certificateUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                          <Download size={12} /> Certificate
                        </a>
                      ) : (f.certificatePrivate || isDocsPrivate) ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                          <Lock size={10} /> Private Document
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Experience Section */}
            {profile.experience && (profile.experience.length > 0 || profile.experience.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={18} style={{ color: 'var(--color-primary)' }} /> Work Experience
                </h3>
                {profile.experience.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {profile.experience.count || 0} Work experience logged, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profile.experience.map((exp, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                        <Calendar size={16} style={{ color: 'var(--color-primary)', marginTop: '4px', flexShrink: 0 }} />
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>{exp.designation}</strong>
                          <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                            {exp.organization} | {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'N/A'} - {exp.isPresent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'N/A'}
                          </span>
                          {exp.description && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Awards Section */}
            {profile.awards && (profile.awards.length > 0 || profile.awards.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} style={{ color: 'var(--color-primary)' }} /> Honors & Awards
                </h3>
                {profile.awards.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {profile.awards.count || 0} Honor(s) & Award(s) logged, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profile.awards.map((award, idx) => (
                      <div key={idx} style={{ borderBottom: idx < profile.awards.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: '12px' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block' }}>{award.awardName}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', margin: '2px 0' }}>
                          Given by {award.awardingBody} ({award.year})
                        </span>
                        {award.description && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                            {award.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Theses Supervised (For Faculty/HOD) */}
            {profile.thesesSupervised && (profile.thesesSupervised.length > 0 || profile.thesesSupervised.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={18} style={{ color: 'var(--color-primary)' }} /> Ph.D. Theses Guided / Supervised
                </h3>
                {profile.thesesSupervised.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {profile.thesesSupervised.count || 0} Ph.D. Thesis/Theses guided, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profile.thesesSupervised.map((th, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                        <GraduationCap size={18} style={{ color: 'var(--color-primary)', marginTop: '4px', flexShrink: 0 }} />
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>{th.thesisTitle}</strong>
                          <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                            Scholar Name: {th.scholarName} | Status: {th.status || 'Ongoing'} {th.yearOfAward ? `(${th.yearOfAward})` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Projects Section */}
            {profile.projects && (profile.projects.length > 0 || profile.projects.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Folder size={18} style={{ color: 'var(--color-primary)' }} /> Sponsored Projects
                </h3>
                {profile.projects.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {profile.projects.count || 0} Sponsored Project(s) logged, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} style={{ borderBottom: idx < profile.projects.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: '12px' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block' }}>{proj.projectTitle}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', margin: '2px 0' }}>
                          Funding Agency: {proj.fundingAgency} | Role: {proj.role}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>
                          Amount: {proj.amount} | Duration: {proj.duration} | Status: {proj.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Publications Section */}
            {profile.publications && (profile.publications.length > 0 || profile.publications.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={18} style={{ color: 'var(--color-primary)' }} /> Research Publications
                </h3>
                {profile.publications.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {profile.publications.count || 0} Research Publication(s) uploaded, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profile.publications.map((pub, idx) => (
                      <div key={idx} style={{ borderBottom: idx < profile.publications.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: '12px' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block' }}>{pub.title}</strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block', margin: '2px 0' }}>
                          Authors: {pub.authors} | Journal: {pub.journalName} ({pub.year})
                        </span>
                        {pub.doi && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            DOI: {pub.doi}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* IPR Section */}
            {profile.ipr && (profile.ipr.length > 0 || profile.ipr.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Copyright size={18} style={{ color: 'var(--color-primary)' }} /> Intellectual Property Rights (IPR)
                </h3>
                {profile.ipr.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {profile.ipr.count || 0} Intellectual Property Right(s) logged, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profile.ipr.map((ip, idx) => (
                      <div key={idx} style={{ borderBottom: idx < profile.ipr.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: '12px' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'block' }}>{ip.title}</strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block', margin: '2px 0' }}>
                          Type: {ip.iprType || 'Patent'} | Status: {ip.itemStatus} ({ip.journalName})
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block' }}>
                          App/Reg Number: {ip.issn} | Region: {ip.pages}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Professional Memberships Section */}
            {profile.professionalBodies && (profile.professionalBodies.length > 0 || profile.professionalBodies.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={18} style={{ color: 'var(--color-primary)' }} /> Professional Memberships
                </h3>
                {profile.professionalBodies.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {profile.professionalBodies.count || 0} Professional Membership(s) logged, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {profile.professionalBodies.map((mb, idx) => (
                      <div key={idx} style={{ borderBottom: idx < profile.professionalBodies.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: '12px' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>{mb.membershipName || mb.bodyName || mb.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                          {mb.membershipType || mb.role} | {mb.organization || mb.body} ({mb.year || 'N/A'})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Committee Memberships Section */}
            {profile.committees && (profile.committees.length > 0 || profile.committees.isPrivate) && (
              <div className="glass-panel" style={{ borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bookmark size={18} style={{ color: 'var(--color-primary)' }} /> Committee Memberships
                </h3>
                {profile.committees.isPrivate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
                    <Lock size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {profile.committees.count || 0} Committee Membership(s) logged, but privacy is set to private.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {profile.committees.map((ct, idx) => (
                      <div key={idx} style={{ borderBottom: idx < profile.committees.length - 1 ? '1px solid var(--color-border)' : 'none', paddingBottom: '12px' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>{ct.committeeName || ct.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                          {ct.role || 'Member'} | {ct.organization || ct.body} ({ct.year || 'N/A'})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '30px 8%', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', zIndex: 1 }}>
        <p>© 2026 Himachal Pradesh University. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default RepositoryProfile;
