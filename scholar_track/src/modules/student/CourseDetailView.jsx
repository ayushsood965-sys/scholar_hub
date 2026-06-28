import React from 'react';
import { X, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import AttendanceCalendar from '../../components/ui/AttendanceCalendar';
import ProgressRing from '../../components/ui/ProgressRing';

const CourseDetailView = ({ course, calendarMonths = [], onClose }) => {
  if (!course) return null;

  const { subjectCode, subjectName, facultyName, percentage, attended, total, timetableSlotId } = course;

  // Filter calendar logs specifically for this course
  const filteredMonths = calendarMonths.map(month => ({
    ...month,
    days: month.days.map(day => {
      let status = day.status;
      if (day.status === 'PRESENT' || day.status === 'ABSENT') {
        const classItem = (day.classes || []).find(c => c.timetableSlotId?.toString() === timetableSlotId?.toString());
        if (classItem) {
          status = classItem.selected ? 'PRESENT' : 'ABSENT';
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
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          title="Close details"
        >
          <X size={18} />
        </button>

        <div style={{ padding: '32px' }}>
          {/* Header Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '70%' }}>
              <span style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(26,90,59,0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                {subjectCode}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                {subjectName}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <User size={16} style={{ color: 'var(--color-primary)' }} />
                  Faculty member: <strong>{facultyName}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--status-present)' }} />
                  Classes attended: <strong>{attended}</strong> / {total} held
                </span>
              </div>
            </div>
            
            <ProgressRing percentage={percentage} size={100} strokeWidth={8} label="Course Attendance" />
          </div>

          {/* Calendar Display */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
              Detailed Attendance Calendar
            </h3>
            <AttendanceCalendar calendarMonths={filteredMonths} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailView;
