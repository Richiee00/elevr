import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import Root from './Root.tsx';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ELEVR Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('ELEVR Service Worker registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In development, you can still register it or keep it optional.
  // Let's register it to allow local testing if desired.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ELEVR Service Worker registered in Dev:', registration.scope);
      })
      .catch((error) => {
        console.warn('ELEVR Service Worker dev registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
