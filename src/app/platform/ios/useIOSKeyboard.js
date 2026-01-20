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

      // clamp to prevent transient spikes
      const vvHeight = Math.max(0, Math.min(rawH, ih))
      const vvTop = Math.max(0, rawTop)

      // keyboard overlap (bottom covered)
      let overlap = ih - (vvHeight + vvTop)
      overlap = Math.max(0, Math.min(overlap, ih))

      document.documentElement.style.setProperty('--vv-height', `${vvHeight}px`)
      document.documentElement.style.setProperty('--vv-top', `${vvTop}px`)
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

    // PWA often needs focus signals
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
