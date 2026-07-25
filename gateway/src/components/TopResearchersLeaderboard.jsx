import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  BookOpen, 
  Quote, 
  Sparkles, 
  Briefcase, 
  ChevronRight
} from 'lucide-react';
import { API_URL } from '../config';

const getAPIUrl = () => API_URL || 'http://localhost:5000/api';

const ResearcherAvatar = ({ name, avatarUrl }) => {
  const [imgError, setImgError] = useState(false);

  const getUrl = () => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${getAPIUrl().replace('/api', '')}${avatarUrl}`;
  };

  const url = getUrl();
  const initial = (name || 'R').charAt(0).toUpperCase();

  if (url && !imgError) {
    return (
      <img 
        src={url} 
        alt={name} 
        onError={() => setImgError(true)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--color-primary)',
          flexShrink: 0
        }}
      />
    );
  }

  return (
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--color-sync-light) 0%, rgba(26, 90, 59, 0.25) 100%)',
      color: 'var(--color-primary)',
      fontWeight: 800,
      fontSize: '1.4rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid var(--color-primary)',
      boxShadow: 'var(--shadow-sm)',
      flexShrink: 0
    }}>
      {initial}
    </div>
  );
};

const TopResearchersLeaderboard = ({ topData }) => {
  const [activeTab, setActiveTab] = useState('publications');
  const navigate = useNavigate();

  const getActiveList = () => {
    if (activeTab === 'citations') return topData?.topCitations || [];
    if (activeTab === 'shernies') return topData?.topShernies || [];
    return topData?.topPublications || [];
  };

  const list = getActiveList();

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: '24px',
      border: '1px solid var(--color-border)',
      padding: '28px',
      boxShadow: 'var(--shadow-md)',
      marginBottom: '40px'
    }}>
      {/* Header & Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
            <Sparkles size={16} /> Showcase Spotlight
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            {activeTab === 'shernies' ? 'Top Ten Women Researchers ("Shernies")' : activeTab === 'citations' ? 'Top Ten Citation Leaders' : 'Top Ten Publication Leaders'}
          </h2>
        </div>

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          background: 'var(--color-bg)',
          padding: '4px',
          borderRadius: '16px',
          border: '1px solid var(--color-border)'
        }}>
          <button
            onClick={() => setActiveTab('publications')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'publications' ? 'var(--color-surface)' : 'transparent',
              color: activeTab === 'publications' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: activeTab === 'publications' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <BookOpen size={15} /> Publications
          </button>

          <button
            onClick={() => setActiveTab('citations')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'citations' ? 'var(--color-surface)' : 'transparent',
              color: activeTab === 'citations' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: activeTab === 'citations' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Quote size={15} /> Citations
          </button>

          <button
            onClick={() => setActiveTab('shernies')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'shernies' ? 'var(--color-surface)' : 'transparent',
              color: activeTab === 'shernies' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: activeTab === 'shernies' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Award size={15} color="#ec4899" /> Top Shernies
          </button>
        </div>
      </div>

      {/* Grid of Profile Cards */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px'
          }}
        >
          {list.map((item, index) => {
            const isRankTop3 = index < 3;
            const rankColors = ['#f59e0b', '#94a3b8', '#b45309'];

            return (
              <motion.div
                key={item._id || index}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'var(--color-bg)',
                  borderRadius: '18px',
                  border: '1px solid var(--color-border)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isRankTop3 ? rankColors[index] : 'var(--color-surface)',
                  color: isRankTop3 ? '#FFFFFF' : 'var(--color-text-muted)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  #{index + 1}
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <ResearcherAvatar name={item.name} avatarUrl={item.avatarUrl} />

                  <div style={{ paddingRight: '24px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px 0', lineHeight: 1.2 }}>
                      {item.name}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                      <Briefcase size={13} color="var(--color-primary)" /> {item.designation}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      {item.department}
                    </div>
                  </div>
                </div>

                {/* Metrics Badges Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '12px',
                  marginTop: 'auto'
                }}>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }} title="Publications">
                      <BookOpen size={14} /> {item.publicationCount || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }} title="CrossRef Citations">
                      <Quote size={14} /> {item.citationCount || item.crossrefCitations || 0}
                    </span>
                    {(item.projectCount > 0) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7' }} title="Projects">
                        <Award size={14} /> {item.projectCount}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/discovery/profile/${item.username}`)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      background: 'var(--color-primary)',
                      color: '#FFFFFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Profile <ChevronRight size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TopResearchersLeaderboard;
