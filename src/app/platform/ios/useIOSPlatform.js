import { useEffect } from 'react'
import { isIOS, isIOSPWA } from './ios.env'

/**
 * useIOSPlatform
 * ------------------------------------------------------------
 * iOS platform bootstrap (chat-safe)
 *
 * Responsibilities:
 * - Add iOS marker classes to <html>
 * - Enable keyboard mode when requested
 * - Distinguish Safari vs PWA
 *
 * DOES NOT:
 * - Move layout
 * - Handle keyboard math
 * - Handle scrolling
 */
export default function useIOSPlatform({
  enableKeyboard = false,
} = {}) {
  useEffect(() => {
    if (!isIOS()) return

    const html = document.documentElement

    /* ============================================================
       BASE iOS MARKERS
       ============================================================ */
    html.classList.add('ios')

    if (isIOSPWA()) {
      html.classList.add('ios-pwa')
    } else {
      html.classList.add('ios-safari')
    }

    /* ============================================================
       KEYBOARD MODE (OPT-IN)
       ============================================================ */
    if (enableKeyboard) {
      html.classList.add('ios-keyboard')
    }

    /* ============================================================
       CLEANUP
       ============================================================ */
    return () => {
      html.classList.remove('ios')
      html.classList.remove('ios-pwa')
      html.classList.remove('ios-safari')
      html.classList.remove('ios-keyboard')
    }
  }, [enableKeyboard])
}
