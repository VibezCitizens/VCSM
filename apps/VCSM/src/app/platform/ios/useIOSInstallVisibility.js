import { useState, useEffect } from 'react'

export function useIOSInstallVisibility() {
  const [canShowInstall, setCanShowInstall] = useState(false)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    try {
      const ua = (navigator.userAgent || '').toLowerCase()

      const isIOS = /iphone|ipad|ipod/.test(ua)
      const isSafari =
        isIOS &&
        ua.includes('safari') &&
        !ua.includes('crios') &&
        !ua.includes('fxios')

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        navigator.standalone === true

      if (isIOS && isSafari && !isStandalone) {
        setCanShowInstall(true)
      }
    } catch {
      // fail closed
    }
  }, [])

  return {
    canShowInstall,
    showInstall,
    openInstall: () => setShowInstall(true),
    dismissInstall: () => setShowInstall(false),
  }
}
