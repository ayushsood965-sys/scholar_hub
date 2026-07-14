import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL, API_BASE_URL } from '../config';
import { 
  Atom, 
  Cpu, 
  Dna, 
  FlaskConical, 
  Users, 
  FileText, 
  Coins, 
  Calendar, 
  Search, 
  Sparkles, 
  BookOpen, 
  Send 
} from 'lucide-react';

const GenericPage = ({ title, description }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';

  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  // Real database states
  const [labs, setLabs] = useState([]);
  const [publications, setPublications] = useState([]);
  const [funding, setFunding] = useState([]);
  const [events, setEvents] = useState([]);
  const [collabCalls, setCollabCalls] = useState([]);
  const [stats, setStats] = useState({ scholars: 0, guides: 0, publications: 0, awardedDegrees: 0, departments: 0 });
  const [loading, setLoading] = useState(true);

  // Collaboration form states
  const [collabForm, setCollabForm] = useState({ name: '', email: '', institution: '', project: '', details: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (title === 'Research Labs' || title === 'Search Results') {
          const res = await axios.get(`${API_URL}/public/labs`);
          setLabs(res.data);
        }
        if (title === 'Publications' || title === 'Search Results') {
          const res = await axios.get(`${API_URL}/public/publications`);
          setPublications(res.data);
        }
        if (title === 'Funding' || title === 'Search Results') {
          const res = await axios.get(`${API_URL}/public/funding`);
          setFunding(res.data);
        }
        if (title === 'Events' || title === 'Search Results') {
          const res = await axios.get(`${API_URL}/public/events`);
          setEvents(res.data);
        }
        if (title === 'Collaborate' || title === 'Search Results') {
          const res = await axios.get(`${API_URL}/public/collab-calls`);
          setCollabCalls(res.data);
        }
        if (title === 'About') {
          const res = await axios.get(`${API_URL}/public/stats`);
          setStats(res.data);
        }
      } catch (err) {
        console.error(`Error loading data for ${title}:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [title]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    setSearchQuery(q);
  }, [location.search]);
  
  const handleCollabSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await axios.post(`${API_URL}/public/collaborate/inquiry`, collabForm);
      setFormSubmitted(true);
      setCollabForm({ name: '', email: '', institution: '', project: '', details: '' });
      setTimeout(() => setFormSubmitted(false), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    }
  };

  const handleCopyDOI = (doi, index) => {
    navigator.clipboard.writeText(doi);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getLabIcon = (labName = '') => {
    const name = labName.toLowerCase();
    if (name.includes('neural') || name.includes('ai') || name.includes('comput') || name.includes('software')) return Cpu;
    if (name.includes('quantum') || name.includes('mechanic') || name.includes('phys')) return Atom;
    if (name.includes('bio') || name.includes('genomic') || name.includes('medic') || name.includes('protein')) return Dna;
    return FlaskConical;
  };

  const renderRichContent = () => {
    if (loading) {
      return (
        <div className="premium-preloader-container" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="premium-preloader-spinner"></div>
          <div className="premium-preloader-text">Fetching data from ScholarSync registry...</div>
        </div>
      );
    }

    switch (title) {
      case "Research Labs":
        const filteredLabs = selectedDept === 'All' 
          ? labs 
          : labs.filter(lab => lab.department === selectedDept);
        const availableDepts = ['All', ...new Set(labs.map(lab => lab.department))];

        return (
          <div>
            {/* Department Filters */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
              {availableDepts.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`btn-outline-small ${selectedDept === dept ? 'active' : ''}`}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '20px',
                    borderColor: selectedDept === dept ? '#133A26' : '#D1D5DB',
                    background: selectedDept === dept ? '#133A26' : 'rgba(255,255,255,0.6)',
                    color: selectedDept === dept ? 'white' : '#4B5563',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  {dept === 'All' ? 'All Departments' : dept.replace('Department of ', '')}
                </button>
              ))}
            </div>

            {/* Labs Grid */}
            {filteredLabs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No research labs registered for this department.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredLabs.map(lab => {
                  const LabIcon = getLabIcon(lab.name);
                  return (
                    <div key={lab._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.4)', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: '#EAF4EE', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#133A26', flexShrink: 0 }}>
                          <LabIcon size={26} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#133A26', margin: 0 }}>{lab.name}</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{lab.department}</p>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                        <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '8px' }}>
                          <strong>Lead Principal Investigator:</strong> {lab.leadId?.name || 'Faculty Lead'}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '12px' }}>
                          <strong>Research Focus:</strong> {lab.focus}
                        </p>
                        
                        {lab.projects && lab.projects.length > 0 && (
                          <>
                            <strong style={{ fontSize: '0.8rem', color: '#133A26', display: 'block', marginBottom: '6px' }}>Active Projects:</strong>
                            <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                              {lab.projects.map((proj, idx) => <li key={idx}>{proj}</li>)}
                            </ul>
                          </>
                        )}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
                        <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>{lab.status}</span>
                        <a href={`mailto:${lab.leadId?.username || 'admin@hpu.ac.in'}?subject=Inquiry regarding ${lab.name}`} className="btn-outline-small" style={{ fontSize: '0.75rem', padding: '6px 12px', textDecoration: 'none' }}>Inquire ➔</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "Publications":
        const filteredPubs = searchQuery 
          ? publications.filter(pub => 
              pub.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (pub.scholarId?.name && pub.scholarId.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
              pub.journalName.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : publications;

        return (
          <div>
            {/* Search Bar */}
            <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto 32px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search publications by title, author, or journal..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', borderRadius: '24px', background: 'var(--color-surface)' }}
              />
              <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '15px' }} />
            </div>

            {/* Publications List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredPubs.map((pub, idx) => (
                <div key={pub._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', background: '#EAF4EE', color: '#133A26', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                      {pub.type || 'JOURNAL'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={14} /> Published: <strong>{new Date(pub.publicationDate).toLocaleDateString()}</strong>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', lineHeight: '1.4', margin: 0 }}>
                    {pub.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    <strong>Authors:</strong> {pub.scholarId?.name || 'Academic Scholar'}, {pub.thesisId?.supervisorId?.name || 'Faculty Guide'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E5E7EB', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                        <strong>Journal/Conference:</strong> {pub.journalName} {pub.issn ? `(ISSN: ${pub.issn})` : ''}
                      </p>
                      {pub.doiUrl && (
                        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px', marginBotom: 0 }}>
                          DOI Link: <a href={pub.doiUrl} target="_blank" rel="noreferrer" style={{ color: '#133A26', textDecoration: 'none' }}>{pub.doiUrl}</a>
                          <button 
                            onClick={() => handleCopyDOI(pub.doiUrl, idx)} 
                            style={{ background: 'none', border: 'none', color: '#133A26', cursor: 'pointer', paddingLeft: '8px', fontWeight: 600 }}
                          >
                            {copiedIndex === idx ? '✓ Copied!' : '📋 Copy Link'}
                          </button>
                        </p>
                      )}
                    </div>
                    {pub.documentUrl && (
                      <a 
                        href={`${API_BASE_URL}${pub.documentUrl}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-primary" 
                        style={{ padding: '6px 16px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                      >
                        📥 View PDF Proof
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {filteredPubs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>No publications found matching your search.</div>
              )}
            </div>
          </div>
        );

      case "Collaborate":
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
            {/* Info & Opportunities */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#133A26', marginBottom: '16px', marginTop: 0 }}>Active Collaboration Calls</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
                ScholarSync is built to nurture global academic-industry integrations. We actively seek joint doctoral guides, industry project sponsorships, and collaborative research initiatives.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {collabCalls.length === 0 ? (
                  <div style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                    No active collaboration calls listed at this time.
                  </div>
                ) : (
                  collabCalls.map((call) => {
                    const isIndustry = (call.type || '').toLowerCase().includes('industry') || (call.type || '').toLowerCase().includes('mentor');
                    const bg = isIndustry ? '#FFF3CD' : '#E0F2FE';
                    const border = isIndustry ? '4px solid #D97706' : '4px solid #2563EB';
                    const titleColor = isIndustry ? '#92400E' : '#1E40AF';
                    const textColor = isIndustry ? '#78350F' : '#1E3A8A';
                    const emoji = isIndustry ? '🔴' : '🔵';

                    return (
                      <div key={call._id} style={{ background: bg, borderLeft: border, padding: '16px', borderRadius: '8px' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: titleColor, margin: '0 0 4px' }}>
                          {emoji} {call.title}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: textColor, margin: 0 }}>
                          {call.description}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Collaboration Request Form */}
            <div className="card" style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#133A26', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} /> Partner Inquiry Form
              </h3>

              {formSubmitted ? (
                <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '20px', borderRadius: '8px', textAlign: 'center', margin: '20px 0' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '6px', marginTop: 0 }}>✨ Submission Received!</h4>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>Thank you for expressing interest. Our research board will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleCollabSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {formError && (
                    <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                      {formError}
                    </div>
                  )}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Your Name / Title</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={collabForm.name} 
                      onChange={e => setCollabForm({...collabForm, name: e.target.value})} 
                      style={{ fontSize: '0.85rem', padding: '10px 14px' }} 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Email</label>
                      <input 
                        type="email" 
                        required 
                        className="form-input" 
                        value={collabForm.email} 
                        onChange={e => setCollabForm({...collabForm, email: e.target.value})} 
                        style={{ fontSize: '0.85rem', padding: '10px 14px' }} 
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Organization</label>
                      <input 
                        type="text" 
                        required 
                        className="form-input" 
                        value={collabForm.institution} 
                        onChange={e => setCollabForm({...collabForm, institution: e.target.value})} 
                        style={{ fontSize: '0.85rem', padding: '10px 14px' }} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Focus Subject / Project Title</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="e.g. Molecular Design Collaboration" 
                      value={collabForm.project} 
                      onChange={e => setCollabForm({...collabForm, project: e.target.value})} 
                      style={{ fontSize: '0.85rem', padding: '10px 14px' }} 
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Brief Proposal Details</label>
                    <textarea 
                      required 
                      rows={4} 
                      className="form-input" 
                      placeholder="Explain how you would like to collaborate..."
                      value={collabForm.details} 
                      onChange={e => setCollabForm({...collabForm, details: e.target.value})} 
                      style={{ fontSize: '0.85rem', padding: '10px 14px', resize: 'none', fontFamily: 'inherit' }} 
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '10px', marginTop: '6px', fontSize: '0.9rem' }}>
                    Send Collaboration Request ➔
                  </button>
                </form>
              )}
            </div>
          </div>
        );

      case "Funding":
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Static Metrics Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#133A26' }}>₹5.2 Crores</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'center', fontWeight: 600 }}>Active Funding Pool</div>
              </div>
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>18 Scholars</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'center', fontWeight: 600 }}>Active Grants Supported</div>
              </div>
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB' }}>8 Partners</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'center', fontWeight: 600 }}>Corporate Sponsors</div>
              </div>
            </div>

            {/* Grants List */}
            {funding.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No active funding opportunities registered.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {funding.map(grant => (
                  <div key={grant._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                        {grant.status}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#133A26' }}>
                        {grant.amount}
                      </span>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{grant.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}><strong>Agency:</strong> {grant.agency}</p>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
                      {grant.scope}
                    </p>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <strong>Duration:</strong> {grant.duration}
                      </span>
                      <a href={`mailto:grants@hpu.ac.in?subject=Application Inquiry: ${grant.title}`} className="btn-outline-small" style={{ fontSize: '0.75rem', padding: '6px 14px', textDecoration: 'none' }}>Apply/Explore ➔</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "Events":
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No academic events scheduled currently.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {events.map(evt => (
                  <div key={evt._id} className="card" style={{ display: 'flex', gap: '20px', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px', flexWrap: 'wrap' }}>
                    {/* Styled Date Calendar Icon */}
                    <div style={{ width: '80px', height: '80px', background: evt.type === 'Defense Viva' ? '#D97706' : '#133A26', color: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={24} style={{ marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', textAlign: 'center' }}>
                        {evt.type ? evt.type.replace(' ', '\n') : 'EVENT'}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', lineHeight: '1.4', margin: 0 }}>
                        {evt.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, margin: 0 }}>
                        📅 {new Date(evt.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} &nbsp;|&nbsp; 🕒 {evt.time}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        📍 <strong>Venue:</strong> {evt.location}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                        👤 {evt.speaker}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                      <a href={`mailto:events@hpu.ac.in?subject=Registration RSVP: ${evt.title}`} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem', textDecoration: 'none' }}>
                        RSVP Slot
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "About":
        return (
          <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Introduction */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#133A26', marginBottom: '12px', marginTop: 0 }}>Empowering the Next Generation of Academicians</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '700px', margin: '0 auto' }}>
                ScholarSync is an integrated thesis tracking and research management ecosystem designed to streamline, automate, and orchestrate the complete academic lifecycle of Ph.D. scholars, faculty supervisors, and administrative heads at HPU.
              </p>
            </div>

            {/* Lifecycle Timeline */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#133A26', marginBottom: '24px', textAlign: 'center', marginTop: 0 }}>
                🎓 Ph.D. Scholar Journey Milestones
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '30px' }}>
                <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '2px', background: '#A5D6A7' }} />

                {[
                  { title: "Stage 1: Thesis Registration", desc: "Scholar submits detailed research title, scope, and initial proposal. Reviewed and approved by Department HOD." },
                  { title: "Stage 2: Supervisor Assignment", desc: "HOD delegates a certified Faculty Supervisor matching the scholar's research area of interest." },
                  { title: "Stage 3: Coursework Phase", desc: "Scholar undertakes mandatory doctoral course credits, evaluated by the supervisor upon successful completion." },
                  { title: "Stage 4: Active Research & DRC Approval", desc: "Departmental Research Committee (DRC) approves the primary research synopsis, unlocking full dissertation creation." },
                  { title: "Stage 5: Pre-Submission Seminar", desc: "Scholar defends preliminary thesis findings in a public university-wide pre-submission presentation." },
                  { title: "Stage 6: External Thesis Evaluation", desc: "Completed dissertation is securely dispatched to high-profile external subject matter expert examiners." },
                  { title: "Stage 7: Degree Awarded!", desc: "Upon receiving satisfactory external review reports, the final Viva-Voce defense is cleared, and the doctorate degree is officially awarded." }
                ].map((stage, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-25px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#133A26', border: '3px solid #EAF4EE' }} />
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#133A26', margin: '0 0 4px' }}>{stage.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>{stage.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Advantages */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Absolute Transparency', desc: 'Real-time timeline progression charts accessible by supervisors, scholars, and department heads alike.' },
                { title: 'Secure Audited Files', desc: 'Secure repository for uploading coursework sheets, RAC review slides, synopsis documents, and external reviews.' },
                { title: 'Automated Reminders', desc: 'Dynamic alert systems to keep candidates informed about upcoming milestones, vivas, and DRC deadlines.' }
              ].map((feat, idx) => (
                <div key={idx} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.85)', borderRadius: '12px' }}>
                  <div style={{ color: '#133A26', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} />
                    <strong style={{ fontSize: '0.95rem' }}>{feat.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "Search Results":
        const term = searchQuery.toLowerCase();
        
        const matchingLabs = labs.filter(lab => 
          lab.name.toLowerCase().includes(term) || 
          lab.department.toLowerCase().includes(term) || 
          lab.focus.toLowerCase().includes(term)
        );

        const matchingPubs = publications.filter(pub => 
          pub.title.toLowerCase().includes(term) || 
          (pub.scholarId?.name && pub.scholarId.name.toLowerCase().includes(term)) ||
          pub.journalName.toLowerCase().includes(term)
        );

        const matchingFunding = funding.filter(grant => 
          grant.title.toLowerCase().includes(term) || 
          grant.agency.toLowerCase().includes(term) || 
          grant.scope.toLowerCase().includes(term)
        );

        const matchingEvents = events.filter(evt => 
          evt.title.toLowerCase().includes(term) || 
          (evt.location && evt.location.toLowerCase().includes(term)) || 
          (evt.speaker && evt.speaker.toLowerCase().includes(term))
        );

        const totalResults = matchingLabs.length + matchingPubs.length + matchingFunding.length + matchingEvents.length;

        return (
          <div>
            {/* Search Input on Results Page */}
            <div style={{ position: 'relative', maxWidth: '520px', margin: '0 auto 24px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search everything..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', borderRadius: '24px', background: 'var(--color-surface)' }}
              />
              <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '15px' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
              Found {totalResults} matching results for "{searchQuery}"
            </div>

            {totalResults === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px', color: '#9CA3AF' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ margin: 0 }}>No results found</h3>
                <p style={{ fontSize: '0.85rem', marginTop: '6px', marginBottom: 0 }}>Try adjusting your search terms or checking another keyword.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* 1. Research Labs */}
                {matchingLabs.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#133A26', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px', marginTop: 0 }}>
                      🔬 Matching Research Labs ({matchingLabs.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                      {matchingLabs.map(lab => {
                        const LabIcon = getLabIcon(lab.name);
                        return (
                          <div key={lab._id} className="card" style={{ padding: '20px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <div style={{ background: '#EAF4EE', padding: '8px', borderRadius: '8px', color: '#133A26', flexShrink: 0 }}>
                                <LabIcon size={20} />
                              </div>
                              <div>
                                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#133A26', margin: 0 }}>{lab.name}</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{lab.department}</p>
                              </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '10px', marginBottom: 0 }}><strong>PI Lead:</strong> {lab.leadId?.name || 'Faculty Lead'}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>{lab.focus}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Publications */}
                {matchingPubs.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#133A26', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px', marginTop: 0 }}>
                      📄 Matching Publications ({matchingPubs.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {matchingPubs.map(pub => (
                        <div key={pub._id} className="card" style={{ padding: '20px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.7rem', background: '#EAF4EE', color: '#133A26', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, display: 'inline-block', marginBottom: '8px' }}>{pub.type || 'JOURNAL'}</span>
                          <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: 0 }}>{pub.title}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '6px', marginBottom: 0 }}><strong>Authors:</strong> {pub.scholarId?.name || 'Scholar'}, {pub.thesisId?.supervisorId?.name || 'Faculty Guide'}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{pub.journalName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Funding & Opportunities */}
                {matchingFunding.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#133A26', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px', marginTop: 0 }}>
                      💰 Matching Funding & Grants ({matchingFunding.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                      {matchingFunding.map(grant => (
                        <div key={grant._id} className="card" style={{ padding: '20px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.7rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{grant.status}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#133A26' }}>{grant.amount}</span>
                          </div>
                          <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', margin: 0 }}>{grant.title}</h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px', marginBottom: 0 }}>{grant.scope}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Events */}
                {matchingEvents.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#133A26', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px', marginTop: 0 }}>
                      📆 Matching Academic Events ({matchingEvents.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {matchingEvents.map(evt => (
                        <div key={evt._id} className="card" style={{ padding: '20px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: evt.type === 'Defense Viva' ? '#D97706' : '#133A26', color: 'white', padding: '10px 14px', borderRadius: '8px', minWidth: '70px', height: '60px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{evt.type || 'Seminar'}</span>
                          </div>
                          <div>
                            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', margin: 0 }}>{evt.title}</h4>
                            <p style={{ fontSize: '0.8rem', color: '#374151', marginTop: '4px', marginBottom: 0 }}>{new Date(evt.date).toLocaleDateString()} | {evt.time}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', marginBottom: 0 }}>{evt.speaker}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            This section is currently under development. Please check back later.
          </div>
        );
    }
  };

  return (
    <div className="subpage-container">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      <Navbar />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Dynamic Main Header Panel */}
        <div 
          className="glass-panel" 
          style={{ 
            maxWidth: title === 'About' || title === 'Events' ? '850px' : '1100px', 
            margin: '40px auto 20px', 
            padding: '40px 30px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>{title}</h1>
            <p className="page-desc" style={{ maxWidth: '650px', margin: '0 auto', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>{description}</p>
          </div>
          
          {/* Dynamic Rich Content Area */}
          <div style={{ borderTop: '1px solid rgba(19, 58, 38, 0.1)', paddingTop: '32px' }}>
            {renderRichContent()}
          </div>
        </div>
      </div>

      {/* Reusable Consolidated Footer */}
      <Footer />
    </div>
  );
};

export default GenericPage;
