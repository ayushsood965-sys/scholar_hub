import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL } from '../config';
import { 
  Atom, 
  Cpu, 
  Dna, 
  FlaskConical, 
  Search, 
  Users, 
  Layers, 
  Beaker 
} from 'lucide-react';

const ResearchLabsPage = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/labs`);
        setLabs(res.data || []);
      } catch (err) {
        console.error('Error fetching research labs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, []);

  const getLabIcon = (labName = '') => {
    const name = labName.toLowerCase();
    if (name.includes('neural') || name.includes('ai') || name.includes('comput') || name.includes('software')) return Cpu;
    if (name.includes('quantum') || name.includes('mechanic') || name.includes('phys')) return Atom;
    if (name.includes('bio') || name.includes('genomic') || name.includes('medic') || name.includes('protein')) return Dna;
    return FlaskConical;
  };

  const filteredLabs = labs.filter(lab => {
    const matchesDept = selectedDept === 'All' || lab.department === selectedDept;
    const matchesSearch = searchQuery === '' || 
      lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.focus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.leadId?.name && lab.leadId.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  const availableDepts = ['All', ...new Set(labs.map(lab => lab.department))];

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
            <h1 className="page-title" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#133A26', marginBottom: '12px' }}>Research Labs</h1>
            <p className="page-desc" style={{ maxWidth: '700px', margin: '0 auto 30px', fontSize: '1.05rem', color: '#4B5563' }}>
              Explore state-of-the-art departmental laboratories, facilities, and principal research groups steering scientific breakthroughs.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#133A26' }}>{labs.length}</div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Total Facilities</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>
                  {labs.reduce((acc, curr) => acc + (curr.projects?.length || 0), 0)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Active Projects</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB' }}>
                  {new Set(labs.map(l => l.leadId?._id).filter(Boolean)).size}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Principal Investigators</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderTop: '1px solid rgba(19,58,38,0.1)', paddingTop: '32px', marginBottom: '32px' }}>
            <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search labs by name, focus area, or P.I..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', borderRadius: '24px', background: 'white', border: '1px solid #D1D5DB' }}
              />
              <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '15px' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
          </div>

          {/* Dynamic Content */}
          {loading ? (
            <div className="premium-preloader-container" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="premium-preloader-spinner"></div>
              <div className="premium-preloader-text">Loading research laboratories...</div>
            </div>
          ) : filteredLabs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              No research labs matched your filters or search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {filteredLabs.map(lab => {
                const LabIcon = getLabIcon(lab.name);
                return (
                  <div key={lab._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.85)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ background: '#EAF4EE', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#133A26', flexShrink: 0 }}>
                        <LabIcon size={26} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#133A26', margin: 0 }}>{lab.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '2px 0 0' }}>{lab.department}</p>
                      </div>
                    </div>
                    
                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px', flex: 1 }}>
                      <p style={{ fontSize: '0.88rem', color: '#374151', marginBottom: '8px' }}>
                        <strong>Lead Principal Investigator:</strong> {lab.leadId?.name || 'Faculty Lead'}
                      </p>
                      <p style={{ fontSize: '0.88rem', color: '#374151', marginBottom: '12px' }}>
                        <strong>Research Focus:</strong> {lab.focus}
                      </p>
                      
                      {lab.projects && lab.projects.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong style={{ fontSize: '0.82rem', color: '#133A26', display: 'block', marginBottom: '6px' }}>Active Projects:</strong>
                          <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: '#4B5563', lineHeight: '1.5', margin: 0 }}>
                            {lab.projects.map((proj, idx) => <li key={idx}>{proj}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>{lab.status || 'Active'}</span>
                      <a href={`mailto:${lab.leadId?.username || 'admin@hpu.ac.in'}?subject=Inquiry regarding ${lab.name}`} className="btn-outline-small" style={{ fontSize: '0.78rem', padding: '6px 12px', textDecoration: 'none' }}>Inquire ➔</a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResearchLabsPage;
