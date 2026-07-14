import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Check, CheckSquare, ShieldAlert, Sparkles, CheckCircle2, Clock, Info } from 'lucide-react';
import { API_URL } from '../config';

const API = API_URL;
const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const NotificationPanel = ({ user, onTabChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`, getAuthHeader());
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for notifications every 10 seconds for real-time dashboard updates
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, getAuthHeader());
      // Local state update for instant feedback
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, getAuthHeader());
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getStyle = (type, read) => {
    const opacity = read ? '0.75' : '1';
    if (type === 'WELCOME') return { bg: '#F5F3FF', border: '#DDD6FE', iconColor: '#7C3AED', Icon: Sparkles, opacity };
    if (type === 'PROFILE_INCOMPLETE') return { bg: '#FFF5F5', border: '#FECACA', iconColor: '#E53E3E', Icon: ShieldAlert, opacity };
    if (type === 'PENDING_ACTION') return { bg: '#FFFBEB', border: '#FDE68A', iconColor: '#D97706', Icon: Clock, opacity };
    if (type === 'SUCCESSFUL_ACTION') return { bg: '#ECFDF5', border: '#A7F3D0', iconColor: '#059669', Icon: CheckCircle2, opacity };
    return { bg: '#F8FAFC', border: '#E2E8F0', iconColor: '#64748B', Icon: Info, opacity };
  };

  const hasUnread = notifications.some(n => !n.read);

  // Client-side profile completeness check for user warning
  const profileWarning = user && !user.profileCompleted;

  return (
    <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Bell size={20} color="#10B981" />
          <span>🔔 Activity Notification Center</span>
        </h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F0FDF4',
              color: '#15803D',
              border: '1px solid #BBF7D0',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#DCFCE7'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#F0FDF4'; }}
          >
            <CheckSquare size={14} />
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
        
        {/* Dynamic Incomplete Profile Banner Warning */}
        {profileWarning && (
          <div style={{
            background: '#FFF5F5',
            border: '1px dashed #FCA5A5',
            borderLeft: '5px solid #EF4444',
            padding: '14px 16px',
            borderRadius: '12px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.05)'
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
              <ShieldAlert size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991B1B' }}>⚠️ Urgent: Profile Credentials Incomplete</div>
              <div style={{ fontSize: '0.78rem', color: '#B91C1C', marginTop: '3px', lineHeight: 1.4 }}>
                Please visit the Profile tab to finalize your credentials (academic details, specialization, office room) to unlock full portal operations.
              </div>
              {onTabChange && (
                <button
                  onClick={() => onTabChange('profile')}
                  style={{
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginTop: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Configure Profile Now
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="premium-preloader-container" style={{ padding: '32px 20px' }}>
            <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
            <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading alerts...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem', border: '1px dashed #E2E8F0', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🍃</div>
            <strong>All Caught Up!</strong>
            <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '0.78rem' }}>No new notifications are pending for your account.</p>
          </div>
        ) : (
          notifications.map(n => {
            const { bg, border, iconColor, Icon, opacity } = getStyle(n.type, n.read);
            return (
              <div
                key={n._id}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  padding: '14px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  opacity,
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: iconColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, paddingRight: n.read ? '0' : '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 750, color: '#1E293B' }}>{n.title}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{n.message}</p>
                  
                  {/* Dynamic Nav Button for links */}
                  {n.link && onTabChange && !n.read && (
                    <button
                      onClick={() => {
                        handleMarkAsRead(n._id);
                        onTabChange(n.link);
                      }}
                      style={{
                        background: 'transparent',
                        color: iconColor,
                        border: `1px solid ${iconColor}`,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        marginTop: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Resolve Action →
                    </button>
                  )}
                </div>

                {/* Mark Single as Read Button */}
                {!n.read && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    title="Mark as read"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'var(--color-surface)',
                      border: `1px solid ${border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.color = '#10B981'; e.currentTarget.style.borderColor = '#10B981'; }}
                    onMouseOut={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = border; }}
                  >
                    <Check size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
