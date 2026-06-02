// Centralized configuration system for QuickBite API endpoints

// Default fallback development API URL (Vite proxy automatically handles /api requests to localhost:3001)
export const DEV_API_URL = '';

// Production API URL for Render deployment
// Set this VITE_API_URL environment variable during build, or modify this string directly.
export const PROD_API_URL = import.meta.env.VITE_API_URL || 'https://quickbite-v2.onrender.com';

// Determine environment
export const IS_DEV = import.meta.env.DEV;

// Configured base URL for all API requests
// On mobile (Capacitor), we must use an absolute URL since relative paths do not resolve to a server.
// In local browser development (IS_DEV is true), leaving it empty routes requests through the Vite proxy.
// In production web client, relative paths (/api) hit the monolith on Render automatically.
export const API_BASE_URL = window.Capacitor 
  ? PROD_API_URL 
  : (IS_DEV ? DEV_API_URL : PROD_API_URL);
