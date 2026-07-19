// Centralized API configuration for ScholarHub Gateway
// All URLs are read from environment variables.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${API_BASE_URL}/api`;

// Portal URLs — read from environment variables
export const SCHOLAR_SYNC_URL = import.meta.env.VITE_SCHOLAR_SYNC_URL;
export const SCHOLAR_TRACK_URL = import.meta.env.VITE_SCHOLAR_TRACK_URL;
