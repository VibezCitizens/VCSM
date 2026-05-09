import { useEffect, useState } from 'react'

export function useViewportWidth() {
  const [width, setWidth] = useState(
    typeof window === 'undefined' ? 1440 : window.innerWidth,
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width
}
