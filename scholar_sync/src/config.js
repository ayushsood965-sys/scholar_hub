// Centralized API configuration for ScholarSync
// Uses Vercel / Vite environment variables when built, falling back to localhost for local development.

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_URL = `${API_BASE_URL}/api`;

// ScholarTrack portal URL - super admin redirects here
const getTrackUrl = () => {
  if (import.meta.env.VITE_TRACK_URL) {
    return import.meta.env.VITE_TRACK_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // In local development, if ScholarSync is running on 5174, ScholarTrack is likely on 5173.
      // If ScholarSync is on 5173, ScholarTrack is likely on 5174.
      return window.location.port === '5174' ? 'http://localhost:5173' : 'http://localhost:5174';
    } else {
      // In production (Vercel or custom domain), use the production ScholarTrack URL
      return 'https://scholar-track-ayush.vercel.app';
    }
  }
  return 'https://scholar-track-ayush.vercel.app'; // fallback for SSR/build time
};

export const SCHOLAR_TRACK_URL = getTrackUrl();

