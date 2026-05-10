import { useEffect, useState } from 'react'
import { getLegalDocumentController } from '../controllers/legalDocument.controller'

export function useLegalDocument({ appKey, documentType, version, enabled = true }) {
  const [docMeta, setDocMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getLegalDocumentController({ appKey, documentType, version })
      .then((doc) => {
        if (!cancelled) setDocMeta(doc)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load document metadata')
          if (import.meta.env.DEV) {
            console.error('[useLegalDocument] fetch failed:', { appKey, documentType, version }, err)
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [appKey, documentType, version, enabled])

  return { docMeta, loading, error }
}
