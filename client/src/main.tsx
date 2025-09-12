import React from 'react';
import ReactDOM from 'react-dom/client';
// Router is handled in App.tsx with wouter
import App from './App';
import './index.css';

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default browser behavior
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Initialize sound system early
import('./lib/globalSoundHandler.js').then(() => {
  console.log('🔊 Global sound handler loaded');
});

console.log("🚀 App starting up...");

const root = document.getElementById('root');
if (!root) {
  console.error("❌ Root element not found");
} else {
  console.log("✅ Root element found, mounting app");
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}