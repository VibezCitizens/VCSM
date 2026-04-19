import '@/shared/lib/disableConsoleInProd'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'uno.css'
import '@/styles/global.css'
import '@/styles/citizens-theme.css'

import { setupVcsmIdentityEngine } from '@/features/identity/setup'
import { setupVcsmHydration } from '@/features/hydration/setup'
import { setupVcsmChatEngine } from '@/features/chat/setup'
import { setupVcsmReviewsEngine } from '@/features/reviews/setup'
import { setupVcsmPortfolioEngine } from '@/features/portfolio/setup'
import { setupVcsmNotificationsEngine } from '@/features/notifications/setup'

// Configure engines before any component renders or auth checks run.
setupVcsmIdentityEngine()
setupVcsmHydration()
setupVcsmChatEngine()
setupVcsmReviewsEngine()
setupVcsmPortfolioEngine()
setupVcsmNotificationsEngine()

import App from './App'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { IdentityProvider } from '@/state/identity/identityContext'
import { I18nProvider } from '@i18n'
import { vcsmDictionary } from '@/i18n/setup'

import { registerSW } from 'virtual:pwa-register'
import { appendIOSProdDebugLog } from '@/shared/lib/iosProdDebugger'

// In this codebase many effects trigger network reads.
// Keep strict mode opt-in to avoid dev-only double fetch/mount behavior.
const RootMode = import.meta.env.VITE_REACT_STRICT_MODE === '1'
  ? React.StrictMode
  : React.Fragment

if (import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Apply updates eagerly so standalone sessions do not keep stale route logic.
      appendIOSProdDebugLog('sw_on_need_refresh', { source: 'registerSW' })
      updateSW(true)
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      appendIOSProdDebugLog('sw_registered', {
        swUrl: _swUrl ?? null,
        hasRegistration: !!registration,
      })

      const maybeUpdate = () => registration.update()
        .then(() => appendIOSProdDebugLog('sw_update_check_ok', { source: 'maybeUpdate' }))
        .catch((error) => appendIOSProdDebugLog('sw_update_check_error', {
          source: 'maybeUpdate',
          message: error?.message ?? String(error),
        }))
      const onVisible = () => {
        if (document.visibilityState === 'visible') maybeUpdate()
      }

      // iOS/standalone sessions can remain alive for long periods.
      // Re-check updates when the app regains focus/visibility.
      window.addEventListener('focus', maybeUpdate)
      window.addEventListener('pageshow', maybeUpdate)
      document.addEventListener('visibilitychange', onVisible)
      setInterval(maybeUpdate, 60 * 1000)
    },
  })
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
      <I18nProvider dictionary={vcsmDictionary}>
        <AuthProvider>
          <IdentityProvider>
            <App />
          </IdentityProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </RootMode>
)
