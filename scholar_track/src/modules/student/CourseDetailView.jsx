import React from 'react';
import { X, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import AttendanceCalendar from '../../components/ui/AttendanceCalendar';
import ProgressRing from '../../components/ui/ProgressRing';

const CourseDetailView = ({ course, calendarMonths = [], onClose }) => {
  if (!course) return null;

  const { subjectCode, subjectName, facultyName, percentage, attended, total, timetableSlotId, dayOfWeek } = course;

  // Filter calendar logs specifically for this course
  const filteredMonths = calendarMonths.map(month => ({
    ...month,
    days: month.days.map(day => {
      let status = day.status;
      if (day.status === 'PRESENT' || day.status === 'ABSENT' || day.status === 'NOT_APPLICABLE') {
        const classItem = (day.classes || []).find(c => c.timetableSlotId?.toString() === timetableSlotId?.toString());
        if (classItem) {
          if (classItem.isCancelled) {
            status = 'HOLIDAY'; // Treated as holiday type!
          } else {
            status = classItem.selected ? 'PRESENT' : 'ABSENT';
          }
        } else {
          status = 'NO_CLASS';
        }
      }
      return {
        ...day,
        status
      };
    })
  }));

  return (
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
      zIndex: 10000,
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        maxHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border-solid, #e5e7eb)',
        overflow: 'hidden'
      }}>
        {/* Top Header Control Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          padding: '10px 14px', 
          borderBottom: '1px solid var(--color-border-solid, #e5e7eb)',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <button 
            onClick={onClose} 
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
            title="Close details"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Header Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--color-border-solid, #e5e7eb)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
              <span style={{ alignSelf: 'flex-start', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(26,90,59,0.1)', padding: '2px 10px', borderRadius: '20px' }}>
                {subjectCode}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary, #1f2937)', fontFamily: 'Outfit', lineHeight: 1.25 }}>
                {subjectName}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-secondary, #4b5563)' }}>
                  <User size={14} style={{ color: 'var(--color-primary)' }} />
                  Faculty member: <strong>{facultyName}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-secondary, #4b5563)' }}>
                  <CheckCircle size={14} style={{ color: 'var(--status-present)' }} />
                  Classes attended: <strong>{attended}</strong> / {total} held
                </span>
              </div>
            </div>
            
            <ProgressRing percentage={percentage} size={80} strokeWidth={6} label="" />
          </div>

          {/* Calendar Display */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-primary, #1f2937)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
              Detailed Attendance Calendar
            </h3>
            <AttendanceCalendar calendarMonths={filteredMonths} variant="flat" dayOfWeek={dayOfWeek} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailView;
