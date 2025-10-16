// src/main.jsx
import '@/lib/actors/bridgeIdentity'; // keep IdentityContext's STORAGE_KEY in sync with actor store

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'uno.css';
import '@/styles/global.css';

import App from './App';
import { AuthProvider } from '@/hooks/useAuth';
import IdentityMount from '@/state/IdentityMount';
import { registerSW } from 'virtual:pwa-register';

// Only register in production. In dev, also unregister any workers.
if (import.meta.env.PROD) {
  registerSW();
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );

  // Extra: also clear PWA caches in dev to avoid corrupted content
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* MUST wrap routes/nav so everything sees the current VPORT identity */}
        <IdentityMount>
          <App />
        </IdentityMount>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
