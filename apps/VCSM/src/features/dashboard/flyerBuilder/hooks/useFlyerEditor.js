import { useCallback, useState } from 'react'
import { uploadFlyerImageCtrl, saveFlyerPublicDetailsCtrl } from '../controller/flyerEditor.controller'

export function useFlyerEditor({ vportId, profileId, bucket, draft, setDraft, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState('')

  const uploadAndSet = useCallback(async (kind, fieldKey, file) => {
    if (!vportId) return
    setUploadingKey(fieldKey)
    try {
      const url = await uploadFlyerImageCtrl({ bucket, vportId, file, kind })
      if (url) setDraft((prev) => ({ ...(prev || {}), [fieldKey]: url }))
    } finally {
      setUploadingKey('')
    }
  }, [bucket, vportId, setDraft])

  const onSave = useCallback(async () => {
    if (!vportId) return
    setSaving(true)
    try {
      const res = await saveFlyerPublicDetailsCtrl({ profileId, patch: draft })
      onSaved?.(res)
    } finally {
      setSaving(false)
    }
  }, [vportId, profileId, draft, onSaved])

  return { saving, uploadingKey, uploadAndSet, onSave }
}
