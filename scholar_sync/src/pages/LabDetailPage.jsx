import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL } from '../config';
import { 
  ArrowLeft, Users, BookOpen, MapPin, Globe, Mail, 
  Layers, Settings, Award, Calendar, Cpu, Atom, Dna, FlaskConical, Info
} from 'lucide-react';

const LabDetailPage = () => {
  const { id } = useParams();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabDetail = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/labs/${id}`);
        setLab(res.data);
      } catch (err) {
        console.error('Error loading lab details:', err);
        setError('Failed to load research lab details. It might have been deleted or the ID is invalid.');
      } finally {
        setLoading(false);
      }
    };
    fetchLabDetail();
  }, [id]);

  const getLabIcon = (labName = '') => {
    const name = labName.toLowerCase();
    if (name.includes('neural') || name.includes('ai') || name.includes('comput') || name.includes('software') || name.includes('intelligence')) return Cpu;
    if (name.includes('quantum') || name.includes('mechanic') || name.includes('phys') || name.includes('materials')) return Atom;
    if (name.includes('bio') || name.includes('genomic') || name.includes('medic') || name.includes('protein') || name.includes('genetics') || name.includes('biodiversity')) return Dna;
    return FlaskConical;
  };

  if (loading) {
    return (
      <div className="subpage-container">
        <Navbar />
        <div className="premium-preloader-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="premium-preloader-spinner"></div>
          <div className="premium-preloader-text">Loading Lab Directory Details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="subpage-container">
        <Navbar />
        <div style={{ flex: 1, padding: '80px 20px', display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '40px' }}>
            <h2 style={{ color: '#EF4444', marginBottom: '16px' }}>Error</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{error || 'Lab not found'}</p>
            <Link to="/labs" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Back to Labs
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const LabIcon = getLabIcon(lab.name);

  return (
    <div className="subpage-container">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      <Navbar />

      <div style={{ flex: 1, padding: '40px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Back Navigation */}
          <div>
            <Link to="/labs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#133A26', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
              <ArrowLeft size={16} /> Back to Lab Directory
            </Link>
          </div>

          {/* Banner / Header Card */}
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', overflow: 'hidden' }}>
            {lab.imageUrl && (
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', opacity: 0.15, pointerEvents: 'none' }}>
                <img src={lab.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ background: '#EAF4EE', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#133A26' }}>
                <LabIcon size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    {lab.status || 'Active'}
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#E0F2FE', color: '#0369A1', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    {lab.labType || 'Departmental'}
                  </span>
                </div>
                <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#133A26', margin: '8px 0 4px' }}>{lab.name}</h1>
                <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0, fontWeight: 600 }}>{lab.department}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid rgba(19,58,38,0.1)', paddingTop: '20px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              {lab.location && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> 📍 {lab.location}</span>}
              {lab.contactEmail && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={16} /> 📧 {lab.contactEmail}</span>}
              {lab.establishedYear && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> 📅 Est: {lab.establishedYear}</span>}
              {lab.website && (
                <a href={lab.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#133A26', textDecoration: 'none', fontWeight: 600 }}>
                  <Globe size={16} /> Lab Website
                </a>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '28px', alignItems: 'start' }}>
            
            {/* Left Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Mission & Description */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#133A26', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={20} /> Research Mission & Description
                </h3>
                <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {lab.description || `The ${lab.name} at HPU drives innovative discoveries in the domain of ${lab.focus}. We host dedicated Ph.D. scholars, collaborative investigators, and resource systems focusing on resolving theoretical and applied bottlenecks.`}
                </p>
                {lab.researchAreas && lab.researchAreas.length > 0 && (
                  <div style={{ marginTop: '18px' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>Focus Tag Cloud:</strong>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {lab.researchAreas.map(area => (
                        <span key={area} style={{ fontSize: '0.75rem', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', padding: '3px 10px', borderRadius: '12px' }}>{area}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Research Team Members */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#133A26', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} /> Research Team Members ({lab.members?.length || 0})
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {/* Lead PI */}
                  {lab.leadId && (
                    <div style={{ display: 'flex', gap: '12px', padding: '14px', border: '1px solid #133A26', borderRadius: '12px', background: 'rgba(19, 58, 38, 0.03)' }}>
                      <div style={{ background: '#CBD5E1', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                        {lab.leadId.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#133A26' }}>{lab.leadId.name}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-block', marginTop: '2px' }}>P.I. LEAD</span>
                        <p style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{lab.leadId.department}</p>
                      </div>
                    </div>
                  )}

                  {/* Other members */}
                  {lab.members?.filter(m => m._id !== lab.leadId?._id).map(member => (
                    <div key={member._id} style={{ display: 'flex', gap: '12px', padding: '14px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                      <div style={{ background: '#94A3B8', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                        {member.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{member.name}</h4>
                        <span style={{ fontSize: '0.68rem', background: member.role === 'FACULTY' ? '#DBEAFE' : '#D1FAE5', color: member.role === 'FACULTY' ? '#1E40AF' : '#065F46', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-block', marginTop: '2px' }}>
                          {member.role}
                        </span>
                        <p style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{member.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publications & Research Output */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#133A26', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={20} /> Verified Lab Publications ({lab.publications?.length || 0})
                </h3>

                {(!lab.publications || lab.publications.length === 0) ? (
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>No publications verified yet by the members of this lab.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {lab.publications.map(pub => (
                      <div key={pub._id} style={{ padding: '14px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                        <h4 style={{ margin: '0 0 6px', fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{pub.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                          📝 Author: <strong>{pub.scholarId?.name || 'Lab Scholar'}</strong> | Journal: {pub.journalName} | Year: {pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Lab details/facilities) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Focus Summary */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#133A26', marginTop: 0, marginBottom: '10px' }}>P.I. Supervised Focus</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {lab.focus}
                </p>
              </div>

              {/* Lab Equipment */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#133A26', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings size={18} /> Equipment & Tools
                </h4>

                {(!lab.equipment || lab.equipment.length === 0) ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>No instrumentation tools logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lab.equipment.map((item, idx) => (
                      <div key={idx} style={{ padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg)', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--color-text-primary)' }}>{item.name}</strong>
                          {item.isShared && (
                            <span style={{ fontSize: '0.62rem', background: '#D1FAE5', color: '#065F46', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>SHARED</span>
                          )}
                        </div>
                        {item.description && <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>{item.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Funding Support */}
              {lab.fundingSupport && lab.fundingSupport.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#133A26', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={18} /> Financial Support
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {lab.fundingSupport.map(fund => (
                      <span key={fund} style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#D97706', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>{fund}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LabDetailPage;
