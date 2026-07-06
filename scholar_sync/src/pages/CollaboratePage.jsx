import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL } from '../config';
import { 
  Send, 
  Users, 
  Briefcase, 
  CheckCircle, 
  Sparkles,
  Link,
  ChevronRight
} from 'lucide-react';

const CollaboratePage = () => {
  const [collabCalls, setCollabCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collabForm, setCollabForm] = useState({ name: '', email: '', institution: '', project: '', details: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchCollabs = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/collab-calls`);
        setCollabCalls(res.data || []);
      } catch (err) {
        console.error('Error fetching collaboration calls:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollabs();
  }, []);

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

  return (
    <div className="subpage-container">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      <Navbar />

      <div style={{ flex: 1, padding: '40px 20px' }}>
        <div className="glass-panel" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 className="page-title" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#133A26', marginBottom: '12px' }}>Research Collaboration</h1>
            <p className="page-desc" style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.05rem', color: '#4B5563' }}>
              Bridge the gap between academia, industry, and external laboratories. Propose joint ventures, sponsored doctorates, and technology transfer MoUs.
            </p>
          </div>

          {/* Collaboration Onboarding Flow Indicator */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.6)', 
            border: '1px solid rgba(19, 58, 38, 0.1)', 
            padding: '20px', 
            borderRadius: '12px', 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px',
            marginBottom: '40px'
          }}>
            {[
              { step: '1', title: 'Submit Inquiry', desc: 'Detail your proposal/project outline.' },
              { step: '2', title: 'Advisory Review', desc: 'Faculty Board evaluates target synergy.' },
              { step: '3', title: 'MoU & Kickoff', desc: 'Formalize agreement and start research.' }
            ].map((st, idx) => (
              <React.Fragment key={st.step}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '240px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    background: '#133A26', 
                    color: 'white', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}>
                    {st.step}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#133A26', display: 'block' }}>{st.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{st.desc}</span>
                  </div>
                </div>
                {idx < 2 && <ChevronRight size={20} color="#A5D6A7" style={{ display: 'none', display: 'block' }} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
            {/* Info & Opportunities */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#133A26', marginBottom: '16px', marginTop: 0 }}>Active Collaboration Calls</h2>
              <p style={{ color: '#4B5563', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '24px' }}>
                ScholarSync is built to nurture global academic-industry integrations. We actively seek joint doctoral guides, industry project sponsorships, and collaborative research initiatives.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                  <div className="premium-preloader-container" style={{ padding: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="premium-preloader-spinner"></div>
                    <div className="premium-preloader-text">Loading opportunities...</div>
                  </div>
                ) : collabCalls.length === 0 ? (
                  <div style={{ padding: '20px', color: '#6B7280', fontSize: '0.85rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                    No active collaboration calls listed at this time.
                  </div>
                ) : (
                  collabCalls.map((call) => {
                    const isIndustry = (call.type || '').toLowerCase().includes('industry') || (call.type || '').toLowerCase().includes('mentor');
                    const bg = isIndustry ? '#FFF3CD' : '#E0F2FE';
                    const border = isIndustry ? '4px solid #D97706' : '4px solid #2563EB';
                    const titleColor = isIndustry ? '#92400E' : '#1E40AF';
                    const textColor = isIndustry ? '#78350F' : '#1E3A8A';
                    const emoji = isIndustry ? '🏭' : '🎓';

                    return (
                      <div key={call._id} style={{ background: bg, borderLeft: border, padding: '16px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: titleColor, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{emoji}</span> {call.title}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: textColor, margin: 0, lineHeight: '1.4' }}>
                          {call.description}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Collaboration Request Form */}
            <div className="card" style={{ background: 'white', borderRadius: '16px', padding: '30px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#133A26', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} /> Partner Inquiry Form
              </h3>

              {formSubmitted ? (
                <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '24px', borderRadius: '8px', textAlign: 'center', margin: '20px 0' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '6px', marginTop: 0 }}>✨ Submission Received!</h4>
                  <p style={{ fontSize: '0.88rem', margin: 0 }}>Thank you for expressing interest. Our research board will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleCollabSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {formError && (
                    <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                      {formError}
                    </div>
                  )}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Your Name / Title</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={collabForm.name} 
                      onChange={e => setCollabForm({...collabForm, name: e.target.value})} 
                      style={{ fontSize: '0.88rem', padding: '10px 14px' }} 
                    />
                  </div>
                  
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                    <input 
                      type="email" 
                      required 
                      className="form-input" 
                      value={collabForm.email} 
                      onChange={e => setCollabForm({...collabForm, email: e.target.value})} 
                      style={{ fontSize: '0.88rem', padding: '10px 14px' }} 
                    />
                  </div>
                  
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Organization / Institution</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      value={collabForm.institution} 
                      onChange={e => setCollabForm({...collabForm, institution: e.target.value})} 
                      style={{ fontSize: '0.88rem', padding: '10px 14px' }} 
                    />
                  </div>
                  
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Subject Focus / Project Title</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="e.g. Joint PhD Mentoring Call" 
                      value={collabForm.project} 
                      onChange={e => setCollabForm({...collabForm, project: e.target.value})} 
                      style={{ fontSize: '0.88rem', padding: '10px 14px' }} 
                    />
                  </div>
                  
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Brief Proposal Details</label>
                    <textarea 
                      required 
                      rows={4} 
                      className="form-input" 
                      placeholder="Detail your requirements, project scope, or guidance parameters..."
                      value={collabForm.details} 
                      onChange={e => setCollabForm({...collabForm, details: e.target.value})} 
                      style={{ fontSize: '0.88rem', padding: '10px 14px', resize: 'none', fontFamily: 'inherit' }} 
                    />
                  </div>
                  
                  <button type="submit" className="btn-primary" style={{ padding: '10px', marginTop: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    Send Collaboration Inquiry ➔
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CollaboratePage;
