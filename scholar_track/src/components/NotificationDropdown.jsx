import React, { useContext, useRef, useEffect } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';

const typeColors = {
  WELCOME: '#A5D6A7',
  PROFILE_INCOMPLETE: '#FFB74D',
  PENDING_ACTION: '#64B5F6',
  SUCCESSFUL_ACTION: '#81C784',
  INFO: '#B0BEC5',
  LEAVE_APPLIED: '#CE93D8',
  LEAVE_STATUS: '#F48FB1',
  CORRECTION_APPLIED: '#FFAB40',
  CORRECTION_STATUS: '#4FC3F7',
  ACCOUNT_VERIFIED: '#A5D6A7',
  MAPPING_UPDATE: '#80CBC4',
};

const typeIcons = {
  WELCOME: '🎉',
  PROFILE_INCOMPLETE: '⚠️',
  PENDING_ACTION: '⏳',
  SUCCESSFUL_ACTION: '✅',
  INFO: 'ℹ️',
  LEAVE_APPLIED: '📋',
  LEAVE_STATUS: '📋',
  CORRECTION_APPLIED: '📝',
  CORRECTION_STATUS: '📝',
  ACCOUNT_VERIFIED: '✅',
  MAPPING_UPDATE: '🔄',
};

const NotificationDropdown = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, loading } = useContext(NotificationContext);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif._id);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-dropdown-header">
        <div className="notification-dropdown-title">
          <Bell size={16} />
          <span>Notifications</span>
        </div>
        <div className="notification-dropdown-actions">
          {notifications.length > 0 && (
            <button className="notification-mark-all-btn" onClick={markAllAsRead} title="Mark all as read">
              <CheckCheck size={14} />
              Read all
            </button>
          )}
          <button className="notification-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="notification-dropdown-list">
        {loading && notifications.length === 0 && (
          <div className="notification-empty">Loading...</div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="notification-empty">No notifications yet</div>
        )}
        {notifications.map((notif) => (
          <div key={notif._id} className={`notification-item ${notif.read ? 'read' : 'unread'}`} onClick={() => handleNotificationClick(notif)}>
            <div className="notification-type-dot" style={{ background: typeColors[notif.type] || '#B0BEC5' }} />
            <div className="notification-content">
              <div className="notification-item-title">
                <span className="notification-icon">{typeIcons[notif.type] || '🔔'}</span>
                {notif.title}
              </div>
              <div className="notification-item-message">{notif.message}</div>
              <div className="notification-item-time">{formatTime(notif.createdAt)}</div>
            </div>
            {!notif.read && <div className="notification-unread-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationDropdown;
