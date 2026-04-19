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

import { useParams, Navigate } from "react-router-dom";
import { useIdentity } from "@/state/identity/identityContext";

import { useActorKind } from "@/features/profiles/hooks/useActorKind";
import { useVportType } from "@/features/profiles/hooks/useVportType";
import { useActorCanonicalSlug } from "@/features/profiles/hooks/useActorCanonicalSlug";
import { useActorSlugRedirect } from "@/features/profiles/hooks/useActorSlugRedirect";
import { useResolveActorBySlug } from "@/features/profiles/hooks/useResolveActorBySlug";

import { PROFILE_KIND_REGISTRY } from "@/features/profiles/kinds/profileKindRegistry";
import { SkeletonCardList } from "@/shared/components/Skeleton";
import { extractActorIdFromSlug, isCanonicalSlug } from "@/shared/lib/actorSlug";
import "@/features/profiles/styles/profiles-modern.css";

// ── BUGSBUNNY dev probe ────────────────────────────────────────
// Fixed overlay showing the full routing pipeline state.
// Gated by import.meta.env.DEV — Vite strips this in production builds.
// Remove after root cause confirmed.
function _DevProbe(p) {
  if (!import.meta.env.DEV) return null
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
  return (
    <div style={{ position:'fixed', top:12, right:12, zIndex:99999,
      background:'#0a0a0f', border:'1px solid #7c3aed', borderRadius:8,
      padding:'10px 14px', minWidth:330, boxShadow:'0 8px 32px rgba(0,0,0,.7)' }}>
      <div style={{ color:'#a78bfa', fontWeight:700, fontSize:12, marginBottom:6 }}>
        🐰 BUGSBUNNY — Profile Route
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
          ⚠ WILL REDIRECT TO /feed — slugNotFound={String(p.slugNotFound)} canonicalSlug={p.canonicalSlug ?? 'null'}
        </div>
      )}
      {mismatch && (
        <div style={{ marginTop:6, padding:'5px 8px', background:'#1e1b4b',
          borderRadius:4, color:'#c4b5fd', fontSize:11 }}>
          ↻ redirect pending: {p.routeParam} → {p.canonicalSlug}
        </div>
      )}
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
  if (!identity) return <Navigate to="/login" replace />;

  // ── Slug resolution loading ────────────────────────────────
  if (slugResolveLoading) return <>{probe}{SKELETON}</>

  // ── Not found ─────────────────────────────────────────────
  // Show probe before redirecting so the cause is visible in DEV.
  // "self" never triggers slugNotFound (slugToResolve is null for self).
  if (slugNotFound && !hasUuidInUrl) {
    if (import.meta.env.DEV) return <>{probe}{SKELETON}</>
    return <Navigate to="/feed" replace />;
  }

  // ── Canonical guard ────────────────────────────────────────
  if (slugLoading) return <>{probe}{SKELETON}</>

  if (!canonicalSlug) {
    if (import.meta.env.DEV) return <>{probe}{SKELETON}</>
    return <Navigate to="/feed" replace />;
  }

  // Block content until we are on the exact canonical URL.
  // This covers: "self" → redirect pending, UUID → redirect pending,
  // and any legacy slug format → redirect pending.
  if (!isCanonicalSlug(routeParam) || routeParam !== canonicalSlug) {
    return <>{probe}{SKELETON}</>
  }

  // ── Kind loading ───────────────────────────────────────────
  if (kindLoading) return <>{probe}{SKELETON}</>

  // ── Render ─────────────────────────────────────────────────
  const Screen = PROFILE_KIND_REGISTRY[kind] ?? PROFILE_KIND_REGISTRY.user;

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
