import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowRight } from 'lucide-react';

const ProfileOnboardingModal = ({ isOpen, onClose, onGo }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 9999 }}
        >
          <motion.div
            className="modal-content glass-modal"
            style={{ maxWidth: '480px', textAlign: 'center', padding: '36px' }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(var(--color-primary-rgb), 0.08)', color: 'var(--color-primary)', marginBottom: '20px' }}>
              <User size={28} />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '10px' }}>
              Complete Your Profile
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '24px' }}>
              To use the ScholarTrack attendance and academic services, you must complete your profile onboarding form first.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Skip
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={onGo}
                style={{ flex: 1.5 }}
              >
                Go <ArrowRight size={16} style={{ marginLeft: '6px' }} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileOnboardingModal;
