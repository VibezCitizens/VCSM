import { useEffect } from 'react'
import { isIOS } from './ios.env'

export default function useIOSPlatform({ enableKeyboard = false } = {}) {
  useEffect(() => {
    if (!isIOS()) return
    if (!enableKeyboard) return

    document.documentElement.classList.add('ios-keyboard')

    return () => {
      document.documentElement.classList.remove('ios-keyboard')
    }
  }, [enableKeyboard])
}
