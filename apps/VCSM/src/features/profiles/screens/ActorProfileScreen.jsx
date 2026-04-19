// src/features/profiles/screens/ActorProfileScreen.jsx
// ─────────────────────────────────────────────────────────────
// Entry point for all /profile/:actorId routes.
//
// URL formats handled:
//   "self"                    → viewer's own profile — redirects to canonical
//   {vport-slug}              → canonical vport URL   e.g. "tyba-restaurant"
//   {username}                → canonical user URL    e.g. "architect"
//   bare UUID                 → legacy: redirect to canonical
//   {uuid}-{suffix}           → legacy: redirect to canonical
//
// Resolution flow:
//   "self"         → identity.actorId known → fetch canonical slug → redirect
//   UUID in param  → actorId known          → fetch canonical slug → redirect
//   No UUID        → resolveActorBySlug(param) → actorId → render
//
// Strict rule: every route must resolve through one of the three paths above.
// State handoff from redirects is NOT used to bypass slug resolution.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Navigate } from "react-router-dom";
import { useIdentity } from "@/state/identity/identityContext";

import { useActorKind } from "@/features/profiles/hooks/useActorKind";
import { useVportType } from "@/features/profiles/hooks/useVportType";
import { useActorCanonicalSlug } from "@/features/profiles/hooks/useActorCanonicalSlug";
import { useActorSlugRedirect } from "@/features/profiles/hooks/useActorSlugRedirect";
import { useResolveActorBySlug } from "@/features/profiles/hooks/useResolveActorBySlug";

import { PROFILE_KIND_REGISTRY } from "@/features/profiles/kinds/profileKindRegistry";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { extractActorIdFromSlug } from "@/shared/lib/actorSlug";
import { appendIOSProdDebugLog } from "@/shared/lib/iosProdDebugger";
import "@/features/profiles/styles/profiles-modern.css";

