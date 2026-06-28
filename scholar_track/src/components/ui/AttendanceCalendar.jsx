import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

const AttendanceCalendar = ({ calendarMonths = [] }) => {
  const [currentMonthIdx, setCurrentMonthIdx] = useState(calendarMonths.length - 1); // Default to current/latest month

  if (!calendarMonths || calendarMonths.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No calendar logs found
      </div>
    );
  }

  const activeMonth = calendarMonths[currentMonthIdx] || calendarMonths[0];
  const { year, monthName, days } = activeMonth;

  // Week days headers (Monday to Sunday)
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Calculate start padding (empty cells to align first day under correct weekday column)
  const firstDay = days[0];
  // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const startPadding = firstDay ? (firstDay.dayOfWeek === 0 ? 6 : firstDay.dayOfWeek - 1) : 0;

  const handlePrev = () => {
    if (currentMonthIdx > 0) {
      setCurrentMonthIdx(currentMonthIdx - 1);
    }
  };

  const handleNext = () => {
    if (currentMonthIdx < calendarMonths.length - 1) {
      setCurrentMonthIdx(currentMonthIdx + 1);
    }
  };

  const getCellColor = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'var(--status-present)';
      case 'ABSENT':
        return 'var(--status-absent)';
      case 'ON_LEAVE':
        return 'var(--status-leave)';
      case 'HOLIDAY':
        return 'var(--status-info)';
      case 'WEEKEND':
        return 'rgba(255,255,255,0.06)';
      case 'FUTURE':
        return 'transparent';
      default:
        return 'rgba(255,255,255,0.02)';
    }
  };

  const getBorderColor = (status) => {
    if (status === 'FUTURE') return '1px dashed rgba(255, 255, 255, 0.15)';
    return '1px solid rgba(255, 255, 255, 0.05)';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
            {monthName} {year}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Attendance Timeline</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '6px 12px', minWidth: 'auto' }} 
            onClick={handlePrev} 
            disabled={currentMonthIdx === 0}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            className="btn btn-outline" 
            style={{ padding: '6px 12px', minWidth: 'auto' }} 
            onClick={handleNext} 
            disabled={currentMonthIdx === calendarMonths.length - 1}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
        {weekdays.map((wd, idx) => (
          <span key={idx} style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', opacity: 0.6 }}>
            {wd}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {/* Padding cells */}
        {Array.from({ length: startPadding }).map((_, idx) => (
          <div key={`pad-${idx}`} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
        ))}

        {/* Real day cells */}
        {days.map((day, idx) => {
          const cellColor = getCellColor(day.status);
          const isWeekendCell = day.status === 'WEEKEND';
          const isFutureCell = day.status === 'FUTURE';
          const holidayTitle = day.holidayTitle;
          
          return (
            <motion.div
              key={day.date}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.005 }}
              style={{
                aspectRatio: '1',
                borderRadius: '8px',
                background: cellColor,
                border: getBorderColor(day.status),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: (day.status !== 'FUTURE' && day.status !== 'WEEKEND') ? 'pointer' : 'default',
                color: (day.status === 'PRESENT' || day.status === 'ABSENT' || day.status === 'ON_LEAVE' || day.status === 'HOLIDAY') ? '#fff' : 'var(--text-secondary)',
                fontWeight: (day.status !== 'FUTURE' && day.status !== 'WEEKEND') ? '600' : '400',
                fontSize: '0.85rem'
              }}
              title={
                holidayTitle 
                  ? `Holiday: ${holidayTitle}` 
                  : `${day.dayOfMonth} ${monthName}: ${day.status}`
              }
            >
              <span>{day.dayOfMonth}</span>
              {holidayTitle && (
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff', position: 'absolute', bottom: '4px' }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--status-present)' }} />
          Present
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--status-absent)' }} />
          Absent
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--status-leave)' }} />
          On Leave
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--status-info)' }} />
          Holiday
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          Weekend
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
