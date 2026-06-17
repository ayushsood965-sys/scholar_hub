// Centralized API configuration for ScholarTrack
// Connects to the shared database backend on port 5000

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${API_BASE_URL}/api`;
