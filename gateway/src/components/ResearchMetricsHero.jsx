import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Users, 
  BookOpen, 
  Quote, 
  ChevronDown
} from 'lucide-react';

const ResearchMetricsHero = ({ stats, searchQuery, setSearchQuery, searchField, setSearchField, onSearchSubmit }) => {
  const [animatedFaculty, setAnimatedFaculty] = useState(0);
  const [animatedPubs, setAnimatedPubs] = useState(0);
  const [animatedPatents, setAnimatedPatents] = useState(0);
  const [animatedCites, setAnimatedCites] = useState(0);

  const targetFaculty = stats?.totalFaculty || 270;
  const targetPubs = stats?.totalPublications || 5898;
  const targetPatents = stats?.totalPatents || 41;
  const targetCites = stats?.totalCitations || 58416;

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const steps = 40;
    const intervalTime = duration / steps;

    const timer = setInterval(() => {
      start++;
      const progress = start / steps;
      setAnimatedFaculty(Math.floor(progress * targetFaculty));
      setAnimatedPubs(Math.floor(progress * targetPubs));
      setAnimatedPatents(Math.floor(progress * targetPatents));
      setAnimatedCites(Math.floor(progress * targetCites));

      if (start >= steps) {
        setAnimatedFaculty(targetFaculty);
        setAnimatedPubs(targetPubs);
        setAnimatedPatents(targetPatents);
        setAnimatedCites(targetCites);
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [targetFaculty, targetPubs, targetPatents, targetCites]);

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '40px' }}>
      {/* Global Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '850px',
          margin: '0 auto 36px auto',
          padding: '8px',
          borderRadius: '24px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div style={{ position: 'relative', minWidth: '170px' }}>
          <select 
            value={searchField} 
            onChange={(e) => setSearchField(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 32px 12px 16px',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none'
            }}
          >
            <option value="all">All Fields</option>
            <option value="name">Expert Name</option>
            <option value="department">Department</option>
            <option value="designation">Designation</option>
            <option value="expertise">Expertise</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search researchers, publications, departments, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit && onSearchSubmit()}
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>

        <button 
          onClick={onSearchSubmit}
          style={{
            padding: '14px 28px',
            borderRadius: '16px',
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(26, 90, 59, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <Search size={16} /> Search
        </button>
      </motion.div>

      {/* 3 Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Card 1: Faculty & Scientists */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: 'var(--color-surface)',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '4px solid var(--color-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--color-sync-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color="var(--color-primary)" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>University Staff</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Faculty & Scientists</h3>
              </div>
            </div>
            <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-primary)' }}>{animatedFaculty.toLocaleString()}</span>
          </div>

          {/* Grid Layout without scrollbar */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
              {(stats?.designations || [
                { name: 'Professor', count: 61 },
                { name: 'Associate Prof', count: 41 },
                { name: 'Assistant Prof', count: 137 },
                { name: 'Director', count: 4 },
                { name: 'Principal', count: 2 }
              ]).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                  <span style={{ fontWeight: 700, background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Card 2: Scholarly Output & Patents */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: 'var(--color-surface)',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '4px solid #0284c7'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={22} color="#0284c7" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Academic Output</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Publications & Patents</h3>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0284c7' }}>{animatedPubs.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>+ {animatedPatents} Patents</div>
            </div>
          </div>

          {/* Open Access Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', background: '#fef9c3', color: '#854d0e', fontWeight: 700, padding: '3px 10px', borderRadius: '10px', border: '1px solid #fef08a' }}>Gold OA: {stats?.openAccess?.goldOA || 313}</span>
            <span style={{ fontSize: '0.75rem', background: '#ffedd5', color: '#9a3412', fontWeight: 700, padding: '3px 10px', borderRadius: '10px', border: '1px solid #fed7aa' }}>Bronze OA: {stats?.openAccess?.bronzeOA || 59}</span>
            <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', fontWeight: 700, padding: '3px 10px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>Green OA: {stats?.openAccess?.greenOA || 36}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              <div>Journal Articles: <strong style={{ color: 'var(--color-text-primary)' }}>{stats?.publicationTypes?.journalArticles || 3753}</strong></div>
              <div>Conferences: <strong style={{ color: 'var(--color-text-primary)' }}>{stats?.publicationTypes?.conferenceProceedings || 599}</strong></div>
              <div>Books & Chapters: <strong style={{ color: 'var(--color-text-primary)' }}>{stats?.publicationTypes?.booksChapters || 536}</strong></div>
              <div>Other Output: <strong style={{ color: 'var(--color-text-primary)' }}>{stats?.publicationTypes?.other || 1010}</strong></div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Research Impact & Citations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            background: 'var(--color-surface)',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '4px solid #d97706'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Quote size={22} color="#d97706" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global Impact</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Citations & Metrics</h3>
              </div>
            </div>
            <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d97706' }}>{animatedCites.toLocaleString()}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              <span>CrossRef Citations</span>
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{(stats?.totalCrossRefCitations || Math.round(targetCites * 0.91)).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              <span>Scopus Indexed</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Active</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              <span>Average Citation / Paper</span>
              <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>9.90</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResearchMetricsHero;
