export function ActorProfileProdDebugPanel(p) {
  const R = ({ label, value, bad }) => (
    <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #1f1f2e", padding: "3px 0" }}>
      <span style={{ color: "#6b7280", minWidth: 190, fontSize: 11, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 11, fontFamily: "monospace", wordBreak: "break-all",
        color: bad ? "#f87171" : value == null ? "#4b5563" : "#34d399",
      }}>
        {value == null ? "null" : String(value)}
      </span>
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#070710",
      overflow: "auto", padding: 24, fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", background: "#0d0d1a",
        border: "2px solid #7c3aed", borderRadius: 12, padding: 20 }}>
        <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          PROD DEBUG — Profile Route Trace
        </div>
        <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 12 }}>
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
        <div style={{ marginTop: 12, padding: "8px 10px", background: "#1e0a2e",
          borderRadius: 6, color: "#d8b4fe", fontSize: 11 }}>
          <strong>Why feed redirect fired:</strong>
          {p.slugNotFound && !p.hasUuidInUrl
            ? " slugNotFound=true and param has no UUID — slug lookup returned nothing."
            : !p.canonicalSlug && !p.slugLoading
            ? " canonicalSlug is null — controller returned no slug for this actorId."
            : p.canonicalSlug && p.routeParam !== p.canonicalSlug
            ? ` routeParam "${p.routeParam}" !== canonicalSlug "${p.canonicalSlug}" — redirect loop.`
            : " Unknown — still loading or race condition."}
        </div>
      </div>
    </div>
  );
}