// ── BUGSBUNNY dev probe ────────────────────────────────────────
// Portals into #debug-rail-right. Gated by import.meta.env.DEV.
function _DevProbe(p) {
  if (!import.meta.env.DEV) return null
  const [minimized, setMinimized] = useState(false)
  const [railTarget, setRailTarget] = useState(null)

  useEffect(() => {
    setRailTarget(document.getElementById('debug-rail-right'))
  }, [])

  if (!railTarget) return null

  const R = ({ label, value, isBad }) => (
    <div style={{ display:'flex', gap:8, borderBottom:'1px solid #222', padding:'2px 0' }}>
      <span style={{ color:'#888', minWidth:170, fontSize:11, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:11, fontFamily:'monospace', wordBreak:'break-all',
        color: isBad ? '#f87171' : (value == null ? '#6b7280' : '#34d399') }}>
        {value === null ? 'null' : value === undefined ? 'undef' : String(value)}
      </span>
    </div>
  )

  const willFeed = (p.slugNotFound && !p.hasUuidInUrl && !p.isSelf) || (!p.canonicalSlug && !p.slugLoading && !p.isSelf)
  const mismatch = p.canonicalSlug && p.routeParam !== p.canonicalSlug

  const copy = () => {
    try { navigator.clipboard.writeText(JSON.stringify(p, null, 2)) } catch (_) {}
  }

  return createPortal(
    <div>
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          style={{
            background: '#0a0a0f', color: '#a78bfa', border: '1px solid #7c3aed44',
            borderRadius: 999, padding: '4px 12px', fontSize: 11, fontFamily: 'monospace',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)', cursor: 'pointer', opacity: 0.9,
          }}
        >
          🐰 ROUTE
        </button>
      ) : (
        <div style={{
          background:'#0a0a0f', border:'1px solid #7c3aed', borderRadius:8,
          padding:'10px 14px', minWidth:330, boxShadow:'0 8px 32px rgba(0,0,0,.7)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ color:'#a78bfa', fontWeight:700, fontSize:12 }}>🐰 BUGSBUNNY — Profile Route</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={copy} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:11 }}>copy</button>
              <button onClick={() => setMinimized(true)} style={{ background:'none', border:'none', color:'#fbbf24', cursor:'pointer', fontSize:12, fontWeight:700 }}>_</button>
            </div>
          </div>
          <R label="routeParam"            value={p.routeParam} />
          <R label="isSelf"                value={String(p.isSelf)} />
          <R label="actorIdForSelf"        value={p.actorIdForSelf} isBad={p.isSelf && !p.actorIdForSelf} />
          <R label="uuidFromParam"         value={p.uuidFromParam} />
          <R label="hasUuidInUrl"          value={String(p.hasUuidInUrl)} />
          <R label="slugToResolve"         value={p.slugToResolve} />
          <R label="slugResolveLoading"    value={String(p.slugResolveLoading)} />
          <R label="actorIdFromSlug"       value={p.actorIdFromSlug} isBad={p.slugNotFound} />
          <R label="slugNotFound"          value={String(p.slugNotFound)} isBad={p.slugNotFound} />
          <R label="resolvedActorId"       value={p.resolvedActorId} isBad={!p.resolvedActorId && !p.slugResolveLoading} />
          <R label="slugLoading"           value={String(p.slugLoading)} />
          <R label="canonicalSlug"         value={p.canonicalSlug} isBad={!p.canonicalSlug && !p.slugLoading} />
          <R label="routeParam===canonical" value={String(p.routeParam === p.canonicalSlug)} isBad={mismatch} />
          <R label="kindLoading"           value={String(p.kindLoading)} />
          <R label="kind"                  value={p.kind} isBad={!p.kind && !p.kindLoading} />
          {willFeed && (
            <div style={{ marginTop:6, padding:'5px 8px', background:'#7f1d1d',
              borderRadius:4, color:'#fca5a5', fontSize:11, fontWeight:700 }}>
              ⚠ WILL REDIRECT TO /feed
            </div>
          )}
          {mismatch && (
            <div style={{ marginTop:6, padding:'5px 8px', background:'#1e1b4b',
              borderRadius:4, color:'#c4b5fd', fontSize:11 }}>
              ↻ redirect pending: {p.routeParam} → {p.canonicalSlug}
            </div>
          )}
        </div>
      )}
    </div>,
    railTarget
  )
}
// ──────────────────────────────────────────────────────────────

