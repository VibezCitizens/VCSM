import { useCallback, useMemo } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { queryKeys } from '@/queries/queryKeys'

import { useProfileUploads } from '@/features/settings/profile/hooks/useProfileUploads'
import { ctrlResolveVportIdByActorId } from '@/features/settings/profile/controller/resolveVportIdByActorId.controller'
import {
  loadProfileCore,
  saveProfileCore,
} from '@/features/settings/profile/controller/profile.controller'
import { useProfilesOps } from '@/features/profiles/adapters/profiles.adapter'
import { useIdentityOps } from '@/features/identity/adapters/identity.adapter'

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function useProfileController() {
  const { user } = useAuth()
  const { identity, setIdentity } = useIdentity()
  const qc = useQueryClient()
  const { invalidateActorProfileCache } = useProfilesOps()
  const { refreshVcActorDirectory } = useIdentityOps()

  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const mode = useMemo(() => {
    const qp = searchParams.get('mode')
    if (qp === 'vport') return 'vport'
    if (identity?.kind === 'vport') return 'vport'
    const segs = location.pathname.split('/').filter(Boolean)
    if (segs.includes('vport')) return 'vport'
    return 'user'
  }, [searchParams, identity?.kind, location.pathname])

  // Phase 1: resolve vportId from actorId (only needed in vport mode without URL param)
  const needsVportResolution =
    mode === 'vport' && !params.vportId && !!identity?.actorId

  const { data: resolvedVportId } = useQuery({
    queryKey: ['settings', 'vport-id-from-actor', identity?.actorId],
    queryFn: () => ctrlResolveVportIdByActorId(identity?.actorId),
    enabled: needsVportResolution,
    staleTime: 10 * 60 * 1000,
  })

  const subjectId = useMemo(() => {
    if (mode === 'vport') return params.vportId || resolvedVportId || null
    return user?.id || null
  }, [mode, params.vportId, resolvedVportId, user?.id])

  const profileKey =
    mode === 'vport'
      ? queryKeys.settingsVportProfile(subjectId)
      : queryKeys.settingsProfile(subjectId)

  const validSubjectId =
    subjectId && (mode !== 'vport' || UUID_RX.test(subjectId))

  // Phase 2: load profile using resolved subjectId
  const {
    data: profile = null,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: profileKey,
    queryFn: () => loadProfileCore({ subjectId, mode }),
    enabled: !!validSubjectId,
    staleTime: 5 * 60 * 1000,
  })

  const uploads = useProfileUploads({ mode, subjectId })

  const { mutateAsync: saveProfile, isPending: saving, error: saveError } = useMutation({
    mutationFn: (draft) => saveProfileCore({ subjectId, mode, draft, uploads, invalidateActorProfileCache, refreshVcActorDirectory }),
    onSuccess: (updatedUi) => {
      qc.setQueryData(profileKey, (prev) => ({ ...(prev || {}), ...updatedUi }))

      if (updatedUi.actorId && identity?.actorId === updatedUi.actorId) {
        setIdentity((prev) =>
          prev
            ? { ...prev, avatar: updatedUi.photoUrl, banner: updatedUi.bannerUrl }
            : prev
        )
      }
    },
  })

  const error = loadError?.message ?? saveError?.message ?? ''

  const profilePath =
    mode === 'vport'
      ? subjectId
        ? `/vport/${subjectId}`
        : '#'
      : user
      ? '/me'
      : '#'

  return {
    ready: !!subjectId && !isLoading,
    loading: isLoading,
    saving,
    error,
    mode,
    subjectId,
    profile,
    profilePath,
    saveProfile,
  }
}
