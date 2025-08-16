// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

import App from './App';

// ✅ CSS order matters
import 'uno.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-geosearch/dist/geosearch.css';
import '@/styles/global.css';

import { AuthProvider } from '@/hooks/useAuth';

import { registerSW } from 'virtual:pwa-register';
registerSW();

// Define router and enable v7 flags
const router = createBrowserRouter(
  [
    {
      path: '/*',
      element: (
        <AuthProvider>
          <App />
        </AuthProvider>
      ),
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
