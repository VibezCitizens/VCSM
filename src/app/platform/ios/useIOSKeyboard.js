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

      const vvHeight = Math.max(0, Math.min(rawH, ih))

      // ✅ Fix: iOS can report offsetTop > 0 (browser chrome / viewport shifts).
      // For fullscreen fixed layouts, only honor offsetTop when pinch-zoomed.
      const scale = vv.scale ?? 1
      const vvTop = scale > 1 ? Math.max(0, rawTop) : 0

      document.documentElement.style.setProperty('--vv-height', `${vvHeight}px`)
      document.documentElement.style.setProperty('--vv-top', `${vvTop}px`)

      // If viewport shrank, keyboard is already accounted for by vvHeight.
      const viewportShrank = (ih - vvHeight) > 20
      if (viewportShrank) {
        document.documentElement.style.setProperty('--kb-inset', '0px')
        return
      }

      // Overlay mode fallback: compute overlap amount
      const bottom = vvTop + vvHeight
      let overlap = ih - bottom
      overlap = Math.max(0, Math.min(overlap, ih))

      // ✅ positive inset that increases bottom reserved space
      document.documentElement.style.setProperty(
        '--kb-inset',
        overlap > 0 ? `${overlap}px` : '0px'
      )
    }

    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(apply)
    }

    apply()

    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    window.addEventListener('resize', schedule)

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
      window.removeEventListener('resize', schedule)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)

      if (raf) cancelAnimationFrame(raf)

      document.documentElement.style.removeProperty('--kb-inset')
      document.documentElement.style.removeProperty('--vv-height')
      document.documentElement.style.removeProperty('--vv-top')
    }
  }, [enabled])
}
