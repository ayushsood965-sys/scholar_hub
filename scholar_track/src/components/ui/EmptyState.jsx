import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title = 'No data found', message = 'There is nothing to display here yet.', action }) => {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="empty-state-icon">
        <Icon size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{message}</p>
      {action && <div style={{ marginTop: '20px' }}>{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
