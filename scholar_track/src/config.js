// Centralized API configuration for ScholarTrack
// Connects to the shared database backend on port 5000

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${API_BASE_URL}/api`;

const getSyncUrl = () => {
  if (import.meta.env.VITE_SYNC_URL) {
    return import.meta.env.VITE_SYNC_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.port === '5174' ? 'http://localhost:5173' : 'http://localhost:5174';
    } else {
      return 'https://scholar-sync-ayush.vercel.app';
    }
  }
  return 'https://scholar-sync-ayush.vercel.app';
};

export const SCHOLAR_SYNC_URL = getSyncUrl();

