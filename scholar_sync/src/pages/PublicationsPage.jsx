import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL, API_BASE_URL } from '../config';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';

const PublicationsPage = () => {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Citation Modal state
  const [activeCitePub, setActiveCitePub] = useState(null);
  const [activeCiteFormat, setActiveCiteFormat] = useState('APA');
  const [copiedCite, setCopiedCite] = useState(false);
  const [copiedDOIIndex, setCopiedDOIIndex] = useState(null);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/publications`);
        setPublications(res.data || []);
      } catch (err) {
        console.error('Error fetching publications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublications();
  }, []);

  const handleCopyDOI = (doi, index) => {
    navigator.clipboard.writeText(doi);
    setCopiedDOIIndex(index);
    setTimeout(() => setCopiedDOIIndex(null), 2000);
  };

  const generateCitation = (pub, format) => {
    if (!pub) return '';
    const authorList = pub.scholarId?.name ? `${pub.scholarId.name}` : 'Scholar Author';
    const guideName = pub.thesisId?.supervisorId?.name ? `, ${pub.thesisId.supervisorId.name}` : '';
    const fullAuthors = `${authorList}${guideName}`;
    const year = pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : new Date().getFullYear();
    const title = pub.title || 'Untitled Research Paper';
    const journal = pub.journalName || 'Research Journal';
    const volume = pub.volume || '';
    const issue = pub.issue || '';
    const pages = pub.pages || '';
    const doi = pub.doiUrl || '';

    if (format === 'APA') {
      return `${fullAuthors} (${year}). ${title}. ${journal}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, pp. ${pages}` : ''}. ${doi}`;
    }
    if (format === 'MLA') {
      return `${fullAuthors}. "${title}." ${journal}, vol. ${volume || 'n/a'}, no. ${issue || 'n/a'}, ${year}, pp. ${pages || 'n/a'}. ${doi}`;
    }
    if (format === 'Chicago') {
      return `${fullAuthors}. "${title}." ${journal} ${volume || ''} (${year}): ${pages || ''}. ${doi}`;
    }
    if (format === 'BibTeX') {
      const citationKey = pub.scholarId?.name ? pub.scholarId.name.split(' ').pop().toLowerCase() + year : 'pub' + year;
      return `@article{${citationKey},\n  author = {${fullAuthors}},\n  title = {${title}},\n  journal = {${journal}},\n  year = {${year}},\n  volume = {${volume || ''}},\n  number = {${issue || ''}},\n  pages = {${pages || ''}},\n  url = {${doi}}\n}`;
    }
    return '';
  };

  const handleCopyCitation = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCite(true);
    setTimeout(() => setCopiedCite(false), 2000);
  };

  const filteredPubs = publications.filter(pub => {
    const matchesType = selectedType === 'All' || (pub.type || 'JOURNAL') === selectedType;
    const matchesDept = selectedDept === 'All' || pub.scholarId?.department === selectedDept;
    const matchesSearch = searchQuery === '' || 
      pub.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (pub.scholarId?.name && pub.scholarId.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pub.journalName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesDept && matchesSearch;
  });

  const availableDepts = ['All', ...new Set(publications.map(pub => pub.scholarId?.department).filter(Boolean))];
  const publicationTypes = ['All', 'JOURNAL', 'CONFERENCE', 'PATENT', 'BOOK_CHAPTER'];

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
            <h1 className="page-title" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#133A26', marginBottom: '12px' }}>Publications Directory</h1>
            <p className="page-desc" style={{ maxWidth: '700px', margin: '0 auto 30px', fontSize: '1.05rem', color: '#4B5563' }}>
              Explore peer-reviewed publications, patents, book chapters, and presentations logged and verified across our university.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#133A26' }}>{publications.length}</div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Total Verified Papers</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>
                  {publications.filter(p => p.type === 'PATENT').length}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Patents Filed/Granted</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(19,58,38,0.1)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB' }}>
                  {new Set(publications.map(p => p.scholarId?._id).filter(Boolean)).size}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>Contributing Scholars</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderTop: '1px solid rgba(19,58,38,0.1)', paddingTop: '32px', marginBottom: '32px' }}>
            <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search publications by title, author, or journal..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', borderRadius: '24px', background: 'white', border: '1px solid #D1D5DB' }}
              />
              <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '15px' }} />
            </div>

            {/* Type Filters */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {publicationTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`btn-outline-small ${selectedType === type ? 'active' : ''}`}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '20px',
                    borderColor: selectedType === type ? '#133A26' : '#D1D5DB',
                    background: selectedType === type ? '#133A26' : 'rgba(255,255,255,0.6)',
                    color: selectedType === type ? 'white' : '#4B5563',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {type === 'All' ? 'All Types' : type.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Department Filters */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', borderTop: '1px dashed #E5E7EB', paddingTop: '16px' }}>
              <span style={{ alignSelf: 'center', fontSize: '0.82rem', fontWeight: 600, color: '#6B7280' }}>Departments:</span>
              {availableDepts.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`btn-outline-small ${selectedDept === dept ? 'active' : ''}`}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px',
                    borderColor: selectedDept === dept ? '#133A26' : '#E5E7EB',
                    background: selectedDept === dept ? '#133A26' : 'transparent',
                    color: selectedDept === dept ? 'white' : '#6B7280',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
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
              <div className="premium-preloader-text">Loading publication listings...</div>
            </div>
          ) : filteredPubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              No publications matched your search criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredPubs.map((pub, idx) => (
                <div key={pub._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', background: '#EAF4EE', color: '#133A26', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                      {pub.type || 'JOURNAL'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={14} /> Published: <strong>{pub.publicationDate ? new Date(pub.publicationDate).toLocaleDateString() : 'N/A'}</strong>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', lineHeight: '1.4', margin: 0 }}>
                    {pub.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: '#4B5563', margin: 0 }}>
                    <strong>Authors:</strong> {pub.scholarId?.name || 'Academic Scholar'}, {pub.thesisId?.supervisorId?.name || 'Faculty Guide'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E5E7EB', paddingTop: '12px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: 0 }}>
                        <strong>Journal/Conference:</strong> {pub.journalName} {pub.issn ? `(ISSN: ${pub.issn})` : ''}
                      </p>
                      {pub.doiUrl && (
                        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px', margin: 0 }}>
                          DOI Link: <a href={pub.doiUrl} target="_blank" rel="noreferrer" style={{ color: '#133A26', textDecoration: 'none', fontWeight: 500 }}>{pub.doiUrl} <ExternalLink size={10} style={{ display: 'inline', marginLeft: 2 }} /></a>
                          <button 
                            onClick={() => handleCopyDOI(pub.doiUrl, idx)} 
                            style={{ background: 'none', border: 'none', color: '#133A26', cursor: 'pointer', paddingLeft: '12px', fontWeight: 600 }}
                          >
                            {copiedDOIIndex === idx ? '✓ Copied DOI' : '📋 Copy Link'}
                          </button>
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button 
                        onClick={() => setActiveCitePub(pub)}
                        className="btn-outline-small"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        <Award size={14} /> Cite Paper
                      </button>

                      {pub.documentUrl && (
                        <a 
                          href={`${API_BASE_URL}${pub.documentUrl}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn-primary" 
                          style={{ padding: '6px 16px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                          <Download size={14} /> View PDF Proof
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reusable Citation Generator Modal */}
      {activeCitePub && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100000, padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '24px', background: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#133A26' }}>Generate Citation</h3>
              <button 
                onClick={() => { setActiveCitePub(null); setCopiedCite(false); }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {['APA', 'MLA', 'Chicago', 'BibTeX'].map(fmt => (
                <button
                  key={fmt}
                  onClick={() => { setActiveCiteFormat(fmt); setCopiedCite(false); }}
                  className={`btn-outline-small ${activeCiteFormat === fmt ? 'active' : ''}`}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px',
                    borderColor: activeCiteFormat === fmt ? '#133A26' : '#E5E7EB',
                    background: activeCiteFormat === fmt ? '#133A26' : 'transparent',
                    color: activeCiteFormat === fmt ? 'white' : '#6B7280',
                    cursor: 'pointer'
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <div style={{ 
              background: '#F9FAFB', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid #E5E7EB',
              fontFamily: activeCiteFormat === 'BibTeX' ? 'monospace' : 'inherit',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              color: '#374151',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {generateCitation(activeCitePub, activeCiteFormat)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => handleCopyCitation(generateCitation(activeCitePub, activeCiteFormat))}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 16px' }}
              >
                {copiedCite ? <Check size={14} /> : <Copy size={14} />}
                {copiedCite ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PublicationsPage;
