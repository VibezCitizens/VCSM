// debuggers/global/GlobalDebugPanel.jsx
// ============================================================
// Global Auth + Identity + Feed Viewer Debugger — DEV-ONLY
// Shows the auth -> identity -> feed handoff in one place.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/features/identity/identityContext'
import { supabase } from '@/services/supabase/supabaseClient'
import { getGlobalDebugState, subscribeGlobalDebug, setGlobalSnapshot, setDbTruth, setNullIdentityReason, clearGlobalDebug } from './store.js'
import { collectAllDebugState } from '../cycle.js'
import { fetchDbTruth } from './fetchDbTruth.js'
import { getIdentityDebugState, subscribeIdentityDebug } from '../identity/store.js'
import { getFeedDebugState, subscribeFeedDebug } from '../feed/store.js'

export default function GlobalDebugPanel() {
  if (!import.meta.env.DEV) return null

  const { user, loading: authLoading } = useAuth()
  const { identity, loading: idLoading } = useIdentity()
  const [state, setState] = useState(getGlobalDebugState)
  const [identityDebug, setIdentityDebug] = useState(getIdentityDebugState)
  const [feedDebug, setFeedDebug] = useState(getFeedDebugState)
  const [minimized, setMinimized] = useState(true)
  const [railTarget, setRailTarget] = useState(null)

  useEffect(() => {
    setRailTarget(document.getElementById('debug-rail-right'))
  }, [])
  const [tab, setTab] = useState('viewer')
  const [fetching, setFetching] = useState(false)
  const currentIdentity = useMemo(
    () => buildCurrentIdentitySnapshot({
      identity,
      identityDebug,
      authUserId: user?.id ?? null,
    }),
    [identity, identityDebug, user?.id]
  )

  useEffect(() => {
    setState(getGlobalDebugState())
    return subscribeGlobalDebug(() => setState(getGlobalDebugState()))
  }, [])

  useEffect(() => {
    setIdentityDebug(getIdentityDebugState())
    return subscribeIdentityDebug(() => setIdentityDebug(getIdentityDebugState()))
  }, [])

  useEffect(() => {
    setFeedDebug(getFeedDebugState())
    return subscribeFeedDebug(() => setFeedDebug(getFeedDebugState()))
  }, [])

  // Auto-snapshot on identity change
  useEffect(() => {
    const reason = computeGlobalStatus({
      authUserId: user?.id ?? null,
      authLoading,
      idLoading,
      identity: currentIdentity,
    })

    setGlobalSnapshot({
      auth: { userId: user?.id ?? null, email: user?.email ?? null, authLoading },
      identity: currentIdentity,
      idLoading,
      status: reason,
      at: new Date().toISOString(),
    })

    setNullIdentityReason(
      reason === 'OK' || reason === 'AUTH_LOADING' || reason === 'IDENTITY_LOADING'
        ? null
        : reason
    )
  }, [user?.id, user?.email, authLoading, idLoading, currentIdentity])

  const handleFetchTruth = useCallback(async () => {
    if (!user?.id) return
    setFetching(true)
    try {
      const truth = await fetchDbTruth(supabase, user.id)
      setDbTruth(truth)
    } finally {
      setFetching(false)
    }
  }, [user?.id])

  const copyAll = useCallback(() => {
    try {
      const allState = collectAllDebugState()
      navigator.clipboard.writeText(JSON.stringify(allState, null, 2))
    } catch (_) {}
  }, [state, identityDebug, feedDebug])

  const viewer = buildViewerSnapshot({ state, identityDebug, feedDebug })

  if (!railTarget) return null

  const s = viewer.status ?? state.snapshot?.status ?? '?'
  const color = s === 'OK' ? '#4ade80' : s === 'IDENTITY_LOADING' || s === 'AUTH_LOADING' ? '#60a5fa' : '#f87171'

  const snap = state.snapshot ?? {}
  const db = state.dbTruth ?? {}
  const tabs = ['viewer', 'who', 'platform', 'actors', 'diff']

  return createPortal(
    <div>
  {minimized ? (
    <button onClick={() => setMinimized(false)} style={{
      background: '#0d1117', color, border: `1px solid ${color}44`, borderRadius: 999,
      padding: '3px 14px', fontSize: 11, fontFamily: "'SF Mono', monospace",
      boxShadow: '0 2px 12px rgba(0,0,0,0.5)', cursor: 'pointer', opacity: 0.9,
    }}>
      {s === 'OK' ? `✓ ${state.snapshot?.identity?.displayName ?? state.snapshot?.identity?.actorId?.slice(0,8) ?? '?'}` : s}
    </button>
  ) : (
    <div style={{
      width: 420, maxHeight: '85vh',
      background: '#0d1117', border: '1px solid #1a2a3a', borderRadius: 8,
      color: '#e2e8f0', fontFamily: "'SF Mono', monospace", fontSize: 11,
      overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #1a2a3a' }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#4ade80', letterSpacing: 1 }}>GLOBAL DEBUG</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={handleFetchTruth} disabled={fetching} style={{ background: 'none', border: '1px solid #334155', color: '#60a5fa', cursor: 'pointer', fontSize: 10, borderRadius: 4, padding: '2px 8px' }}>
            {fetching ? '...' : 'DB Truth'}
          </button>
          <button onClick={clearGlobalDebug} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 10 }}>clear</button>
          <button onClick={copyAll} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 10 }}>copy</button>
          <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>_</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a2a3a' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '4px 0', background: tab === t ? '#1e293b' : 'transparent',
            border: 'none', color: tab === t ? '#60a5fa' : '#475569', cursor: 'pointer', fontSize: 10, fontWeight: 600,
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ maxHeight: 'calc(85vh - 70px)', overflowY: 'auto', padding: '8px 10px' }}>

        {tab === 'who' && (
          <>
            <Section title="AUTH">
              <R label="userId" val={snap.auth?.userId?.slice(0, 16)} />
              <R label="email" val={snap.auth?.email} />
              <R label="authLoading" val={snap.auth?.authLoading} bool />
            </Section>
            <Section title="IDENTITY">
              {snap.identity ? <>
                <R label="actorId" val={snap.identity.actorId?.slice(0, 16)} />
                <R label="kind" val={snap.identity.kind} />
                <R label="displayName" val={snap.identity.displayName} />
                <R label="username" val={snap.identity.username} />
                <R label="realmId" val={snap.identity.realmId?.slice(0, 12)} />
                <R label="userId" val={snap.identity.userId?.slice(0, 12)} />
                <R label="uaaId" val={snap.identity.userAppAccountId?.slice(0, 12)} />
                <R label="linkId" val={snap.identity.actorLinkId?.slice(0, 12)} />
                <R label="engineResolved" val={snap.identity.engineResolved} bool />
              </> : <div style={{ color: '#f87171' }}>NULL</div>}
            </Section>
            <Section title="STATUS">
              <StatusBadge status={snap.status} />
              {state.nullReason && snap.status !== 'OK' && (
                <div style={{ color: '#f87171', marginTop: 4 }}>Reason: {state.nullReason}</div>
              )}
            </Section>
          </>
        )}

        {tab === 'viewer' && (
          <>
            <Section title="AUTH">
              <R label="auth user id" val={viewer.authUserId?.slice(0, 16)} />
              <R label="auth loading" val={snap.auth?.authLoading} bool />
              <R label="identity loading" val={snap.idLoading} bool />
            </Section>

            <Section title="IDENTITY">
              <R label="identity actor id" val={viewer.identityActorId?.slice(0, 16)} />
              <R label="identity kind" val={viewer.identityKind} />
              <R label="realm id" val={viewer.realmId?.slice(0, 16)} />
              <R label="active actor link id" val={viewer.activeActorLinkId?.slice(0, 16)} />
            </Section>

            <Section title="ENGINE -> HYDRATION">
              <R label="selected actor from engine" val={viewer.selectedActorFromEngine?.slice(0, 16)} />
              <R label="selected link from engine" val={viewer.selectedActorLinkFromEngine?.slice(0, 16)} />
              <R label="hydrated actor id" val={viewer.hydratedActorId?.slice(0, 16)} />
              <R label="hydration step" val={viewer.hydrationStep} />
            </Section>

            <Section title="FEED HANDOFF">
              <R label="feed viewerActorId" val={viewer.feedViewerActorId?.slice(0, 16)} />
              <R label="feed realmId" val={viewer.feedRealmId?.slice(0, 16)} />
              <R label="feed fetch skipped" val={viewer.feedFetchSkipped} bool />
              <R label="skip reason" val={viewer.feedSkipReason} />
              <R label="latest feed step" val={viewer.feedLatestStep} />
            </Section>

            <Section title="STATUS">
              <StatusBadge status={viewer.status} />
              {viewer.statusNote && (
                <div style={{ color: '#f87171', marginTop: 4 }}>{viewer.statusNote}</div>
              )}
            </Section>
          </>
        )}

        {tab === 'platform' && (
          <>
            {!db.fetchedAt ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: 20 }}>Click "DB Truth" to fetch live data</div>
            ) : <>
              <Section title="APP">
                <R label="id" val={db.app?.id?.slice(0, 12)} />
                <R label="key" val={db.app?.key} />
                <R label="active" val={db.app?.is_active} bool />
              </Section>
              <Section title="ACCESS">
                <R label="status" val={db.access?.status} />
                <R label="granted_at" val={db.access?.granted_at?.slice(0, 19)} />
              </Section>
              <Section title="ACCOUNT">
                <R label="id" val={db.account?.id?.slice(0, 12)} />
                <R label="status" val={db.account?.status} />
                <R label="count" val={db.accounts?.length} />
              </Section>
              <Section title="PREFERENCES">
                <R label="active_link" val={db.preferences?.active_actor_link_id?.slice(0, 12)} />
                <R label="last_link" val={db.preferences?.last_actor_link_id?.slice(0, 12)} />
              </Section>
              <Section title="STATE">
                <R label="onboarding" val={db.state?.onboarding_status} />
                <R label="account_status" val={db.state?.account_status} />
                <R label="requires_onboarding" val={db.state?.requires_onboarding} bool />
                <R label="last_link" val={db.state?.last_actor_link_id?.slice(0, 12)} />
                <R label="first_login" val={db.state?.first_login_at?.slice(0, 19)} />
                <R label="last_login" val={db.state?.last_login_at?.slice(0, 19)} />
              </Section>
              <Section title={`ACTOR LINKS (${db.actorLinks?.length ?? 0})`}>
                {(db.actorLinks ?? []).map((l, i) => (
                  <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #111827' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: l.status === 'active' ? '#4ade80' : '#f87171', fontWeight: 600 }}>{l.actor_kind}</span>
                      <span style={{ color: '#475569', fontSize: 9 }}>{l.id?.slice(0, 8)}</span>
                    </div>
                    <div style={{ fontSize: 9, color: '#64748b' }}>
                      actor: {l.actor_id?.slice(0, 8)} | primary: {l.is_primary ? 'Y' : 'N'} | switchable: {l.is_switchable ? 'Y' : 'N'}
                      {db.preferences?.active_actor_link_id === l.id && <span style={{ color: '#4ade80', marginLeft: 4 }}>← ACTIVE</span>}
                    </div>
                  </div>
                ))}
              </Section>
              <div style={{ color: '#334155', fontSize: 9, marginTop: 4 }}>Fetched: {db.fetchedAt?.slice(11, 19)}</div>
            </>}
          </>
        )}

        {tab === 'actors' && (
          <>
            {!db.fetchedAt ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: 20 }}>Click "DB Truth" to fetch live data</div>
            ) : <>
              <Section title="PROFILE">
                <R label="id" val={db.profile?.id?.slice(0, 12)} />
                <R label="username" val={db.profile?.username} />
                <R label="display_name" val={db.profile?.display_name} />
                <R label="discoverable" val={db.profile?.discoverable} bool />
              </Section>
              <Section title={`VC ACTORS (${db.actors?.length ?? 0})`}>
                {(db.actors ?? []).map((a, i) => (
                  <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #111827' }}>
                    <R label="id" val={a.id?.slice(0, 12)} />
                    <R label="kind" val={a.kind} />
                    <R label="is_void" val={a.is_void} bool />
                    <R label="uaa_bridge" val={a.user_app_account_id?.slice(0, 12)} />
                  </div>
                ))}
              </Section>
              <Section title={`VPORTS (${db.vports?.length ?? 0})`}>
                {(db.vports ?? []).map((v, i) => (
                  <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #111827' }}>
                    <R label="name" val={v.name} />
                    <R label="slug" val={v.slug} />
                    <R label="active" val={v.is_active} bool />
                  </div>
                ))}
              </Section>
              <Section title={`ACTOR OWNERS (${db.actorOwners?.length ?? 0})`}>
                {(db.actorOwners ?? []).map((o, i) => (
                  <div key={i} style={{ fontSize: 9, color: '#64748b', padding: '2px 0' }}>
                    actor: {o.actor_id?.slice(0, 8)} | primary: {o.is_primary ? 'Y' : 'N'} | void: {o.is_void ? 'Y' : 'N'}
                  </div>
                ))}
              </Section>
            </>}
          </>
        )}

        {tab === 'diff' && (
          <>
            <Section title="USER MATCH">
              <DiffRow label="session" a={snap.auth?.userId?.slice(0, 12)} b={snap.identity?.userId?.slice(0, 12)} bLabel="identity" />
              <DiffRow label="db account" a={db.account?.user_id?.slice(0, 12)} b={snap.auth?.userId?.slice(0, 12)} bLabel="session" />
            </Section>
            <Section title="ACTIVE LINK">
              <DiffRow label="runtime" a={snap.identity?.actorLinkId?.slice(0, 12)} b={db.preferences?.active_actor_link_id?.slice(0, 12)} bLabel="db prefs" />
              <DiffRow label="db state" a={db.state?.last_actor_link_id?.slice(0, 12)} b={db.preferences?.active_actor_link_id?.slice(0, 12)} bLabel="db prefs" />
            </Section>
            <Section title="ACTOR">
              <DiffRow label="runtime" a={snap.identity?.actorId?.slice(0, 12)} b={findActorForLink(db.actorLinks, db.preferences?.active_actor_link_id)?.slice(0, 12)} bLabel="db link→actor" />
            </Section>
            {!db.fetchedAt && <div style={{ color: '#475569', fontSize: 9 }}>Fetch DB Truth for full diff</div>}
          </>
        )}
      </div>
    </div>
  )}
    </div>,
    railTarget
  )
}

