import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL } from '../config';
import { 
  Search, Coins, Calendar, ExternalLink, Award, Layers, 
  Sparkles, Briefcase, Mail, Info, FileText, AlertCircle, Clock
} from 'lucide-react';

const FundingPage = () => {
  const [funding, setFunding] = useState([]);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    activeFellowshipsCount: 0,
    totalActivePool: '₹5.2 Crores',
    activeAwardsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBody, setSelectedBody] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedGrant, setSelectedGrant] = useState(null);

  useEffect(() => {
    const fetchFundingData = async () => {
      try {
        const [fundingRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/public/funding`),
          axios.get(`${API_URL}/public/funding/stats`)
        ]);
        setFunding(fundingRes.data || []);
        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error('Error fetching funding data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFundingData();
  }, []);

  const filteredFunding = funding.filter(grant => {
    const matchesSearch = searchQuery === '' || 
      grant.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      grant.scope.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.agency.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'All' || grant.type === selectedType;
    
    const matchesBody = selectedBody === 'All' || grant.fundingBody === selectedBody;
    
    const matchesDept = selectedDept === 'All' || 
      !grant.eligibilityDepartments || 
      grant.eligibilityDepartments.length === 0 || 
      grant.eligibilityDepartments.some(d => d.toLowerCase().includes(selectedDept.toLowerCase()));
      
    return matchesSearch && matchesType && matchesBody && matchesDept;
  });

  const availableTypes = ['All', 'Fellowship', 'Project Grant', 'Travel Grant', 'Infrastructure', 'State Scholarship', 'Industry Sponsorship'];
  const availableBodies = ['All', ...new Set(funding.map(g => g.fundingBody).filter(Boolean))];
  const availableDepts = ['All', ...new Set(funding.flatMap(g => g.eligibilityDepartments || []).filter(Boolean))];

  const getDaysLeft = (dateString) => {
    if (!dateString) return null;
    const deadline = new Date(dateString);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <div className="glass-panel" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
          
          {/* Header Stats */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 className="page-title" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#133A26', marginBottom: '12px' }}>Grants & Funding Portal</h1>
            <p className="page-desc" style={{ maxWidth: '700px', margin: '0 auto 30px', fontSize: '1.05rem', color: 'var(--color-text-secondary)' }}>
              Explore active research fellowships, state grants, and industrial sponsorships supporting Himachal Pradesh University scholars.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#133A26' }}>{stats.totalActivePool || '₹5.2 Crores'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 600 }}>Active Funding Pool</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>{stats.activeFellowshipsCount || 18} Scholars</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 600 }}>Active Fellowships Supported</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB' }}>{stats.totalOpportunities || 6} Schemes</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px', fontWeight: 600 }}>Seeded Funding Paths</div>
              </div>
            </div>
          </div>

          {/* Search and Advanced Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(19,58,38,0.1)', paddingTop: '32px', marginBottom: '32px' }}>
            <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search grants by agency, keyword, or scope..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', borderRadius: '24px', background: 'var(--color-surface)', border: '1px solid #D1D5DB' }}
              />
              <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '15px' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Type:</span>
                <select className="form-input" style={{ width: '150px', padding: '4px 8px', borderRadius: '8px' }} value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                  {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Funding Body:</span>
                <select className="form-input" style={{ width: '150px', padding: '4px 8px', borderRadius: '8px' }} value={selectedBody} onChange={e => setSelectedBody(e.target.value)}>
                  {availableBodies.map(b => <option key={b} value={b}>{b === 'All' ? 'All Bodies' : b}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Eligibility:</span>
                <select className="form-input" style={{ width: '180px', padding: '4px 8px', borderRadius: '8px' }} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                  {availableDepts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d.replace('Department of ', '')}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Content */}
          {loading ? (
            <div className="premium-preloader-container" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="premium-preloader-spinner"></div>
              <div className="premium-preloader-text">Loading funding opportunities...</div>
            </div>
          ) : filteredFunding.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              No funding opportunities matched your criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
              {filteredFunding.map(grant => {
                const daysLeft = getDaysLeft(grant.deadline);
                return (
                  <div key={grant._id} className="card hover-trigger" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setSelectedGrant(grant)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                        {grant.status || 'OPEN'}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#133A26', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Coins size={16} /> {grant.amount}
                      </span>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', margin: '0 0 6px', lineHeight: '1.4' }}>{grant.title}</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}><strong>Agency:</strong> {grant.agency}</p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.65rem', background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: '8px' }}>{grant.type}</span>
                        <span style={{ fontSize: '0.65rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '8px' }}>Body: {grant.fundingBody}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {grant.scope}
                    </p>

                    {daysLeft !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: daysLeft <= 7 ? '#EF4444' : daysLeft <= 30 ? '#D97706' : '#059669', fontWeight: 600 }}>
                        <Clock size={14} />
                        {daysLeft <= 0 ? 'Deadline Passed' : daysLeft === 1 ? '1 day left!' : `${daysLeft} days left to apply`}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px', marginTop: '12px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} /> <strong>Duration:</strong> {grant.duration}
                      </span>
                      <button className="btn-outline-small" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>View Details ➔</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grant Details Modal */}
      {selectedGrant && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>{selectedGrant.status}</span>
                <span style={{ fontSize: '0.7rem', background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: '8px', marginLeft: '6px' }}>{selectedGrant.type}</span>
                <h3 style={{ marginTop: '8px', marginBottom: 4, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{selectedGrant.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Agency: {selectedGrant.agency} ({selectedGrant.fundingBody})</p>
              </div>
              <button onClick={() => setSelectedGrant(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94A3B8', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <strong style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>Stipend/Amount Pool</strong>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#133A26' }}>{selectedGrant.amount}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>Duration</strong>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#133A26' }}>{selectedGrant.duration} ({selectedGrant.recurrence || 'One-time'})</span>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Scheme Description</strong>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{selectedGrant.scope}</p>
              </div>

              {selectedGrant.eligibilityCriteria && (
                <div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Eligibility Criteria</strong>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{selectedGrant.eligibilityCriteria}</p>
                </div>
              )}

              {selectedGrant.eligibilityDepartments && selectedGrant.eligibilityDepartments.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Applicable Departments</strong>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {selectedGrant.eligibilityDepartments.map(d => (
                      <span key={d} style={{ fontSize: '0.72rem', background: '#F0FDF4', border: '1px solid #DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '12px' }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedGrant.documentsRequired && selectedGrant.documentsRequired.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Documents Required for Application</strong>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {selectedGrant.documentsRequired.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedGrant.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', color: '#991B1B' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: '0.85rem' }}>
                    <strong>Application Deadline:</strong> {new Date(selectedGrant.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button onClick={() => setSelectedGrant(null)} className="btn-outline" style={{ flex: 1 }}>Close Details</button>
                {selectedGrant.applicationUrl ? (
                  <a href={selectedGrant.applicationUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: 'white' }}>
                    Apply Online <ExternalLink size={16} />
                  </a>
                ) : (
                  <a href={`mailto:${selectedGrant.contactEmail || 'grants@hpu.ac.in'}?subject=Application Inquiry: ${selectedGrant.title}`} className="btn-primary" style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: 'white' }}>
                    Email Inquiry <Mail size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default FundingPage;
