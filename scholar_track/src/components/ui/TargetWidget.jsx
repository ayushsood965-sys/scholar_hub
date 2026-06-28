import React from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, HelpCircle } from 'lucide-react';

const TargetWidget = ({ targetWidget }) => {
  if (!targetWidget) return null;

  const {
    currentPercentage,
    requiredPercentage,
    safeAbsencesRemaining,
    classesToRecover,
    totalRemainingClasses,
    isRecoverable,
    formula
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
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Safe Absences</span>
          <strong style={{ fontSize: '1.1rem', color: isSafe ? 'var(--status-present)' : 'var(--text-secondary)' }}>
            {isSafe ? `${safeAbsencesRemaining} class(es)` : '0 classes'}
          </strong>
        </div>
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Remaining Classes</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            {totalRemainingClasses} class(es)
          </strong>
        </div>
      </div>
    </div>
  );
};

export default TargetWidget;
