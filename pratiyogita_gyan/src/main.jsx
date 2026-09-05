import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Disable debug console output in production
if (import.meta.env.PROD) {
  console.log = () => {}
  console.debug = () => {}
  console.info = () => {}
  console.warn = () => {}
}



// Unregister old/stuck service workers and clear stale caches to avoid aggressive mobile caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch((err) => {
    console.warn('Service worker cleanup:', err);
  });

  if (typeof caches !== 'undefined' && caches.keys) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    }).catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
