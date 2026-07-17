import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { applyThemeAttribute } from './stores/themeStore'

// Apply the persisted theme before the first paint to avoid a flash
const stored = localStorage.getItem('korgix-theme')
const parsed = stored ? JSON.parse(stored) : null
applyThemeAttribute(parsed?.state?.theme ?? 'system')

// Register service worker for PWA + background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((err) => {
        console.log('SW registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)