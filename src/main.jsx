// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// UnoCSS
import 'uno.css';

// Leaflet styles
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Global styles
import '@/styles/global.css';

// Auth + Identity providers
import { AuthProvider } from '@/hooks/useAuth';
import { IdentityProvider } from '@/state/identityContext';

// PWA runtime
import { registerSW } from 'virtual:pwa-register';
registerSW();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <IdentityProvider>
          <App />
        </IdentityProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
