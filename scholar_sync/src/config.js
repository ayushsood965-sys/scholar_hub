// Centralized API configuration for ScholarSync
// All URLs are read from environment variables — no hardcoded fallbacks.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

// ScholarTrack portal URL - super admin redirects here
export const SCHOLAR_TRACK_URL = import.meta.env.VITE_TRACK_URL;

// Gateway portal URL - logout redirects here
export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
