// src/features/chat/conversation/hooks/conversation/useMediaViewer.js
// ============================================================
// useMediaViewer
// ------------------------------------------------------------
// - View-local UI state for fullscreen media viewer
// - Owns: viewer state + open/close actions + body scroll lock
// - NO supabase
// - NO domain meaning
// ============================================================

import { useCallback, useEffect, useState } from 'react'

export default function useMediaViewer() {
  /* ============================================================
     Media viewer state (FULLSCREEN)
     ============================================================ */
  const [viewer, setViewer] = useState(null)

  const openViewer = useCallback((media) => {
    if (!media?.url) return
    setViewer(media)
  }, [])

  const closeViewer = useCallback(() => {
    setViewer(null)
  }, [])

  useEffect(() => {
    if (!viewer) return

    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'

    return () => {
      html.style.overflow = prevOverflow
    }
  }, [viewer])

  return {
    viewer,
    openViewer,
    closeViewer,
    setViewer,
  }
}
