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

      // Keep fixed chat shell aligned with the visual viewport.
      // iOS can shift visualViewport vertically when keyboard/chrome moves.
      const vvTop = Math.max(0, rawTop)

      // If no text input is focused but vv is still shrunk, iOS can lag
      // viewport restoration after keyboard close. Snap back to full height.
      const active = document.activeElement
      const tag = String(active?.tagName ?? '').toLowerCase()
      const isTextInputFocused =
        !!active &&
        (tag === 'input' || tag === 'textarea' || active.isContentEditable)

      const shouldSnapToFullHeight =
        !isTextInputFocused &&
        ih - vvHeight > 120

      const resolvedHeight = shouldSnapToFullHeight ? ih : vvHeight
      const resolvedTop = shouldSnapToFullHeight ? 0 : vvTop

      document.documentElement.style.setProperty('--vv-height', `${resolvedHeight}px`)
      document.documentElement.style.setProperty('--vv-top', `${resolvedTop}px`)

      // If viewport shrank, keyboard is already accounted for by vvHeight.
      const viewportShrank = (ih - resolvedHeight) > 20
      if (viewportShrank) {
        document.documentElement.style.setProperty('--kb-inset', '0px')
        return
      }

      // Overlay mode fallback: compute overlap amount
      const bottom = resolvedTop + resolvedHeight
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
