import '@/shared/lib/disableConsoleInProd'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'uno.css'
import '@/styles/global.css'
import '@/styles/citizens-theme.css'

import App from './App'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { IdentityProvider } from '@/state/identity/identityContext'

import { registerSW } from 'virtual:pwa-register'

// In this codebase many effects trigger network reads.
// Keep strict mode opt-in to avoid dev-only double fetch/mount behavior.
const RootMode = import.meta.env.VITE_REACT_STRICT_MODE === '1'
  ? React.StrictMode
  : React.Fragment

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  )

  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}

createRoot(document.getElementById('root')).render(
  <RootMode>
    <BrowserRouter>
      <AuthProvider>
        <IdentityProvider>
          <App />
        </IdentityProvider>
      </AuthProvider>
    </BrowserRouter>
  </RootMode>
)

