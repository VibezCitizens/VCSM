// src/app/platform/ios/useIOSKeyboard.js
import { useEffect } from 'react'
import { isIOS } from './ios.env'

export default function useIOSKeyboard(enabled) {
  useEffect(() => {
    if (!isIOS() || !enabled) return

    const vv = window.visualViewport
    if (!vv) return

    let raf = 0

    const apply = () => {
      raf = 0

      const ih = window.innerHeight

      const rawH = vv.height ?? ih
      const rawTop = vv.offsetTop ?? 0

      // Clamp transient weird values
      const vvHeight = Math.max(0, Math.min(rawH, ih))
      const vvTop = Math.max(0, rawTop)

      // Drive the app shell off the visual viewport
      document.documentElement.style.setProperty('--vv-height', `${vvHeight}px`)
      document.documentElement.style.setProperty('--vv-top', `${vvTop}px`)

      /**
       * KEY IDEA:
       * If vvHeight already shrank (resizes-content behavior),
       * the footer is already above the keyboard due to the container height.
       * Do NOT add extra translate => causes the "gap".
       *
       * Only apply manual offset when the viewport DID NOT shrink
       * but the keyboard is overlaying.
       */

      const viewportShrank = (ih - vvHeight) > 20 // heuristic threshold

      if (viewportShrank) {
        // ✅ content was resized; do not translate footer
        document.documentElement.style.setProperty('--ios-kb-offset', '0px')
        return
      }

      // Overlay mode fallback: try to detect coverage
      // (some iOS PWAs won't shrink vvHeight; offsetTop may move)
      const bottom = vvTop + vvHeight
      let overlap = ih - bottom
      overlap = Math.max(0, Math.min(overlap, ih))

      document.documentElement.style.setProperty(
        '--ios-kb-offset',
        overlap > 0 ? `-${overlap}px` : '0px'
      )
    }

    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(apply)
    }

    apply()

    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)

    const onFocusIn = () => {
      setTimeout(schedule, 50)
      setTimeout(schedule, 250)
    }
    const onFocusOut = () => {
      setTimeout(schedule, 50)
      setTimeout(schedule, 250)
    }

    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)

    return () => {
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)

      if (raf) cancelAnimationFrame(raf)

      document.documentElement.style.removeProperty('--ios-kb-offset')
      document.documentElement.style.removeProperty('--vv-height')
      document.documentElement.style.removeProperty('--vv-top')
    }
  }, [enabled])
}
