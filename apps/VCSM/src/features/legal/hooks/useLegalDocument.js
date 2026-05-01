import { useEffect, useState } from 'react'
import { getLegalDocumentController } from '../controllers/legalDocument.controller'

export function useLegalDocument({ appKey, documentType, version, enabled = true }) {
  const [docMeta, setDocMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getLegalDocumentController({ appKey, documentType, version })
      .then((doc) => { if (!cancelled) setDocMeta(doc) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [appKey, documentType, version, enabled])

  return { docMeta, loading }
}
