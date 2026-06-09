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



// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Service worker registered successfully
        if (import.meta.env.DEV) {
          console.log('Service worker registered');
        }
      })
      .catch((registrationError) => {
        console.error('Service worker registration failed:', registrationError);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
