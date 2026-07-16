import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { 
  Atom, Cpu, Dna, FlaskConical, Search, Users, 
  Layers, Beaker, MapPin, ExternalLink, Globe, BookOpen
} from 'lucide-react';

const ResearchLabsPage = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
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
    if (name.includes('neural') || name.includes('ai') || name.includes('comput') || name.includes('software') || name.includes('intelligence')) return Cpu;
    if (name.includes('quantum') || name.includes('mechanic') || name.includes('phys') || name.includes('materials')) return Atom;
    if (name.includes('bio') || name.includes('genomic') || name.includes('medic') || name.includes('protein') || name.includes('genetics') || name.includes('biodiversity')) return Dna;
    return FlaskConical;
  };

  const filteredLabs = labs.filter(lab => {
    const matchesDept = selectedDept === 'All' || lab.department === selectedDept;
    
    const matchesType = selectedType === 'All' || lab.labType === selectedType;
    
    const matchesSearch = searchQuery === '' || 
      lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.focus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.leadId?.name && lab.leadId.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
    return matchesDept && matchesType && matchesSearch;
  });

  const availableDepts = ['All', ...new Set(labs.map(lab => lab.department).filter(Boolean))];
  const availableTypes = ['All', 'Departmental', 'Centre of Excellence', 'Collaborative Facility', 'Central Instrumentation'];

  const totalMembers = labs.reduce((acc, curr) => acc + (curr.memberCount || 0), 0);
  const totalProjects = labs.reduce((acc, curr) => acc + (curr.activeProjectsCount || 0), 0);

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
            <h1 className="page-title" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#133A26', marginBottom: '12px' }}>Research Labs & Centres</h1>
            <p className="page-desc" style={{ maxWidth: '700px', margin: '0 auto 30px', fontSize: '1.05rem', color: 'var(--color-text-secondary)' }}>
              Explore Himachal Pradesh University's core laboratories, shared research facilities, and departmental clusters shaping future innovations.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '850px', margin: '0 auto' }}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#133A26' }}>{labs.length}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Facilities</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>{totalProjects}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Projects</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB' }}>{totalMembers}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Lab Scholars & Staff</div>
              </div>
            </div>
          </div>

          {/* Search and Advanced Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(19,58,38,0.1)', paddingTop: '32px', marginBottom: '32px' }}>
            <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search labs by name, focus area, or P.I..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', borderRadius: '24px', background: 'var(--color-surface)', border: '1px solid #D1D5DB' }}
              />
              <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '15px' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Lab Type:</span>
                <select className="form-input" style={{ width: '180px', padding: '4px 8px', borderRadius: '8px' }} value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                  {availableTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Department:</span>
                <select className="form-input" style={{ width: '220px', padding: '4px 8px', borderRadius: '8px' }} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                  {availableDepts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d.replace('Department of ', '')}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Content */}
          {loading ? (
            <div className="premium-preloader-container" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="premium-preloader-spinner"></div>
              <div className="premium-preloader-text">Loading research laboratories...</div>
            </div>
          ) : filteredLabs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              No research labs matched your filters or search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
              {filteredLabs.map(lab => {
                const LabIcon = getLabIcon(lab.name);
                return (
                  <div key={lab._id} className="card hover-trigger" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ background: '#EAF4EE', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#133A26', flexShrink: 0 }}>
                        <LabIcon size={26} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#133A26', margin: 0 }}>{lab.name}</h3>
                        <span style={{ fontSize: '0.65rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginTop: '4px' }}>{lab.labType || 'Departmental'}</span>
                      </div>
                    </div>
                    
                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px', flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
                        <strong>PI Lead:</strong> {lab.leadId?.name || 'Faculty Lead'}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '8px' }}>
                        <strong>Dept:</strong> {lab.department}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '12px' }}>
                        <strong>Focus:</strong> {lab.focus}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #F1F5F9', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <div>👥 <strong>{lab.memberCount || 0}</strong> Members</div>
                        <div>📄 <strong>{lab.publicationCount || 0}</strong> Publications</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>{lab.status || 'Active'}</span>
                      <Link to={`/labs/${lab._id}`} className="btn-primary" style={{ fontSize: '0.78rem', padding: '6px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        View Detail <ExternalLink size={14} />
                      </Link>
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
