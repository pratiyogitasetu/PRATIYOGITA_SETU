
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

if (window.location.hostname === '127.0.0.1') {
  const targetUrl = `${window.location.protocol}//localhost${window.location.port ? `:${window.location.port}` : ''}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(targetUrl);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);