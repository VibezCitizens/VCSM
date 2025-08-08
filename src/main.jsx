import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// UnoCSS
import 'uno.css'

// Leaflet styles (ensure marker icons & tiles render correctly)
import 'leaflet/dist/leaflet.css'

// ✅ Add plugin CSS
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-geosearch/dist/geosearch.css'

// Global styles
import '@/styles/global.css'

// Auth context provider
import { AuthProvider } from '@/hooks/useAuth'

// PWA runtime
import { registerSW } from 'virtual:pwa-register'
registerSW()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
