// Centralized API configuration for ScholarSync
// All URLs are read from environment variables — no hardcoded fallbacks.

export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const API_URL = API_BASE_URL ? `${API_BASE_URL}/api` : undefined;

// ScholarTrack portal URL - super admin redirects here
export const SCHOLAR_TRACK_URL = import.meta.env.VITE_TRACK_URL;

// Gateway portal URL - logout redirects here
export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;
