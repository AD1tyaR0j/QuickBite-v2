import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Clean up any cached tunnel API URLs if running in a local desktop browser
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
      url = `https://79c42791aa6526.lhr.life${resource}`;
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
