import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function ActorProfileDevProbe(p) {
  if (!import.meta.env.DEV) return null;
  const [minimized, setMinimized] = useState(false);
  const [railTarget, setRailTarget] = useState(null);

  useEffect(() => {
    setRailTarget(document.getElementById("debug-rail-right"));
  }, []);

  if (!railTarget) return null;

  const R = ({ label, value, isBad }) => (
    <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #222", padding: "2px 0" }}>
      <span style={{ color: "#888", minWidth: 170, fontSize: 11, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 11, fontFamily: "monospace", wordBreak: "break-all",
        color: isBad ? "#f87171" : value == null ? "#6b7280" : "#34d399",
      }}>
        {value === null ? "null" : value === undefined ? "undef" : String(value)}
      </span>
    </div>
  );

  const willFeed = (p.slugNotFound && !p.hasUuidInUrl && !p.isSelf) || (!p.canonicalSlug && !p.slugLoading && !p.isSelf);
  const mismatch = p.canonicalSlug && p.routeParam !== p.canonicalSlug;

  const copy = () => {
    try { navigator.clipboard.writeText(JSON.stringify(p, null, 2)); } catch (_) {}
  };

  return createPortal(
    <div>
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          style={{
            background: "#0a0a0f", color: "#a78bfa", border: "1px solid #7c3aed44",
            borderRadius: 999, padding: "4px 12px", fontSize: 11, fontFamily: "monospace",
            boxShadow: "0 2px 12px rgba(0,0,0,0.5)", cursor: "pointer", opacity: 0.9,
          }}
        >
          🐰 ROUTE
        </button>
      ) : (
        <div style={{
          background: "#0a0a0f", border: "1px solid #7c3aed", borderRadius: 8,
          padding: "10px 14px", minWidth: 330, boxShadow: "0 8px 32px rgba(0,0,0,.7)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 12 }}>🐰 BUGSBUNNY — Profile Route</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copy} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 11 }}>copy</button>
              <button onClick={() => setMinimized(true)} style={{ background: "none", border: "none", color: "#fbbf24", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>_</button>
            </div>
          </div>
          <R label="routeParam"             value={p.routeParam} />
          <R label="isSelf"                 value={String(p.isSelf)} />
          <R label="actorIdForSelf"         value={p.actorIdForSelf} isBad={p.isSelf && !p.actorIdForSelf} />
          <R label="uuidFromParam"          value={p.uuidFromParam} />
          <R label="hasUuidInUrl"           value={String(p.hasUuidInUrl)} />
          <R label="slugToResolve"          value={p.slugToResolve} />
          <R label="slugResolveLoading"     value={String(p.slugResolveLoading)} />
          <R label="actorIdFromSlug"        value={p.actorIdFromSlug} isBad={p.slugNotFound} />
          <R label="slugNotFound"           value={String(p.slugNotFound)} isBad={p.slugNotFound} />
          <R label="resolvedActorId"        value={p.resolvedActorId} isBad={!p.resolvedActorId && !p.slugResolveLoading} />
          <R label="slugLoading"            value={String(p.slugLoading)} />
          <R label="canonicalSlug"          value={p.canonicalSlug} isBad={!p.canonicalSlug && !p.slugLoading} />
          <R label="routeParam===canonical" value={String(p.routeParam === p.canonicalSlug)} isBad={mismatch} />
          <R label="kindLoading"            value={String(p.kindLoading)} />
          <R label="kind"                   value={p.kind} isBad={!p.kind && !p.kindLoading} />
          <div style={{ borderTop: "1px solid #2d2040", margin: "5px 0 3px", paddingTop: 3 }}>
            <span style={{ color: "#7c3aed", fontSize: 10, fontWeight: 700 }}>RQ · useVportProfileBySlug</span>
          </div>
          <R label="rq.isLoading"           value={String(p.rqIsLoading)} />
          <R label="rq.actorId"             value={p.rqActorId} isBad={!p.rqActorId && !p.rqIsLoading && !!p.slugToResolve} />
          <R label="rq.name"                value={p.rqName} />
          <R label="rq.canonicalSlug"       value={p.rqCanonicalSlug} />
          <R label="rq.error"               value={p.rqError} isBad={!!p.rqError} />
          {willFeed && (
            <div style={{ marginTop: 6, padding: "5px 8px", background: "#7f1d1d",
              borderRadius: 4, color: "#fca5a5", fontSize: 11, fontWeight: 700 }}>
              ⚠ WILL REDIRECT TO /feed
            </div>
          )}
          {mismatch && (
            <div style={{ marginTop: 6, padding: "5px 8px", background: "#1e1b4b",
              borderRadius: 4, color: "#c4b5fd", fontSize: 11 }}>
              ↻ redirect pending: {p.routeParam} → {p.canonicalSlug}
            </div>
          )}
        </div>
      )}
    </div>,
    railTarget
  );
}
