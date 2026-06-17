import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const GenericPage = ({ title, description }) => {
  return (
    <div className="subpage-container">
      {/* Liquid animated backgrounds */}
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>

      <Navbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div className="glass-panel auth-panel" style={{ maxWidth: '640px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(26, 90, 59, 0.08)', padding: '6px 16px', borderRadius: '30px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '20px' }}>
            <Sparkles size={14} /> Modular Feature Integration
          </div>
          <h1 className="page-title" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{title}</h1>
          <p className="page-desc" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginTop: '12px', marginBottom: '32px' }}>
            {description}
          </p>
          <div className="clay-card" style={{ padding: '24px', background: 'var(--color-surface)', marginBottom: '32px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            This page represents the frontend UI shell for <strong>{title}</strong>. Full MERN database bindings and state controllers will sync here during backend integrations.
          </div>
          <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GenericPage;
