import { useEffect, useState } from "react"
import readVportPublicContentPageController from "@/features/profiles/kinds/vport/controller/content/readVportPublicContentPage.controller"

export function useVportPublicContentPage(pageId) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!pageId) {
      setPage(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setPage(null)

    readVportPublicContentPageController({ id: pageId })
      .then((result) => {
        if (!cancelled) { setPage(result); setLoading(false) }
      })
      .catch((e) => {
        if (!cancelled) { setError(e?.message ?? "Failed to load content."); setLoading(false) }
      })

    return () => { cancelled = true }
  }, [pageId])

  return { page, loading, error }
}
