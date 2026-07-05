import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, HelpCircle, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TargetWidget = ({ targetWidget, subjectWiseAttendance = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!targetWidget) return null;

  const {
    currentPercentage,
    requiredPercentage,
    safeAbsencesRemaining,
    classesToRecover,
    totalRemainingClasses,
    isRecoverable,
    formula,
    isPhD
  } = targetWidget;

  const isSafe = currentPercentage >= requiredPercentage;
  const isWarning = currentPercentage >= 70 && currentPercentage < requiredPercentage;

  const getStatusColor = () => {
    if (isSafe) return 'var(--status-present)';
    if (isWarning) return 'var(--status-warning)';
    return 'var(--status-absent)';
  };

  const getStatusBg = () => {
    if (isSafe) return 'rgba(16, 185, 129, 0.1)';
    if (isWarning) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(239, 68, 68, 0.1)';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>Attendance Target</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Compliance & recovery projections</span>
        </div>
        <div style={{
          padding: '6px 12px',
          borderRadius: '20px',
          background: getStatusBg(),
          color: getStatusColor(),
          fontWeight: 'bold',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {isSafe ? <ShieldCheck size={16} /> : isWarning ? <ShieldAlert size={16} /> : <AlertOctagon size={16} />}
          {isSafe ? 'Compliant' : isWarning ? 'Warning' : 'Defaulter'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '2.2rem', fontWeight: '800', color: getStatusColor(), fontFamily: 'Outfit' }}>
          {currentPercentage?.toFixed(1)}%
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          / {requiredPercentage}% required
        </span>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '0.85rem',
        color: 'var(--text-primary)',
        lineHeight: '1.5'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
          <HelpCircle size={16} style={{ color: 'var(--color-primary)' }} />
          Status Breakdown
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{formula}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Safe Absences</span>
            <strong style={{ fontSize: '1.05rem', color: isSafe ? 'var(--status-present)' : 'var(--text-secondary)' }}>
              {isPhD ? `${safeAbsencesRemaining} day(s)` : 'Subject-Specific'}
            </strong>
          </div>
          {!isPhD && (
            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--color-primary, #10B981)',
                fontSize: '0.72rem',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                textAlign: 'left',
                marginTop: '6px',
                fontFamily: 'Outfit'
              }}
            >
              Click here to view
            </button>
          )}
        </div>
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {isPhD ? 'Remaining Days' : 'Remaining Classes'}
          </span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            {totalRemainingClasses} {isPhD ? 'day(s)' : 'class(es)'}
          </strong>
        </div>
      </div>

      {/* Subject-Wise Safe Absences Modal Popup */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '16px'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '520px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
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
                padding: '16px 20px', 
                borderBottom: '1px solid var(--color-border-solid, #e5e7eb)',
                background: 'rgba(255, 255, 255, 0.01)'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', fontFamily: 'Outfit', color: 'var(--color-text-primary)' }}>
                  Subject-Wise Safe Absences
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
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
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  background: 'rgba(26, 90, 59, 0.05)',
                  border: '1px solid rgba(26, 90, 59, 0.1)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <Info size={18} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                    <strong>What are Safe Absences?</strong> Safe absences indicate the maximum number of classes you can miss for a specific subject without your attendance falling below the required minimum threshold of <strong>{requiredPercentage}%</strong>. If your current attendance is below {requiredPercentage}%, safe absences will be 0, and you will see how many consecutive classes you must attend to recover.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border-solid, #e5e7eb)',
                            background: 'var(--color-bg, rgba(0,0,0,0.01))',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(26,90,59,0.1)', padding: '1px 6px', borderRadius: '3px' }}>
                                {sub.subjectCode}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                Attendance: <strong style={{ color: isSubSafe ? 'var(--status-present)' : 'var(--status-absent)' }}>{sub.percentage}%</strong>
                              </span>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.subjectName}
                            </h4>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              Conducted: {sub.total} classes | Attended: {sub.attended}
                            </span>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {hasConducted ? (
                              isSubSafe ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Safe Absences</span>
                                  <strong style={{ fontSize: '1rem', color: 'var(--status-present)' }}>
                                    +{sub.safeAbsences} class(es)
                                  </strong>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--status-absent)', textTransform: 'uppercase', fontWeight: 'bold' }}>Needs Recovery</span>
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--status-absent)' }}>
                                    Attend next {sub.classesToRecover} class(es)
                                  </strong>
                                </div>
                              )
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default TargetWidget;
