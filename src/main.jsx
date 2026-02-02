import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'uno.css'
import '@/styles/global.css'

import App from './App'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { IdentityProvider } from '@/state/identity/identityContext'

import { registerSW } from 'virtual:pwa-register'

if (import.meta.env.PROD) {
  registerSW()
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  )

  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}

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
)
