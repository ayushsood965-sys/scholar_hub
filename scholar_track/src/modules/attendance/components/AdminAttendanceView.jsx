import React from 'react';
import { Settings, Shield, AlertTriangle, CalendarDays } from 'lucide-react';

const AdminAttendanceView = ({ activeTab = 'attendance' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
        <Shield size={32} color="#60a5fa" />
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60a5fa' }}>University Attendance Settings</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Configure global policies, condonation rules, and institutional holiday calendars.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {activeTab === 'attendance' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Settings color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Global Policies</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Minimum Attendance Threshold</span>
              <span style={{ padding: '4px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>75%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Medical Condonation Floor</span>
              <span style={{ padding: '4px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>65%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Co-Curricular Condonation Floor</span>
              <span style={{ padding: '4px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>50%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Faculty Edit Window Lock</span>
              <span style={{ padding: '4px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>48 Hours</span>
            </div>
          </div>
          <button style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'not-allowed' }}>
            Edit Policies (Locked)
          </button>
        </div>
        )}

        {activeTab === 'leave' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <CalendarDays color="var(--color-warning)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Holiday Calendar Configuration</h3>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Declare university-wide holidays to automatically adjust working days calculation for all departments.
          </p>
          <button style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--color-warning)', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            Manage Calendar
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminAttendanceView;
