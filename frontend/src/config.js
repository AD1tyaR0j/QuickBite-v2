// Centralized configuration system for QuickBite API endpoints

// Default fallback development API URL (Vite proxy automatically handles /api requests to localhost:3001)
export const DEV_API_URL = '';

// Production API URL for Render deployment
// Set this VITE_API_URL environment variable during build, or modify this string directly.
export const PROD_API_URL = import.meta.env.VITE_API_URL || 'https://quickbite-v2.onrender.com';

// Determine environment
export const IS_DEV = import.meta.env.DEV;

// Configured base URL for all API requests
// In browser development, leaving it empty directs requests to the Vite dev proxy.
// In production web client, relative paths (/api) hit the monolith on Render automatically.
// In mobile/Capacitor, it prepends the defined PROD_API_URL or custom override.
export const API_BASE_URL = IS_DEV ? DEV_API_URL : PROD_API_URL;
