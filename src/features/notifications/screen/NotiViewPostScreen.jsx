// src/features/notifications/screen/NotiViewPostScreen.jsx
// ============================================================
// Notifications → View Post Screen
// - Deep-link target from notifications
// - Actor-aware resolution
// - NO post rendering
// ============================================================

import { useEffect, useState, useMemo } from 'react'
import {
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { supabase } from '@/services/supabase/supabaseClient'

export default function NotiViewPostScreen() {
  const { postId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  /* ------------------------------------------------------------
     QUERY PARAMS (still parsed, unused by UI)
  ------------------------------------------------------------ */
  const commentId = searchParams.get('commentId') || null

  const initialKind = useMemo(() => {
    const raw = (searchParams.get('tab') || 'rose').toLowerCase()
    const singular = raw.endsWith('s') ? raw.slice(0, -1) : raw
    return ['rose', 'like', 'dislike'].includes(singular)
      ? singular
      : 'rose'
  }, [searchParams])

  /* ------------------------------------------------------------
     STATE
  ------------------------------------------------------------ */
  const [post, setPost] = useState(null)
  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)

  /* ------------------------------------------------------------
     LOAD POST + AUTHOR (ACTOR-AWARE)
  ------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false
    if (!postId) return

    ;(async () => {
      setLoading(true)

      const { data: postRow, error: postErr } = await supabase
        .schema('vc')
        .from('posts')
        .select(
          'id, created_at, user_id, actor_id, media_type, title, text, media_url'
        )
        .eq('id', postId)
        .maybeSingle()

      if (postErr || !postRow) {
        if (!cancelled) setLoading(false)
        return
      }

      /* ---------------- NORMALIZE CONTENT ---------------- */
      const rawTitle = (postRow.title || '').trim()
      const rawBody = (postRow.text || '').trim()

      const title = rawTitle || null
      const body =
        rawBody && rawBody !== rawTitle ? rawBody : null

      /* ---------------- RESOLVE AUTHOR ---------------- */
      let authorType = 'user'
      let authorObj = null

      if (postRow.actor_id) {
        const { data: actor } = await supabase
          .schema('vc')
          .from('actors')
          .select('id, profile_id, vport_id')
          .eq('id', postRow.actor_id)
          .maybeSingle()

        if (actor?.vport_id) {
          const { data: vport } = await supabase
            .schema('vc')
            .from('vports')
            .select('id, name, slug, avatar_url, is_active')
            .eq('id', actor.vport_id)
            .maybeSingle()

          authorType = 'vport'
          authorObj = vport
            ? {
                id: vport.id,
                name: vport.name || 'VPORT',
                display_name: vport.name || 'VPORT',
                slug: vport.slug || null,
                avatar_url: vport.avatar_url || '/avatar.jpg',
                type: 'vport',
              }
            : {
                id: actor.vport_id,
                name: 'VPORT',
                display_name: 'VPORT',
                slug: null,
                avatar_url: '/avatar.jpg',
                type: 'vport',
              }
        } else {
          const userId =
            postRow.user_id || actor?.profile_id || null

          if (userId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select(
                'id, username, display_name, photo_url, private'
              )
              .eq('id', userId)
              .maybeSingle()

            if (profile) {
              authorObj = profile
              authorType = 'user'
            }
          }
        }
      }

      if (!authorObj && postRow.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'id, username, display_name, photo_url, private'
          )
          .eq('id', postRow.user_id)
          .maybeSingle()

        if (profile) {
          authorObj = profile
          authorType = 'user'
        }
      }

      const normalized = {
        id: postRow.id,
        created_at: postRow.created_at,
        type: authorType,
        authorId:
          authorType === 'vport'
            ? authorObj?.id ?? null
            : postRow.user_id,
        media_type: postRow.media_type || null,
        title,
        text: body,
        media_url: postRow.media_url || null,
        source: 'vc.posts',
        raw: postRow,
      }

      if (cancelled) return
      setPost(normalized)
      setAuthor(authorObj ?? null)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [postId])

  /* ------------------------------------------------------------
     RENDER
  ------------------------------------------------------------ */
  if (loading) return null

  if (!post) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        Post not available (deleted or private).
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-400"
      >
        ← Back
      </button>
    </div>
  )
}
