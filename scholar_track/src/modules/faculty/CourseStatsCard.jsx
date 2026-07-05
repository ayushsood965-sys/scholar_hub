import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import TrendLineChart from '../../components/ui/TrendLineChart';

const CourseStatsCard = ({ course, onViewDefaulters }) => {
  const [expanded, setExpanded] = useState(false);
  const {
    timetableSlotId,
    subjectCode,
    subjectName,
    degreeName,
    semesterName,
    totalStudents,
    classesHeld,
    avgAttendancePercentage,
    defaulterCount,
    markingStatus,
    weeklyTrend
  } = course;

  const isMarked = markingStatus === 'FULLY_MARKED';

  return (
    <div className="clay-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(26,90,59,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
            {subjectCode}
          </span>
          <h4 style={{ margin: '6px 0 2px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {subjectName}
          </h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {degreeName} • Sem {semesterName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`badge ${isMarked ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
            {isMarked ? 'Marked' : 'Pending'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} style={{ color: 'var(--color-primary)' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Students Mapped</span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{totalStudents}</strong>
          </div>
        </div>

        <div 
          onClick={defaulterCount > 0 ? () => onViewDefaulters(timetableSlotId) : undefined}
          style={{ 
            padding: '10px', 
            borderRadius: '8px', 
            background: defaulterCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)', 
            border: defaulterCount > 0 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(255,255,255,0.04)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: defaulterCount > 0 ? 'pointer' : 'default'
          }}
          title={defaulterCount > 0 ? 'Click to view defaulters' : ''}
        >
          <AlertTriangle size={16} style={{ color: defaulterCount > 0 ? 'var(--status-absent)' : 'var(--text-secondary)' }} />
          <div>
            <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Defaulters</span>
            <strong style={{ fontSize: '0.9rem', color: defaulterCount > 0 ? 'var(--status-absent)' : 'var(--text-primary)' }}>
              {defaulterCount}
            </strong>
          </div>
        </div>
      </div>

      {/* Progress slider bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Average Attendance</span>
          {totalStudents === 0 ? (
            <strong style={{ color: 'var(--text-secondary)' }}>
              No students mapped
            </strong>
          ) : classesHeld === 0 ? (
            <strong style={{ color: 'var(--text-secondary)' }}>
              No classes conducted
            </strong>
          ) : (
            <strong style={{ color: avgAttendancePercentage >= 75 ? 'var(--status-present)' : 'var(--status-absent)' }}>
              {avgAttendancePercentage}%
            </strong>
          )}
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: (totalStudents === 0 || classesHeld === 0) ? '0%' : `${avgAttendancePercentage}%`,
            background: (totalStudents === 0 || classesHeld === 0) ? '#6B7280' : (avgAttendancePercentage >= 75 ? 'var(--status-present)' : 'var(--status-absent)'),
            borderRadius: '3px'
          }} />
        </div>
      </div>

      {/* Expand/Collapse Trend button */}
      {totalStudents > 0 && classesHeld > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => setExpanded(!expanded)}
          >
            <BarChart3 size={14} />
            {expanded ? 'Hide Weekly Trend' : 'Show Weekly Trend'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
          >
            <TrendLineChart data={weeklyTrend} height={150} color={avgAttendancePercentage >= 75 ? 'var(--status-present)' : 'var(--status-absent)'} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseStatsCard;
