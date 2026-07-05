import React from 'react';
import { motion } from 'framer-motion';
import { X, Info } from 'lucide-react';

const SafeAbsencesModal = ({ requiredPercentage = 75, subjectWiseAttendance = [], onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '16px'
    }}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          background: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border-solid, #e5e7eb)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '18px 24px', 
          borderBottom: '1px solid var(--color-border-solid, #e5e7eb)',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Outfit', color: 'var(--color-text-primary)' }}>
            Subject-Wise Safe Absences
          </h3>
          <button 
            onClick={onClose} 
            style={{
              background: 'var(--color-bg, rgba(0,0,0,0.05))',
              border: 'none',
              color: 'var(--color-text-primary, #1f2937)',
              cursor: 'pointer',
              borderRadius: '50%',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: 'rgba(26, 90, 59, 0.05)',
            border: '1px solid rgba(26, 90, 59, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <Info size={20} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', lineHeight: '1.45', color: 'var(--text-secondary)' }}>
              <strong>What are Safe Absences?</strong> Safe absences indicate the maximum number of classes you can miss for a specific subject without your attendance falling below the required minimum threshold of <strong>{requiredPercentage}%</strong>. If your current attendance is below {requiredPercentage}%, safe absences will be 0, and you will see how many consecutive classes you must attend to recover.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subjectWiseAttendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No subjects mapped.
              </div>
            ) : (
              subjectWiseAttendance.map((sub, idx) => {
                const hasConducted = sub.total > 0;
                const isSubSafe = sub.percentage >= requiredPercentage;
                
                return (
                  <div 
                    key={sub.timetableSlotId || idx}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border-solid, #e5e7eb)',
                      background: 'var(--color-bg, rgba(0,0,0,0.01))',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(26,90,59,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {sub.subjectCode}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          Attendance: <strong style={{ color: isSubSafe ? 'var(--status-present)' : 'var(--status-absent)' }}>{sub.percentage}%</strong>
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub.subjectName}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Conducted: {sub.total} classes | Attended: {sub.attended}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {hasConducted ? (
                        isSubSafe ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Safe Absences</span>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--status-present)', fontFamily: 'Outfit' }}>
                              +{sub.safeAbsences} class(es)
                            </strong>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--status-absent)', textTransform: 'uppercase', fontWeight: 'bold' }}>Needs Recovery</span>
                            <strong style={{ fontSize: '0.88rem', color: 'var(--status-absent)', fontFamily: 'Outfit' }}>
                              Attend next {sub.classesToRecover} class(es)
                            </strong>
                          </div>
                        )
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No classes conducted
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SafeAbsencesModal;
