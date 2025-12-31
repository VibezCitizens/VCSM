import { useEffect } from 'react'
import { isIOS, isIOSPWA } from './ios.env'

/**
 * useIOSKeyboard
 * ------------------------------------------------------------
 * Handles iOS keyboard behavior safely.
 *
 * IMPORTANT:
 * - Safari: keyboard changes visualViewport → move footer
 * - PWA: Apple freezes viewport → DO NOT move UI
 *
 * RULE:
 * - NEVER globally block touch scrolling
 * - ONLY prevent Safari auto-scroll on window
 */
export default function useIOSKeyboard(enabled) {
  useEffect(() => {
    if (!isIOS() || !enabled) return

    const vv = window.visualViewport
    if (!vv) return

    /* ============================================================
       UPDATE KEYBOARD OFFSET
       ============================================================ */
    const update = () => {
      // 🚫 iOS PWA: keyboard does NOT affect viewport
      if (isIOSPWA()) {
        document.documentElement.style.setProperty(
          '--ios-kb-offset',
          '0px'
        )
        return
      }

      // ✅ iOS Safari: calculate keyboard height
      const keyboardHeight =
        window.innerHeight - (vv.height ?? window.innerHeight)

      document.documentElement.style.setProperty(
        '--ios-kb-offset',
        keyboardHeight > 0 ? `-${keyboardHeight}px` : '0px'
      )
    }

    /* ============================================================
       PREVENT SAFARI AUTO SCROLL (WINDOW ONLY)
       ============================================================ */
    const lockWindowScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
    }

    /* ============================================================
       ATTACH LISTENERS
       ============================================================ */
    update()

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)

    // ⚠️ ONLY lock window scroll, NOT touchmove
    window.addEventListener('scroll', lockWindowScroll, {
      passive: false,
    })

    /* ============================================================
       CLEANUP
       ============================================================ */
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)

      window.removeEventListener('scroll', lockWindowScroll)

      document.documentElement.style.removeProperty('--ios-kb-offset')
    }
  }, [enabled])
}