function findActorForLink(links, linkId) {
  if (!links || !linkId) return null
  return links.find(l => l.id === linkId)?.actor_id ?? null
}

function buildCurrentIdentitySnapshot({ identity, identityDebug, authUserId }) {
  const debugIdentity = identityDebug?.identitySnapshot ?? null
  const meta = identity?._engineMeta ?? {}

  const liveIdentity =
    identity || debugIdentity
      ? {
          actorId: identity?.actorId ?? null,
          kind: identity?.kind ?? null,
          displayName: identity?.displayName ?? null,
          username: identity?.username ?? null,
          realmId: identity?.realmId ?? null,
          userId: meta.userId ?? null,
          userAppAccountId: meta.userAppAccountId ?? null,
          actorLinkId: meta.actorLinkId ?? null,
          actorSource: meta.actorSource ?? null,
          engineResolved: meta.engineResolved ?? false,
        }
      : null

  const debugOwnsCurrentUser =
    !!debugIdentity?.actorId &&
    (!debugIdentity?.userId || !authUserId || debugIdentity.userId === authUserId)

  const liveOwnsCurrentUser =
    !!liveIdentity?.actorId &&
    (!liveIdentity?.userId || !authUserId || liveIdentity.userId === authUserId)

  if (!debugIdentity && !liveIdentity) return null

  if (debugOwnsCurrentUser) {
    return {
      ...liveIdentity,
      ...debugIdentity,
      actorId: debugIdentity.actorId ?? liveIdentity?.actorId ?? null,
      kind: debugIdentity.kind ?? liveIdentity?.kind ?? null,
      displayName: debugIdentity.displayName ?? liveIdentity?.displayName ?? null,
      username: debugIdentity.username ?? liveIdentity?.username ?? null,
      realmId: debugIdentity.realmId ?? liveIdentity?.realmId ?? null,
      userId: debugIdentity.userId ?? liveIdentity?.userId ?? null,
      userAppAccountId: debugIdentity.userAppAccountId ?? liveIdentity?.userAppAccountId ?? null,
      actorLinkId: debugIdentity.actorLinkId ?? liveIdentity?.actorLinkId ?? null,
      actorSource: debugIdentity.actorSource ?? liveIdentity?.actorSource ?? null,
      engineResolved: debugIdentity.engineResolved ?? liveIdentity?.engineResolved ?? false,
    }
  }

  if (liveOwnsCurrentUser) {
    return liveIdentity
  }

  return {
    ...liveIdentity,
    ...debugIdentity,
    actorId: debugIdentity?.actorId ?? liveIdentity?.actorId ?? null,
    kind: debugIdentity?.kind ?? liveIdentity?.kind ?? null,
    displayName: debugIdentity?.displayName ?? liveIdentity?.displayName ?? null,
    username: debugIdentity?.username ?? liveIdentity?.username ?? null,
    realmId: debugIdentity?.realmId ?? liveIdentity?.realmId ?? null,
    userId: debugIdentity?.userId ?? liveIdentity?.userId ?? null,
    userAppAccountId: debugIdentity?.userAppAccountId ?? liveIdentity?.userAppAccountId ?? null,
    actorLinkId: debugIdentity?.actorLinkId ?? liveIdentity?.actorLinkId ?? null,
    actorSource: debugIdentity?.actorSource ?? liveIdentity?.actorSource ?? null,
    engineResolved: debugIdentity?.engineResolved ?? liveIdentity?.engineResolved ?? false,
  }
}

