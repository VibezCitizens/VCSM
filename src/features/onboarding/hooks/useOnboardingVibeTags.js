import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentity } from '@/state/identity/identityContext'
import {
  getVibeTagsOnboardingController,
  saveVibeTagsOnboardingController,
} from '@/features/onboarding/controller/vibeTagsOnboarding.controller'

export default function useOnboardingVibeTags() {
  const navigate = useNavigate()
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null

  const [tags, setTags] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async () => {
    if (!actorId) {
      setTags([])
      setSelectedTagIds(new Set())
      setLoading(false)
      setErrorMessage('Missing actor identity.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const result = await getVibeTagsOnboardingController({ actorId })
      if (!result?.ok) {
        throw new Error(result?.error?.message || 'Failed to load vibe tags')
      }

      setTags(result?.data?.tags ?? [])
      setSelectedTagIds(new Set(result?.data?.selectedTagIds ?? []))
    } catch (error) {
      console.error('[onboarding/vibe-tags] load failed', {
        actorId,
        message: error?.message ?? null,
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
        error,
      })
      setTags([])
      setSelectedTagIds(new Set())
      setErrorMessage(error?.message || 'Failed to load vibe tags.')
    } finally {
      setLoading(false)
    }
  }, [actorId])

  useEffect(() => {
    load()
  }, [load])

  const toggleTag = useCallback((tagId) => {
    if (!tagId) return

    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }, [])

  const selectedCount = selectedTagIds.size
  const canSave = useMemo(() => !loading && !saving, [loading, saving])

  const save = useCallback(async () => {
    if (!actorId || !canSave) return

    setSaving(true)
    setErrorMessage('')

    try {
      const result = await saveVibeTagsOnboardingController({
        actorId,
        selectedTagIds: Array.from(selectedTagIds),
      })

      if (!result?.ok) {
        throw new Error(result?.error?.message || 'Failed to save vibe tags')
      }

      navigate('/explore', { replace: true })
    } catch (error) {
      console.error('[onboarding/vibe-tags] save failed', {
        actorId,
        selectedCount: selectedTagIds.size,
        message: error?.message ?? null,
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
        error,
      })
      setErrorMessage(error?.message || 'Failed to save vibe tags.')
    } finally {
      setSaving(false)
    }
  }, [actorId, canSave, navigate, selectedTagIds])

  return {
    tags,
    selectedTagIds,
    selectedCount,
    loading,
    saving,
    errorMessage,
    toggleTag,
    save,
    reload: load,
  }
}
