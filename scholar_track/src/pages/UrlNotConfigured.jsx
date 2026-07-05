import React from 'react';

/**
 * Displayed when a required portal URL environment variable is not configured.
 * This prevents silent redirects to wrong domains.
 */
export default function UrlNotConfigured({ variableName }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0f172a',
      color: '#ffffff',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      padding: '24px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '520px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '48px 36px',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '28px'
        }}>
          ⚠️
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          marginBottom: '12px',
          color: '#f87171'
        }}>
          Portal URL Not Configured
        </h1>
        <p style={{
          fontSize: '0.95rem',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.6,
          marginBottom: '24px'
        }}>
          The required website path has not been defined in the environment files.
          Please contact your system administrator or set the <code style={{
            background: 'rgba(255,255,255,0.08)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.88rem',
            fontFamily: "'Fira Code', 'Consolas', monospace",
            color: '#fbbf24'
          }}>{variableName}</code> variable in your <code style={{
            background: 'rgba(255,255,255,0.08)',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.88rem',
            fontFamily: "'Fira Code', 'Consolas', monospace",
            color: '#fbbf24'
          }}>.env</code> file.
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: "'Fira Code', 'Consolas', monospace",
          textAlign: 'left'
        }}>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}># .env</span><br />
          {variableName}=https://your-domain.com
        </div>
      </div>
    </div>
  );
}
