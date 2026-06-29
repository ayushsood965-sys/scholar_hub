import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ProgressRing = ({ percentage = 0, size = 140, strokeWidth = 10, color, label = 'Attendance' }) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(Math.min(percentage, 100)), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getColor = () => {
    if (color) return color;
    if (percentage >= 80) return 'var(--status-present)';
    if (percentage >= 75) return 'var(--status-late)';
    return 'var(--status-absent)';
  };

  return (
    <motion.div
      className="progress-ring-container"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <svg className="progress-ring-svg" width={size} height={size}>
        <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${getColor()}40)` }}
        />
      </svg>
      <div className="progress-ring-label">
        <span className="progress-ring-value" style={{ color: getColor(), fontSize: size <= 80 ? '0.85rem' : '1.5rem', fontWeight: size <= 80 ? '700' : '800' }}>
          {percentage?.toFixed(1) ?? '0'}%
        </span>
        {label && size > 80 && <span className="progress-ring-subtitle">{label}</span>}
      </div>
    </motion.div>
  );
};

export default ProgressRing;