function computeGlobalStatus({ authUserId, authLoading, idLoading, identity }) {
  if (!authUserId) return 'NO_SESSION_USER'
  if (authLoading) return 'AUTH_LOADING'
  if (idLoading) return 'IDENTITY_LOADING'
  if (!identity?.actorId) return 'NULL_IDENTITY'
  if (identity?.userId && identity.userId !== authUserId) {
    return 'OWNERSHIP_MISMATCH'
  }
  return 'OK'
}

function findLatestEvent(events, step) {
  if (!Array.isArray(events)) return null
  return events.find((event) => event?.step === step) ?? null
}

function findLatestEventBySteps(events, steps) {
  if (!Array.isArray(events)) return null
  const allowed = new Set(Array.isArray(steps) ? steps : [])
  return events.find((event) => allowed.has(event?.step)) ?? null
}

function buildViewerSnapshot({ state, identityDebug, feedDebug }) {
  const snap = state?.snapshot ?? {}
  const identityEvents = identityDebug?.events ?? []
  const feedEvents = feedDebug?.events ?? []

  const activeActorSelected = findLatestEvent(identityEvents, 'ACTIVE_ACTOR_SELECTED')
  const hydrationSuccess = findLatestEvent(identityEvents, 'HYDRATION_SUCCESS')
  const hydrationReadSuccess = findLatestEvent(identityEvents, 'HYDRATION_ACTOR_READ_SUCCESS')
  const hydrationReadError = findLatestEvent(identityEvents, 'HYDRATION_ACTOR_READ_ERROR')
  const hydrationReadEmpty = findLatestEvent(identityEvents, 'HYDRATION_ACTOR_READ_EMPTY')
  const feedLifecycle = findLatestEventBySteps(feedEvents, [
    'FEED_REQUEST_SKIPPED',
    'FEED_REQUEST_SUCCESS',
    'FEED_REQUEST_START',
  ])

  const latestHydrationStep =
    hydrationSuccess?.step ??
    hydrationReadError?.step ??
    hydrationReadEmpty?.step ??
    hydrationReadSuccess?.step ??
    null

  const feedSkipped = feedLifecycle?.step === 'FEED_REQUEST_SKIPPED'
  const status =
    !snap.auth?.userId ? 'NO_SESSION_USER'
    : snap.auth?.authLoading ? 'AUTH_LOADING'
    : snap.idLoading ? 'IDENTITY_LOADING'
    : !snap.identity?.actorId && feedSkipped ? 'FEED_SKIPPED_NO_VIEWER'
    : !snap.identity?.actorId ? 'NULL_IDENTITY'
    : feedSkipped ? 'FEED_SKIPPED'
    : 'OK'

  const statusNote =
    feedSkipped
      ? feedLifecycle?.message ?? 'Feed request skipped'
      : !snap.identity?.actorId && activeActorSelected?.payload?.actorId
        ? 'Engine selected an actor, but hydration did not complete'
        : !snap.identity?.actorId
          ? state?.nullReason ?? 'Identity actor is null'
          : null

  return {
    authUserId: snap.auth?.userId ?? null,
    identityActorId: snap.identity?.actorId ?? null,
    identityKind: snap.identity?.kind ?? null,
    realmId: snap.identity?.realmId ?? null,
    activeActorLinkId: snap.identity?.actorLinkId ?? activeActorSelected?.payload?.actorLinkId ?? null,
    selectedActorFromEngine: activeActorSelected?.payload?.actorId ?? null,
    selectedActorLinkFromEngine: activeActorSelected?.payload?.actorLinkId ?? null,
    hydratedActorId: hydrationSuccess?.payload?.actorId ?? snap.identity?.actorId ?? null,
    hydrationStep: latestHydrationStep,
    feedViewerActorId: feedDebug?.viewer?.actorId ?? null,
    feedRealmId: feedDebug?.viewer?.realmId ?? null,
    feedFetchSkipped: feedSkipped,
    feedSkipReason: feedSkipped ? (feedLifecycle?.message ?? null) : null,
    feedLatestStep: feedLifecycle?.step ?? null,
    status,
    statusNote,
  }
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, marginBottom: 3 }}>{title}</div>
      {children}
    </div>
  )
}

