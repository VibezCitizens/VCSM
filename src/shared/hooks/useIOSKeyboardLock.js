import { useEffect } from 'react'

export default function useIOSKeyboardLock() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      document.documentElement.style.setProperty(
        '--vv-offset',
        `${vv.offsetTop}px`
      )
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)

    update()

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
}
