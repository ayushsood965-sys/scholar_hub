import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export const NotificationContext = createContext();

const API = API_URL;
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const header = getAuthHeader();
    if (!header) {
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notifications`, header);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications from database:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNotification = async (message, title = 'System Notification', type = 'INFO') => {
    const newLocal = {
      _id: 'local-' + Date.now(),
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newLocal, ...prev]);
  };

  const markAsRead = async (id) => {
    if (String(id).startsWith('local-')) {
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      return;
    }

    const header = getAuthHeader();
    if (!header) return;

    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, header);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const header = getAuthHeader();
    if (!header) return;

    try {
      await axios.put(`${API}/notifications/read-all`, {}, header);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      const header = getAuthHeader();
      if (header) {
        axios.get(`${API}/notifications`, header)
          .then(res => setNotifications(res.data))
          .catch(err => console.error('Error in background notification polling:', err));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      loading,
      unreadCount: notifications.filter(n => !n.read).length,
      fetchNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