// ── Production debug panel ─────────────────────────────────────
// Activated by: localStorage.setItem('__vcsm_dbg', '1') in browser console
// Then navigate to a profile — instead of being sent to /feed, you see this.
// Remove after root cause is confirmed in production.
function _ProdDebugPanel(p) {
  const R = ({ label, value, bad }) => (
    <div style={{ display:'flex', gap:8, borderBottom:'1px solid #1f1f2e', padding:'3px 0' }}>
      <span style={{ color:'#6b7280', minWidth:190, fontSize:11, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:11, fontFamily:'monospace', wordBreak:'break-all',
        color: bad ? '#f87171' : (value == null ? '#4b5563' : '#34d399') }}>
        {value == null ? 'null' : String(value)}
      </span>
    </div>
  )
  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'#070710',
      overflow:'auto', padding:24, fontFamily:'sans-serif' }}>
      <div style={{ maxWidth:540, margin:'0 auto', background:'#0d0d1a',
        border:'2px solid #7c3aed', borderRadius:12, padding:20 }}>
        <div style={{ color:'#a78bfa', fontWeight:700, fontSize:14, marginBottom:4 }}>
          PROD DEBUG — Profile Route Trace
        </div>
        <div style={{ color:'#6b7280', fontSize:11, marginBottom:12 }}>
          Active because __vcsm_dbg is set in localStorage.
          Run localStorage.removeItem('__vcsm_dbg') to restore normal behavior.
        </div>
        <R label="routeParam"             value={p.routeParam} />
        <R label="isSelf"                 value={String(p.isSelf)} />
        <R label="hasUuidInUrl"           value={String(p.hasUuidInUrl)} />
        <R label="uuidFromParam"          value={p.uuidFromParam} />
        <R label="slugToResolve"          value={p.slugToResolve} />
        <R label="slugResolveLoading"     value={String(p.slugResolveLoading)} />
        <R label="actorIdFromSlug"        value={p.actorIdFromSlug} bad={p.slugNotFound} />
        <R label="slugNotFound"           value={String(p.slugNotFound)} bad={p.slugNotFound} />
        <R label="resolvedActorId"        value={p.resolvedActorId} bad={!p.resolvedActorId && !p.slugResolveLoading} />
        <R label="canonicalSlug"          value={p.canonicalSlug} bad={!p.canonicalSlug && !p.slugLoading} />
        <R label="slugLoading"            value={String(p.slugLoading)} />
        <R label="routeParam===canonical" value={String(p.routeParam === p.canonicalSlug)} bad={p.canonicalSlug && p.routeParam !== p.canonicalSlug} />
        <div style={{ marginTop:12, padding:'8px 10px', background:'#1e0a2e',
          borderRadius:6, color:'#d8b4fe', fontSize:11 }}>
          <strong>Why feed redirect fired:</strong>
          {p.slugNotFound && !p.hasUuidInUrl
            ? ' slugNotFound=true and param has no UUID — slug lookup returned nothing.'
            : !p.canonicalSlug && !p.slugLoading
            ? ' canonicalSlug is null — controller returned no slug for this actorId.'
            : p.canonicalSlug && p.routeParam !== p.canonicalSlug
            ? ` routeParam "${p.routeParam}" !== canonicalSlug "${p.canonicalSlug}" — redirect loop.`
            : ' Unknown — still loading or race condition.'}
        </div>
      </div>
    </div>
  )
}
// ──────────────────────────────────────────────────────────────

const SKELETON = (
  <div className="profiles-modern px-4 py-6">
    <SkeletonCardList count={2} bodyHeight="h-48" />
  </div>
)

