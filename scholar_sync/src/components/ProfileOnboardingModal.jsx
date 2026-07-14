import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ProfileOnboardingModal = ({ isOpen, onClose, onGo }) => {
  const { user } = useContext(AuthContext);

  if (!isOpen || !user) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '24px',
        padding: '36px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            background: '#F0FDF4', 
            color: '#10B981', 
            fontSize: '1.5rem', 
            marginBottom: '16px' 
          }}>
            👤
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
            Complete Your Profile
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: '1.6', margin: '16px 0' }}>
            Please update your profile before continuing of proceeding further.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-outline" 
            style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}
          >
            Skip
          </button>
          <button 
            type="button" 
            onClick={onGo} 
            className="btn-primary" 
            style={{ flex: 1.5, padding: '12px', fontSize: '0.95rem', background: '#059669', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600 }}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboardingModal;
