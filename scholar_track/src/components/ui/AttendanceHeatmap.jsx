import React, { useState } from 'react';
import { motion } from 'framer-motion';

const statusColorMap = {
  'PRESENT': 'present',
  'ABSENT': 'absent',
  'LATE': 'late',
  'LATE_EXCUSED': 'late',
  'ON_LEAVE': 'leave',
  'MEDICAL_LEAVE': 'leave',
  'CASUAL_LEAVE': 'leave',
  'DUTY_LEAVE': 'leave',
  'HALF_DAY_PRESENT': 'late',
  'ON_RESEARCH': 'present',
  'FIELD_VISIT': 'present',
  'NOT_MARKED': 'not-marked',
  'FUTURE': 'future',
};

const AttendanceHeatmap = ({ logs = [] }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!logs || logs.length === 0) return null;

  // Show last ~90 entries (3 months approx)
  const displayLogs = logs.slice(0, 90).reverse();

  return (
    <div>
      <div className="heatmap-grid">
        {displayLogs.map((log, i) => {
          const date = new Date(log.date);
          const statusClass = statusColorMap[log.status] ?? 'not-marked';
          const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

          return (
            <motion.div
              key={log.date ?? i}
              className={`heatmap-cell ${statusClass}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, delay: i * 0.008 }}
              onMouseEnter={() => setHoveredCell(i)}
              onMouseLeave={() => setHoveredCell(null)}
              title={`${dateStr}: ${log.status}`}
            >
              {hoveredCell === i && (
                <div className="heatmap-tooltip">
                  {dateStr} — {log.status?.replace(/_/g, ' ')}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="heatmap-legend">
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-dot" style={{ background: 'var(--status-present)' }} />
          Present
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-dot" style={{ background: 'var(--status-absent)' }} />
          Absent
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-dot" style={{ background: 'var(--status-late)' }} />
          Late
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-dot" style={{ background: 'var(--status-leave)' }} />
          Leave
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-dot" style={{ background: 'var(--color-border-solid)' }} />
          Not Marked
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeatmap;
