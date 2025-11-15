// VERSION: 2025-11-11 (vport-inbox + deletethread wiring + deep debug)

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import CardInbox from '../components/CardInbox'
import StartConversationModal from '../components/StartConversationModal'
import { inboxOnSearch, resolvePickedToActorId } from '@/features/chat/search/inboxSearchAdapters'
import { getOrCreateOneToOne } from '@/features/chat/api/chatApi'
import { listVportInbox, markConversationRead } from '@/features/chat/api/chatApi.views'
import { useIdentity } from '@/state/identityContext'
import { supabase } from '@/lib/supabaseClient'
import { isAbortError } from '@/features/chat/utils/isAbortError'

// ⬇️ NEW: import the helper (same as Inbox.jsx)
import { deleteThreadForMe } from '@/features/chat/helpers/deletethread'

export default function VInbox() {
  const nav = useNavigate()
  const { identity, isLoading } = useIdentity()
  const myActorId = identity?.actorId ?? null

  const authReadyRef = useRef(false)
  const [authTick, setAuthTick] = useState(0)

  async function ensureAuthReady(maxWaitMs = 5000) {
    if (authReadyRef.current) return true
    const started = Date.now()
    while (Date.now() - started < maxWaitMs) {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      const userResp = await supabase.auth.getUser()
      const userId = userResp?.data?.user?.id
      if (token && userId) { authReadyRef.current = true; return true }
      await new Promise(r => setTimeout(r, 100))
    }
    return false
  }

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_evt, session) => {
      authReadyRef.current = !!session?.access_token
      setAuthTick(t => t + 1)
    })
    return () => sub.data?.subscription?.unsubscribe?.()
  }, [])

  useEffect(() => {
    const bump = () => setAuthTick(t => t + 1)
    window.addEventListener('visibilitychange', bump)
    window.addEventListener('focus', bump)
    window.addEventListener('online', bump)
    return () => {
      window.removeEventListener('visibilitychange', bump)
      window.removeEventListener('focus', bump)
      window.removeEventListener('online', bump)
    }
  }, [])

  // resolve actor (prefer vport-kind)
  const [resolvedActorId, setResolvedActorId] = useState(null)
  const [resolvingActor, setResolvingActor] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (isLoading) return
      if (myActorId) { if (!cancelled) setResolvedActorId(myActorId); return }
      if (!identity?.userId) return

      setResolvingActor(true)
      const ok = await ensureAuthReady()
      if (!ok) return

      try {
        const { data, error } = await supabase
          .schema('vc')
          .from('actor_owners')
          .select('actor_id, actors:actor_id ( id, kind )')
          .eq('user_id', identity.userId)
        if (error) throw error
        const vportKind = (data || []).find(r => r.actors?.kind === 'vport')
        if (!cancelled) setResolvedActorId(vportKind?.actor_id ?? null)
      } catch (e) {
        if (!cancelled) setResolvedActorId(null)
        console.error('[VInbox] resolveActorIfNeeded failed:', e)
      } finally {
        if (!cancelled) setResolvingActor(false)
      }
    })()
    return () => { cancelled = true }
  }, [isLoading, myActorId, identity?.userId, authTick])

  const actorId = myActorId ?? resolvedActorId
  const isReady = Boolean(actorId) && !isLoading

  // server-backed state
  const [rows, setRows] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadingInbox, setLoadingInbox] = useState(false)
  const [errorText, setErrorText] = useState('')

  const title = useMemo(() => 'VPort Inbox', [])
  const hasRows = Array.isArray(rows) && rows.length > 0

  useEffect(() => {
    let cancelled = false
    const ac = new AbortController()

    async function load() {
      if (!isReady) return
      const ok = await ensureAuthReady()
      if (!ok) return

      setLoadingInbox(true)
      setErrorText('')
      try {
        const raw = await listVportInbox(actorId, { signal: ac.signal })
        const mapped = (raw || []).map(r => ({ id: r.conversation_id, ...r, last_message_preview: '' }))
        if (!cancelled) setRows(mapped)

        if (!cancelled && (!rows || rows.length === 0) && mapped.length === 0) {
          setTimeout(async () => {
            if (cancelled) return
            const raw2 = await listVportInbox(actorId, { signal: ac.signal })
            const mapped2 = (raw2 || []).map(r => ({ id: r.conversation_id, ...r }))
            if (!cancelled && mapped2.length) setRows(mapped2)
          }, 250)
        }
      } catch (e) {
        if (isAbortError(e)) return
        console.error('[VInbox] load inbox failed:', e)
        if (!cancelled) setErrorText('Could not load your inbox.')
      } finally {
        if (!cancelled) setLoadingInbox(false)
      }
    }

    load()
    return () => { cancelled = true; ac.abort() }
  }, [isReady, actorId, authTick])

  // --- realtime mirror of vc.inbox_entries for this actor ---
  useEffect(() => {
    if (!isReady) return
    let ch
    ;(async () => {
      const ok = await ensureAuthReady()
      if (!ok) return
      ch = supabase
        .channel(`vc-inbox-${actorId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'vc',
          table: 'inbox_entries',
          filter: `actor_id=eq.${actorId}`,
        }, (payload) => {
          setRows((prev) => {
            if (!Array.isArray(prev)) return prev
            const patch = payload.new ?? payload.old
            if (!patch) return prev
            return prev.map(r => r.conversation_id === patch.conversation_id
              ? {
                  ...r,
                  last_message_id: patch.last_message_id ?? r.last_message_id,
                  last_message_at: patch.last_message_at ?? r.last_message_at,
                  unread_count: typeof patch.unread_count === 'number' ? patch.unread_count : r.unread_count,
                  pinned: 'pinned' in patch ? patch.pinned : r.pinned,
                  archived: 'archived' in patch ? patch.archived : r.archived,
                  muted: 'muted' in patch ? patch.muted : r.muted,
                  history_cutoff_at: 'history_cutoff_at' in patch ? patch.history_cutoff_at : r.history_cutoff_at,
                  archived_until_new: 'archived_until_new' in patch ? patch.archived_until_new : r.archived_until_new,
                  partner_display_name: patch.partner_display_name ?? r.partner_display_name,
                  partner_username: patch.partner_username ?? r.partner_username,
                  partner_photo_url: patch.partner_photo_url ?? r.partner_photo_url,
                }
              : r)
          })
        })
        .subscribe()
    })()
    return () => { if (ch) supabase.removeChannel(ch) }
  }, [isReady, actorId])

  const openConversation = useCallback(async (conversationId) => {
    if (!isReady || !conversationId) return
    setRows(prev => Array.isArray(prev)
      ? prev.map(r => r.id === conversationId ? { ...r, unread_count: 0 } : r)
      : prev)
    try {
      await markConversationRead(conversationId, actorId, null)
    } catch {}
    nav(`/chat/${conversationId}?me=${encodeURIComponent(actorId)}`)
  }, [nav, isReady, actorId])

  // ⬇️ NEW: real delete handler (optimistic + debug + rollback)
  const handleDelete = useCallback(async (conversationId) => {
    if (!isReady || !conversationId) return
    const beforeRows = Array.isArray(rows) ? [...rows] : []
    const beforeRow = beforeRows.find(r => r.id === conversationId)

    console.groupCollapsed('[VInbox] delete click')
    console.log('actorId:', actorId, 'conversationId:', conversationId)
    console.log('beforeRow:', beforeRow || null)

    // Optimistic remove from UI
    setRows(prev => Array.isArray(prev) ? prev.filter(r => r.id !== conversationId) : prev)

    try {
      const res = await deleteThreadForMe(
        supabase,
        { conversationId, actorId },
        { archiveUntilNew: true }
      )

      if (!res?.ok) {
        console.error('[VInbox] delete FAILED', res?.error)
        setRows(beforeRows) // rollback UI
        alert('Could not delete this thread (client-side). Check console for details.')
        console.groupEnd()
        return
      }

      console.log('[VInbox] delete OK -> returned row:')
      console.table(res.data)
      console.groupEnd()
    } catch (e) {
      if (isAbortError(e)) {
        console.warn('[VInbox] delete aborted by signal')
      } else {
        console.error('[VInbox] delete threw', e)
      }
      setRows(beforeRows) // rollback
      console.groupEnd()
      alert('Delete failed. Restored the thread in the list.')
    }
  }, [isReady, actorId, rows])

  const handleNew = useCallback(() => {
    if (!isReady) return
    setOpenModal(true)
  }, [isReady])

  const handlePick = useCallback(async (picked) => {
    if (!isReady) return
    try {
      setBusy(true)
      const partnerActorId = await resolvePickedToActorId(picked)
      if (partnerActorId === actorId) { alert("You can't start a conversation with yourself."); return }
      const conversationId = await getOrCreateOneToOne(actorId, partnerActorId)
      try {
        const fresh = await listVportInbox(actorId)
        const mapped = (fresh || []).map(r => ({ id: r.conversation_id, ...r }))
        setRows(mapped)
      } catch {}
      nav(`/chat/${conversationId}?me=${encodeURIComponent(actorId)}`)
    } catch (e) {
      console.error('[VInbox] start conversation failed:', e)
      alert('Could not start conversation. Check console for details.')
    } finally {
      setBusy(false)
      setOpenModal(false)
    }
  }, [nav, isReady, actorId])

  const onSearch = useCallback((q) => {
    try {
      return inboxOnSearch(q, { currentActorId: actorId, excludeProfileId: identity?.userId })
    } catch {
      return inboxOnSearch(q)
    }
  }, [actorId, identity?.userId])

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between px-3 py-4">
          <div className="text-white text-xl font-semibold">{title}</div>
          <button type="button" aria-label="New conversation" onClick={handleNew} disabled={busy || !isReady}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-50">+ New</button>
        </div>

        {!isReady && (
          <div className="rounded-2xl overflow-hidden border border-white/10 px-4 py-3 mb-3 text-amber-200 bg-amber-500/10">
            {(isLoading || resolvingActor || !authReadyRef.current) ? 'Loading identity…' : 'No active actor. Switch accounts to start a conversation.'}
          </div>
        )}

        {isReady && loadingInbox && (
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 text-white/70 px-4 py-3 mb-3">Loading inbox…</div>
        )}
        {isReady && !!errorText && (
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-red-500/10 text-red-200 px-4 py-3 mb-3">{errorText}</div>
        )}

        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
          {isReady && rows === null && !loadingInbox && <div className="p-8 text-white/60">Loading…</div>}
          {isReady && Array.isArray(rows) && rows.length === 0 && !loadingInbox && <div className="p-8 text-white/60">No conversations yet.</div>}
          {isReady && Array.isArray(rows) && rows.length > 0 && rows.map(row => (
            <CardInbox
              key={row.id}
              conversation={row}
              onClick={() => openConversation(row.id)}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <div className="px-3 py-4 text-xs text-white/40 select-none">Inbox • vport • v2025-11-11</div>
      </div>

      <StartConversationModal open={openModal} onClose={() => setOpenModal(false)} onSearch={onSearch} onPick={handlePick} />
    </div>
  )
}
