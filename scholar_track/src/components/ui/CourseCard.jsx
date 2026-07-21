import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus, BookOpen } from 'lucide-react';
import ProgressRing from './ProgressRing';

const CourseCard = ({ course, onClick }) => {
  const { subjectCode, subjectName, attended, total, percentage, trend, safeAbsences, classesToRecover } = course;

  const renderTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') {
      return (
        <span style={{ color: 'var(--status-present)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          <ArrowUpRight size={14} /> +{(trend.thisWeek - trend.lastWeek).toFixed(0)}%
        </span>
      );
    }
    if (trend.direction === 'down') {
      return (
        <span style={{ color: 'var(--status-absent)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          <ArrowDownRight size={14} /> {(trend.thisWeek - trend.lastWeek).toFixed(0)}%
        </span>
      );
    }
    return (
      <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}>
        <Minus size={14} /> stable
      </span>
    );
  };

  const renderSafeAbsences = () => {
    if (total === 0) return null;
    const needsRecovery = classesToRecover > 0;
    if (needsRecovery) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', marginTop: '2px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Needs Recovery:</span>
          <strong style={{ color: 'var(--status-absent, #EF4444)', fontWeight: 'bold' }}>
            Attend next {classesToRecover} class(es)
          </strong>
        </div>
      );
    } else {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', marginTop: '2px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Safe Absences:</span>
          <strong style={{ color: 'var(--status-present, #10B981)', fontWeight: 'bold' }}>
            +{safeAbsences || 0} class(es)
          </strong>
        </div>
      );
    }
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01, boxShadow: 'var(--shadow-md)' }}
      className="clay-card"
      style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '70%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(26,90,59,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
            {subjectCode}
          </span>
          {renderTrendIcon()}
        </div>
        <h4 style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subjectName}
        </h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {total > 0 ? (
            <>
              Conducted: <strong>{course.totalConducted || total}</strong> | Attended: <strong>{attended}</strong> | Leaves: <strong>{course.leaves || 0}</strong> | Absent: <strong>{course.absent || 0}</strong>
            </>
          ) : (
            "No classes conducted"
          )}
        </span>
        {renderSafeAbsences()}
      </div>

      <ProgressRing 
        percentage={total > 0 ? percentage : 0} 
        size={70} 
        strokeWidth={6} 
        label="" 
        color={total > 0 ? undefined : '#94a3b8'}
        valueLabel={total > 0 ? undefined : 'N/A'}
      />
    </motion.div>
  );
};

export default CourseCard;
