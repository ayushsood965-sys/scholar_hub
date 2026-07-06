import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL } from '../config';
import { 
  Search, 
  Coins, 
  Calendar, 
  ExternalLink,
  Award,
  Layers,
  Sparkles,
  Briefcase
} from 'lucide-react';

const FundingPage = () => {
  const [funding, setFunding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('All');

  useEffect(() => {
    const fetchFunding = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/funding`);
        setFunding(res.data || []);
      } catch (err) {
        console.error('Error fetching funding opportunities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFunding();
  }, []);

  const filteredFunding = funding.filter(grant => {
    const matchesAgency = selectedAgency === 'All' || grant.agency === selectedAgency;
    const matchesSearch = searchQuery === '' || 
      grant.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      grant.scope.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.agency.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAgency && matchesSearch;
  });

  const availableAgencies = ['All', ...new Set(funding.map(g => g.agency).filter(Boolean))];

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
            <h1 className="page-title" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#133A26', marginBottom: '12px' }}>Grants & Funding</h1>
            <p className="page-desc" style={{ maxWidth: '700px', margin: '0 auto 30px', fontSize: '1.05rem', color: '#4B5563' }}>
              Discover doctoral fellowship schemes, corporate project sponsorships, travel grants, and academic research funding pools.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#133A26' }}>₹5.2 Crores</div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px', fontWeight: 600 }}>Active Funding Pool</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>18 Scholars</div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px', fontWeight: 600 }}>Active Fellowships Supported</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB' }}>8 Partners</div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px', fontWeight: 600 }}>Corporate & Agency Sponsors</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderTop: '1px solid rgba(19,58,38,0.1)', paddingTop: '32px', marginBottom: '32px' }}>
            <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search grants by agency, keyword, or scope..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', borderRadius: '24px', background: 'white', border: '1px solid #D1D5DB' }}
              />
              <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '15px' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ alignSelf: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#6B7280', marginRight: '6px' }}>Agencies:</span>
              {availableAgencies.map(agency => (
                <button
                  key={agency}
                  onClick={() => setSelectedAgency(agency)}
                  className={`btn-outline-small ${selectedAgency === agency ? 'active' : ''}`}
                  style={{ 
                    padding: '6px 14px', 
                    borderRadius: '20px',
                    borderColor: selectedAgency === agency ? '#133A26' : '#E5E7EB',
                    background: selectedAgency === agency ? '#133A26' : 'transparent',
                    color: selectedAgency === agency ? 'white' : '#6B7280',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {agency === 'All' ? 'All Agencies' : agency}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content */}
          {loading ? (
            <div className="premium-preloader-container" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="premium-preloader-spinner"></div>
              <div className="premium-preloader-text">Loading funding opportunities...</div>
            </div>
          ) : filteredFunding.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              No funding opportunities matched your criteria.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
              {filteredFunding.map(grant => (
                <div key={grant._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
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
                    <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: 0 }}><strong>Agency:</strong> {grant.agency}</p>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: '#4B5563', lineHeight: '1.5', margin: 0, flex: 1 }}>
                    {grant.scope}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px', marginTop: '12px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> <strong>Duration:</strong> {grant.duration}
                    </span>
                    <a href={`mailto:grants@hpu.ac.in?subject=Application Inquiry: ${grant.title}`} className="btn-outline-small" style={{ fontSize: '0.78rem', padding: '6px 14px', textDecoration: 'none' }}>Apply/Explore ➔</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FundingPage;
