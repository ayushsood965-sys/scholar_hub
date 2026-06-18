import React from 'react';
import { motion } from 'framer-motion';

const StatusBadge = ({ status, size = 'default' }) => {
  const statusMap = {
    'PRESENT': { label: 'Present', className: 'badge-present' },
    'ABSENT': { label: 'Absent', className: 'badge-absent' },
    'LATE': { label: 'Late', className: 'badge-late' },
    'LATE_EXCUSED': { label: 'Late (Excused)', className: 'badge-late' },
    'ON_LEAVE': { label: 'On Leave', className: 'badge-leave' },
    'MEDICAL_LEAVE': { label: 'Medical Leave', className: 'badge-leave' },
    'CASUAL_LEAVE': { label: 'Casual Leave', className: 'badge-leave' },
    'DUTY_LEAVE': { label: 'Duty Leave', className: 'badge-leave' },
    'HALF_DAY_PRESENT': { label: 'Half Day', className: 'badge-late' },
    'HALF_DAY_ABSENT': { label: 'Half Day Absent', className: 'badge-absent' },
    'ON_RESEARCH': { label: 'Research', className: 'badge-primary' },
    'FIELD_VISIT': { label: 'Field Visit', className: 'badge-primary' },
    'CONFERENCE': { label: 'Conference', className: 'badge-primary' },
    'SEMINAR': { label: 'Seminar', className: 'badge-primary' },
    'HOLIDAY': { label: 'Holiday', className: 'badge-neutral' },
    'CANCELLED': { label: 'Cancelled', className: 'badge-neutral' },
    'NOT_MARKED': { label: 'Not Marked', className: 'badge-neutral' },
    'FUTURE': { label: 'Upcoming', className: 'badge-neutral' },
    'PENDING_SUPERVISOR': { label: 'Pending Supervisor', className: 'badge-pending' },
    'PENDING_FACULTY': { label: 'Pending Faculty', className: 'badge-pending' },
    'PENDING_HOD': { label: 'Pending HOD', className: 'badge-pending' },
    'APPROVED': { label: 'Approved', className: 'badge-approved' },
    'REJECTED': { label: 'Rejected', className: 'badge-rejected' },
    'RECOMMEND': { label: 'Recommended', className: 'badge-primary' },
  };

  const info = statusMap[status] ?? { label: status ?? 'Unknown', className: 'badge-neutral' };

  return (
    <motion.span
      className={`badge ${info.className} ${size === 'sm' ? 'text-xs' : ''}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {info.label}
    </motion.span>
  );
};

export default StatusBadge;
