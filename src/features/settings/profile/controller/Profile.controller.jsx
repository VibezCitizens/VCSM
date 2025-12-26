// src/features/settings/profile/controller/Profile.controller.jsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

import { useProfileUploads } from '../hooks/useProfileUploads'
import { loadProfileCore, saveProfileCore } from './Profile.controller.core'

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/* ============================================================
   useProfileController (HOOK)
   - Resolves mode + subjectId (routing/identity)
   - Calls PURE controller core for meaning + orchestration
============================================================ */
export function useProfileController() {
  const { user } = useAuth()
  const { identity } = useIdentity()

  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()

  /* ------------------------------------------------------------
     MODE RESOLUTION
  ------------------------------------------------------------ */
  const mode = useMemo(() => {
    const qp = searchParams.get('mode')
    if (qp === 'vport') return 'vport'

    if (identity?.kind === 'vport') return 'vport'

    const segs = location.pathname.split('/').filter(Boolean)
    if (segs.includes('vport')) return 'vport'

    return 'user'
  }, [searchParams, identity?.kind, location.pathname])

  /* ------------------------------------------------------------
     SUBJECT ID RESOLUTION
  ------------------------------------------------------------ */
  const subjectId = useMemo(() => {
    if (mode === 'vport') {
      return params.vportId || identity?.vportId || null
    }
    return user?.id || null
  }, [mode, params.vportId, identity?.vportId, user?.id])

  /* ------------------------------------------------------------
     STATE
  ------------------------------------------------------------ */
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)

  const uploads = useProfileUploads({ mode, subjectId })

  /* ------------------------------------------------------------
     LOAD PROFILE
  ------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!subjectId) {
        setLoading(false)
        return
      }

      if (mode === 'vport' && !UUID_RX.test(subjectId)) {
        setError('Invalid VPORT id.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const mapped = await loadProfileCore({ subjectId, mode })
        if (cancelled) return

        setProfile(mapped)
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load profile.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [subjectId, mode])

  /* ------------------------------------------------------------
     SAVE PROFILE
  ------------------------------------------------------------ */
  const saveProfile = useCallback(
    async (draft) => {
      if (!subjectId) return

      setSaving(true)
      setError('')

      try {
        const updatedUi = await saveProfileCore({
          subjectId,
          mode,
          draft,
          uploads,
        })

        // Update local view state (UI shape)
        setProfile((p) => ({
          ...(p || {}),
          ...updatedUi,
        }))
      } catch (e) {
        setError(e?.message || 'Could not save changes.')
        throw e
      } finally {
        setSaving(false)
      }
    },
    [subjectId, mode, uploads]
  )

  /* ------------------------------------------------------------
     DERIVED
  ------------------------------------------------------------ */
  const profilePath =
    mode === 'vport'
      ? subjectId
        ? `/vport/${subjectId}`
        : '#'
      : user
      ? '/me'
      : '#'

  return {
    /* status */
    ready: !!subjectId && !loading,
    loading,
    saving,
    error,

    /* identity */
    mode,
    subjectId,

    /* data */
    profile,
    profilePath,

    /* actions */
    saveProfile,
  }
}
