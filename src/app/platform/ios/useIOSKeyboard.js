import { useEffect } from 'react'
import { isIOS } from './ios.env'

export default function useIOSKeyboard(enabled) {
  useEffect(() => {
    if (!isIOS() || !enabled) return

    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      const keyboardHeight =
        window.innerHeight - (vv.height ?? window.innerHeight)

      document.documentElement.style.setProperty(
        '--ios-kb-offset',
        keyboardHeight > 0 ? `-${keyboardHeight}px` : '0px'
      )
    }

    const lockScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }

    const preventTouchMove = (e) => e.preventDefault()

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)

    window.addEventListener('scroll', lockScroll, { passive: false })
    document.addEventListener('touchmove', preventTouchMove, { passive: false })

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('scroll', lockScroll)
      document.removeEventListener('touchmove', preventTouchMove)
      document.documentElement.style.removeProperty('--ios-kb-offset')
    }
  }, [enabled])
}
