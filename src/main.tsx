/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Active cleanup of old service workers and cache to prevent aggressive iOS/PWA caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('Service Worker unregistered successfully');
      });
    }
  }).catch((err) => {
    console.error('Error getting SW registrations:', err);
  });
}

if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      caches.delete(key).then(() => {
        console.log('Cache cleared:', key);
      });
    });
  }).catch((err) => {
    console.error('Error clearing caches:', err);
  });
}
