import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { API_BASE_URL } from './config.js';
// Clean up any cached tunnel or local API URLs if they are outdated, temporary tunnels, or if running in a local desktop browser
const cachedApiUrl = localStorage.getItem('quickbite-api-base-url');
if (cachedApiUrl && (
  cachedApiUrl.includes('lhr.life') || 
  cachedApiUrl.includes('ngrok') || 
  cachedApiUrl.includes('localtunnel') || 
  cachedApiUrl.includes('192.168.') || 
  cachedApiUrl.includes('10.') || 
  cachedApiUrl.includes('127.0.0.1') || 
  cachedApiUrl.includes('localhost')
)) {
  localStorage.removeItem('quickbite-api-base-url');
}

if (!window.Capacitor && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  localStorage.removeItem('quickbite-api-base-url');
}

// Intercept global fetch to redirect API calls to the configured backend server on mobile/Capacitor
const originalFetch = window.fetch;
window.fetch = async function (resource, options) {
  let url = resource;
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    const apiBase = localStorage.getItem('quickbite-api-base-url');
    if (apiBase) {
      url = `${apiBase}${resource}`;
    } else if (window.Capacitor) {
      url = `${API_BASE_URL}${resource}`;
    }
  }
  try {
    return await originalFetch(url, options);
  } catch (err) {
    console.error('API connection failed:', err);
    window.dispatchEvent(new CustomEvent('quickbite-connection-failed', { detail: { url } }));
    throw err;
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
