import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, value, label, trend, trendValue, color, delay = 0 }) => {
  return (
    <motion.div
      className="stat-card glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <div className="stat-card-header">
        <div className="stat-icon-wrapper" style={color ? { background: `${color}15`, color } : {}}>
          {Icon && <Icon size={22} />}
        </div>
        {trend && (
          <span className={`stat-trend ${trend}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue ?? ''}
          </span>
        )}
      </div>
      <div className="stat-value" style={color ? { color } : {}}>
        {value ?? '—'}
      </div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
};

export default StatCard;