export default function ActorProfileScreen() {
  const { actorId: routeParam } = useParams();
  const { identity, identityLoading } = useIdentity();
  const lastProfileTraceRef = useRef('');
  const hasLoggedRenderRef = useRef(false);

  const debugMode = typeof localStorage !== 'undefined' && !!localStorage.getItem('__vcsm_dbg')

  // ── Self detection ─────────────────────────────────────────
  // "self" is a reserved shortcut that redirects to the viewer's canonical
  // profile URL. It is NOT a slug and must never hit DB resolution.
  const isSelf = routeParam === "self";

  // When "self", wire the viewer's actorId directly into the pipeline so
  // useActorCanonicalSlug can compute the canonical slug and the redirect
  // can fire. identity may be null while loading — that's handled below.
  const actorIdForSelf = isSelf ? (identity?.actorId ?? null) : null;

  // ── UUID detection ─────────────────────────────────────────
  const uuidFromParam = isSelf ? null : extractActorIdFromSlug(routeParam);
  const hasUuidInUrl = uuidFromParam !== null;

  // ── Slug resolution (strict) ───────────────────────────────
  // Only skip when the route is "self" (no DB slug exists) or the URL
  // contains a UUID (actorId is already known).
  // Slug routes ALWAYS hit the DB — no bypasses.
  const slugToResolve = isSelf || hasUuidInUrl ? null : routeParam;

  const {
    actorId: actorIdFromSlug,
    loading: slugResolveLoading,
    notFound: slugNotFound,
    error: slugResolveError,
  } = useResolveActorBySlug(slugToResolve);

  // ── Resolved actor ID (strict) ─────────────────────────────
  // Sources in priority order:
  //   1. "self"  → identity.actorId (viewer's own actor)
  //   2. UUID    → extracted from param
  //   3. slug    → resolved from DB
  // No other source is accepted.
  const resolvedActorId = actorIdForSelf ?? uuidFromParam ?? actorIdFromSlug ?? null;

  // ── Canonical slug pipeline ────────────────────────────────
  const { canonicalSlug, loading: slugLoading } =
    useActorCanonicalSlug(resolvedActorId);

  // ── Redirect enforcement ───────────────────────────────────
  // Fires when routeParam !== canonicalSlug (covers "self", UUID URLs, etc.)
  // Passes resolvedActorId in state so the destination can confirm the actor
  // without a second DB round-trip for the UUID→slug case.
  useActorSlugRedirect(routeParam, canonicalSlug, resolvedActorId);

  // ── Parallel prefetch ──────────────────────────────────────
  const { loading: kindLoading, kind } = useActorKind(resolvedActorId);
  const { loading: vportTypeLoading, vportType: prefetchedVportType } =
    useVportType(resolvedActorId);
  const slugResolveErrorCode = slugResolveError?.code ?? null;
  const slugResolveErrorMessage = slugResolveError?.message ?? null;

  useEffect(() => {
    hasLoggedRenderRef.current = false;
    appendIOSProdDebugLog('profile_route_enter', {
      routeParam,
      debugMode,
    });
  }, [routeParam, debugMode]);

  useEffect(() => {
    const snapshot = {
      routeParam,
      isSelf,
      actorIdForSelf,
      uuidFromParam,
      hasUuidInUrl,
      slugToResolve,
      slugResolveLoading,
      slugNotFound,
      slugResolveErrorCode,
      slugResolveErrorMessage,
      actorIdFromSlug,
      resolvedActorId,
      canonicalSlug,
      slugLoading,
      kindLoading,
      kind,
      identityLoading,
      identityActorId: identity?.actorId ?? null,
    };
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastProfileTraceRef.current) return;
    lastProfileTraceRef.current = serialized;
    appendIOSProdDebugLog('profile_route_state', snapshot);
  }, [
    routeParam,
    isSelf,
    actorIdForSelf,
    uuidFromParam,
    hasUuidInUrl,
    slugToResolve,
    slugResolveLoading,
    slugNotFound,
    slugResolveErrorCode,
    slugResolveErrorMessage,
    actorIdFromSlug,
    resolvedActorId,
    canonicalSlug,
    slugLoading,
    kindLoading,
    kind,
    identityLoading,
    identity?.actorId,
  ]);

  // ── Dev probe (DEV only, stripped by Vite in production) ──
  const probe = (
    <_DevProbe
      routeParam={routeParam}
      isSelf={isSelf}
      actorIdForSelf={actorIdForSelf}
      uuidFromParam={uuidFromParam}
      hasUuidInUrl={hasUuidInUrl}
      slugToResolve={slugToResolve}
      actorIdFromSlug={actorIdFromSlug}
      resolvedActorId={resolvedActorId}
      canonicalSlug={canonicalSlug}
      slugLoading={slugLoading}
      slugResolveLoading={slugResolveLoading}
      slugNotFound={slugNotFound}
      kindLoading={kindLoading}
      kind={kind}
    />
  )

  // ── Identity gate ──────────────────────────────────────────
  if (identityLoading) return <>{probe}{SKELETON}</>
  if (!identity) {
    appendIOSProdDebugLog('profile_route_redirect_login', {
      reason: 'identity_missing',
      routeParam,
    });
    return <Navigate to="/login" replace />;
  }

  // ── Slug resolution loading ────────────────────────────────
  if (slugResolveLoading) return <>{probe}{SKELETON}</>

  // ── Slug resolution failure (query/permission/network) ─────
  // Keep this distinct from true "not found" so production query failures
  // do not silently bounce users to /feed.
  if (slugResolveError && !hasUuidInUrl && !isSelf) {
    appendIOSProdDebugLog('profile_route_slug_resolve_error_gate', {
      routeParam,
      slugToResolve,
      code: slugResolveErrorCode,
      message: slugResolveErrorMessage,
      hasUuidInUrl,
      isSelf,
    });
    if (import.meta.env.DEV) return <>{probe}{SKELETON}</>
    if (debugMode) {
      return <_ProdDebugPanel routeParam={routeParam} isSelf={isSelf}
        hasUuidInUrl={hasUuidInUrl} uuidFromParam={uuidFromParam} slugToResolve={slugToResolve}
        slugResolveLoading={slugResolveLoading} actorIdFromSlug={actorIdFromSlug}
        slugNotFound={slugNotFound} resolvedActorId={resolvedActorId}
        canonicalSlug={canonicalSlug} slugLoading={slugLoading} />
    }

    return (
      <div className="profiles-modern px-4 py-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/80">
          We could not load this profile right now. Please try again in a moment.
        </div>
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────
  // Show probe before redirecting so the cause is visible in DEV.
  // "self" never triggers slugNotFound (slugToResolve is null for self).
  if (slugNotFound && !hasUuidInUrl) {
    appendIOSProdDebugLog('profile_route_redirect_feed', {
      reason: 'slug_not_found',
      routeParam,
      slugToResolve,
      hasUuidInUrl,
      slugNotFound,
      resolvedActorId,
    });
    if (import.meta.env.DEV) return <>{probe}{SKELETON}</>
    if (debugMode) return <_ProdDebugPanel routeParam={routeParam} isSelf={isSelf}
      hasUuidInUrl={hasUuidInUrl} uuidFromParam={uuidFromParam} slugToResolve={slugToResolve}
      slugResolveLoading={slugResolveLoading} actorIdFromSlug={actorIdFromSlug}
      slugNotFound={slugNotFound} resolvedActorId={resolvedActorId}
      canonicalSlug={canonicalSlug} slugLoading={slugLoading} />
    return <Navigate to="/feed" replace />;
  }

  // ── Canonical guard ────────────────────────────────────────
  if (slugLoading) return <>{probe}{SKELETON}</>

  if (!canonicalSlug) {
    appendIOSProdDebugLog('profile_route_redirect_feed', {
      reason: 'missing_canonical_slug',
      routeParam,
      resolvedActorId,
      slugLoading,
      slugResolveLoading,
    });
    if (import.meta.env.DEV) return <>{probe}{SKELETON}</>
    if (debugMode) return <_ProdDebugPanel routeParam={routeParam} isSelf={isSelf}
      hasUuidInUrl={hasUuidInUrl} uuidFromParam={uuidFromParam} slugToResolve={slugToResolve}
      slugResolveLoading={slugResolveLoading} actorIdFromSlug={actorIdFromSlug}
      slugNotFound={slugNotFound} resolvedActorId={resolvedActorId}
      canonicalSlug={canonicalSlug} slugLoading={slugLoading} />
    return <Navigate to="/feed" replace />;
  }

  // Block content until we are on the exact canonical URL.
  // Covers "self", UUID-prefixed legacy slugs, and bare-UUID canonical fallbacks
  // (vports without a stored vport.profiles.slug use actorId as their canonical).
  if (routeParam !== canonicalSlug) {
    appendIOSProdDebugLog('profile_route_wait_canonical_redirect', {
      routeParam,
      canonicalSlug,
      resolvedActorId,
    });
    return <>{probe}{SKELETON}</>
  }

  // ── Kind loading ───────────────────────────────────────────
  if (kindLoading) return <>{probe}{SKELETON}</>

  // ── Render ─────────────────────────────────────────────────
  const Screen = PROFILE_KIND_REGISTRY[kind] ?? PROFILE_KIND_REGISTRY.user;
  if (!hasLoggedRenderRef.current) {
    hasLoggedRenderRef.current = true;
    appendIOSProdDebugLog('profile_route_render_screen', {
      routeParam,
      canonicalSlug,
      resolvedActorId,
      kind,
      viewerActorId: identity?.actorId ?? null,
    });
  }

  return (
    <>
      {probe}
      <Screen
        viewerActorId={identity.actorId}
        profileActorId={resolvedActorId}
        identity={identity}
        prefetchedVportType={prefetchedVportType}
        vportTypeLoading={vportTypeLoading}
      />
    </>
  );
}