function R({ label, val, bool }) {
  if (val === undefined || val === null) {
    return <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#475569' }}>{label}</span><span style={{ color: '#334155' }}>—</span></div>
  }
  const color = bool ? (val ? '#4ade80' : '#f87171') : '#94a3b8'
  const text = bool ? (val ? 'YES' : 'NO') : String(val)
  return <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#475569' }}>{label}</span><span style={{ color, fontWeight: bool ? 600 : 400 }}>{text}</span></div>
}

function DiffRow({ label, a, b, bLabel }) {
  const match = a && b && a === b
  const color = !a || !b ? '#475569' : match ? '#4ade80' : '#f87171'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
      <span style={{ color: '#475569' }}>{label}</span>
      <span style={{ color }}>{a ?? '—'} {match ? '=' : '≠'} {b ?? '—'}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    OK: '#4ade80', AUTH_LOADING: '#60a5fa', IDENTITY_LOADING: '#60a5fa',
    NULL_IDENTITY: '#f87171', OWNERSHIP_MISMATCH: '#f87171', NO_SESSION_USER: '#fbbf24',
    FEED_SKIPPED_NO_VIEWER: '#f87171', FEED_SKIPPED: '#fbbf24',
  }
  const color = colors[status] ?? '#94a3b8'
  return <span style={{ color, fontWeight: 700, fontSize: 12 }}>{status ?? 'UNKNOWN'}</span>
}
