// src/features/settings/profile/controller/Profile.controller.jsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/state/identity/identityContext'

import vc from '@/services/supabase/vcClient'
import { useProfileUploads } from '../hooks/useProfileUploads'
import { loadProfileCore, saveProfileCore } from './Profile.controller.core'

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function resolveVportIdFromActor(actorId) {
  if (!actorId) return null

  const { data, error } = await vc
    .from('actors')
    .select('vport_id')
    .eq('id', actorId)
    .maybeSingle()

  if (error) {
    console.error('[ProfileController] resolveVportIdFromActor failed', error)
    return null
  }

  return data?.vport_id ?? null
}

/* ============================================================
   useProfileController (HOOK)
============================================================ */
export function useProfileController() {
  const { user } = useAuth()
  const { identity } = useIdentity()

  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()

  /* ------------------------------------------------------------
     MODE RESOLUTION (PURE)
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
     SUBJECT ID RESOLUTION (STATEFUL, ACTOR-FIRST)
     - Always resolves to a stable string or null
  ------------------------------------------------------------ */
  const [subjectId, setSubjectId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      // USER MODE: subject is current authed user
      if (mode !== 'vport') {
        if (!cancelled) setSubjectId(user?.id || null)
        return
      }

      // VPORT MODE: route param wins
      if (params.vportId) {
        if (!cancelled) setSubjectId(params.vportId)
        return
      }

      // Else resolve from identity.actorId (locked contract)
      const actorId = identity?.actorId || null
      if (!actorId) {
        if (!cancelled) setSubjectId(null)
        return
      }

      const vportId = await resolveVportIdFromActor(actorId)
      if (!cancelled) setSubjectId(vportId || null)
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [mode, params.vportId, identity?.actorId, user?.id])

  /* ------------------------------------------------------------
     STATE
  ------------------------------------------------------------ */
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)

  // ✅ Always call hook. It must handle subjectId=null internally.
  const uploads = useProfileUploads({ mode, subjectId })

  /* ------------------------------------------------------------
     LOAD PROFILE
  ------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false

    async function load() {
      // Reset loading when subject changes
      setError('')
      setProfile(null)

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