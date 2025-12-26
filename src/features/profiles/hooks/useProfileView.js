import { useEffect, useState } from 'react'
import { getProfileView } from '@/features/profiles/controller/getProfileView.controller'
import { readActorPostsDAL } from '@/features/profiles/dal/readActorPosts.dal'

export function useProfileView({
  viewerActorId,
  profileActorId,
  canViewContent,
}) {
  const [loading, setLoading] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [error, setError] = useState(null)

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])

  useEffect(() => {
    let alive = true

    async function load() {
      console.group('[useProfileView LOAD]')
      console.log({ viewerActorId, profileActorId, canViewContent })
      console.groupEnd()

      try {
        setLoading(true)
        setError(null)

        // ======================================================
        // PROFILE — ALWAYS LOAD (IDENTITY MUST EXIST)
        // ======================================================
        const result = await getProfileView({
          viewerActorId,
          profileActorId,
        })

        if (!alive) return
        setProfile(result.profile)

        // ======================================================
        // POSTS — GATED BY PRIVACY
        // ======================================================
        if (canViewContent === true) {
          try {
            const rows = await readActorPostsDAL(profileActorId)
            if (alive) setPosts(rows)
          } catch (postErr) {
            console.warn('[useProfileView] posts skipped', postErr)
            if (alive) setPosts([])
          }
        } else {
          setPosts([])
        }

      } catch (e) {
        console.error('[useProfileView] PROFILE ERROR', e)
        if (alive) setError(e)
      } finally {
        if (alive) {
          setLoading(false)
          setLoadingPosts(false)
        }
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [viewerActorId, profileActorId, canViewContent])

  return {
    loading,
    loadingPosts,
    error,
    profile,
    posts,
  }
}
