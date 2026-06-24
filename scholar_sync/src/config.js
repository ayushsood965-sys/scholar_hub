// Centralized API configuration for ScholarSync
// Uses Vercel / Vite environment variables when built, falling back to localhost for local development.

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_URL = `${API_BASE_URL}/api`;

// ScholarTrack portal URL - super admin redirects here
export const SCHOLAR_TRACK_URL =
  import.meta.env.VITE_TRACK_URL || "http://localhost:5174";
