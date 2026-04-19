// features/profiles/debug/ProfileRouteDebug.dev.jsx
// ─────────────────────────────────────────────────────────────
// BUGSBUNNY DEV-ONLY probe — profile routing pipeline trace.
// DO NOT import this from production code.
// Gated at: import.meta.env.DEV (Vite strips this in production build)
// Remove after root cause confirmed.
// ─────────────────────────────────────────────────────────────

if (!import.meta.env.DEV) {
  throw new Error('ProfileRouteDebug must only be used in development')
}

const ROW = ({ label, value, bad }) => (
  <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #333', padding: '2px 0' }}>
    <span style={{ color: '#888', minWidth: 160, fontSize: 11 }}>{label}</span>
    <span style={{
      color: bad ? '#f87171' : value == null ? '#6b7280' : '#34d399',
      fontSize: 11,
      fontFamily: 'monospace',
      wordBreak: 'break-all',
    }}>
      {value === null ? 'null' : value === undefined ? 'undefined' : String(value)}
    </span>
  </div>
)

export function ProfileRouteDebug({
  routeParam,
  uuidFromParam,
  hasUuidInUrl,
  slugToResolve,
  actorIdFromSlug,
  resolvedActorId,
  canonicalSlug,
  slugLoading,
  slugResolveLoading,
  slugNotFound,
  kindLoading,
  kind,
}) {
  if (!import.meta.env.DEV) return null

  const mismatch = canonicalSlug && routeParam !== canonicalSlug
  const willRedirectToFeed = (slugNotFound && !hasUuidInUrl) || (!canonicalSlug && !slugLoading)

  return (
    <div style={{
      position: 'fixed',
      top: 12,
      right: 12,
      zIndex: 99999,
      background: '#0f0f14',
      border: '1px solid #7c3aed',
      borderRadius: 8,
      padding: '10px 14px',
      minWidth: 320,
      maxWidth: 420,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      fontFamily: 'monospace',
    }}>
      <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
        🐰 BUGSBUNNY — Profile Route Trace
      </div>

      <ROW label="routeParam" value={routeParam} />
      <ROW label="uuidFromParam" value={uuidFromParam} bad={!uuidFromParam && !slugToResolve} />
      <ROW label="hasUuidInUrl" value={String(hasUuidInUrl)} />
      <ROW label="slugToResolve" value={slugToResolve} />
      <ROW label="slugResolveLoading" value={String(slugResolveLoading)} />
      <ROW label="actorIdFromSlug" value={actorIdFromSlug} bad={slugNotFound} />
      <ROW label="slugNotFound" value={String(slugNotFound)} bad={slugNotFound} />
      <ROW label="resolvedActorId" value={resolvedActorId} bad={!resolvedActorId} />
      <ROW label="slugLoading (canonical)" value={String(slugLoading)} />
      <ROW label="canonicalSlug" value={canonicalSlug} bad={!canonicalSlug && !slugLoading} />
      <ROW label="routeParam === canonical" value={String(routeParam === canonicalSlug)} bad={mismatch} />
      <ROW label="kindLoading" value={String(kindLoading)} />
      <ROW label="kind" value={kind} bad={!kind && !kindLoading} />

      {willRedirectToFeed && (
        <div style={{
          marginTop: 8,
          padding: '6px 8px',
          background: '#7f1d1d',
          borderRadius: 4,
          color: '#fca5a5',
          fontSize: 11,
          fontWeight: 700,
        }}>
          ⚠ WILL REDIRECT TO /feed — check slugNotFound or canonicalSlug=null
        </div>
      )}

      {mismatch && (
        <div style={{
          marginTop: 8,
          padding: '6px 8px',
          background: '#1e1b4b',
          borderRadius: 4,
          color: '#c4b5fd',
          fontSize: 11,
        }}>
          ↻ Redirect pending: {routeParam} → {canonicalSlug}
        </div>
      )}
    </div>
  )
}
