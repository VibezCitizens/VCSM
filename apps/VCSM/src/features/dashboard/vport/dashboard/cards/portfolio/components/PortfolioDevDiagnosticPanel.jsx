import { useState } from "react";
import { Bug } from "lucide-react";
import { useVportPortfolioProbe } from "@/features/dashboard/vport/dashboard/cards/portfolio/hooks/useVportPortfolioProbe";

/**
 * DEV-only diagnostic panel for the VPORT Portfolio screen.
 * Renders nothing in production (import.meta.env.DEV guard).
 *
 * Previously named PortfolioBugsBunnyPanel — renamed for command-name parity
 * after BugsBunny was renamed to Deadpool (2026-05-11).
 */
export function PortfolioDevDiagnosticPanel({ actorId, identity }) {
  const [open, setOpen] = useState(false);
  const { probe, probing, traceEvents, runProbe, clearTrace } = useVportPortfolioProbe({ actorId, identity });

  if (!import.meta.env.DEV) return null;

  return (
    <div style={{ margin: "0 0 12px 0" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 10,
          border: "1px solid rgba(250,200,50,0.3)",
          background: "rgba(250,200,50,0.08)",
          color: "rgba(250,200,50,0.9)", fontSize: 11,
          fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em",
          fontFamily: "monospace",
        }}
      >
        <Bug size={13} />
        DEADPOOL — Portfolio Diagnostic {open ? "▲" : "▼"}
      </button>

      {open && (
        <div style={{
          marginTop: 6, borderRadius: 12,
          border: "1px solid rgba(250,200,50,0.2)",
          background: "rgba(0,0,0,0.6)", padding: 12,
          fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.7)",
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              onClick={runProbe}
              disabled={probing}
              style={{
                padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                border: "1px solid rgba(100,220,100,0.4)",
                background: "rgba(100,220,100,0.1)", color: "rgba(150,255,150,0.9)",
                fontSize: 11, fontWeight: 600,
              }}
            >
              {probing ? "Probing..." : "▶ Run Probe"}
            </button>
            <button
              type="button"
              onClick={clearTrace}
              style={{
                padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "rgba(255,255,255,0.4)",
                fontSize: 11,
              }}
            >
              Clear Trace
            </button>
          </div>

          {probe && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "rgba(250,200,50,0.8)", marginBottom: 6, fontWeight: 700 }}>— PROBE RESULTS —</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>ASSERTIONS</div>
                {(probe.assertions ?? []).map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 2 }}>
                    <span style={{ color: a.pass ? "rgba(100,255,100,0.9)" : "rgba(255,80,80,0.9)", minWidth: 16 }}>{a.pass ? "✓" : "✗"}</span>
                    <span style={{ color: a.pass ? "rgba(200,255,200,0.7)" : "rgba(255,180,180,0.9)" }}>{a.label}</span>
                    {a.value !== undefined && <span style={{ color: "rgba(255,255,255,0.35)" }}>{typeof a.value === "string" ? a.value : JSON.stringify(a.value)}</span>}
                    {a.got !== undefined && <span style={{ color: "rgba(255,100,100,0.7)" }}>got: {JSON.stringify(a.got)}</span>}
                  </div>
                ))}
              </div>
              {[
                ["IDENTITY", "identity"],
                ["PROFILE LOOKUP (vport.profiles)", "profileLookup"],
                ["PROFILE_ACTOR_ACCESS", "profileActorAccess"],
                ["ACTOR_OWNERS (vc.actor_owners)", "actorOwners"],
                ["AUTH SESSION", "session"],
                ["EXPECTED INSERT PAYLOAD", "expectedInsertPayload"],
              ].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 6 }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>{label}</div>
                  <pre style={{ margin: 0, color: "rgba(200,220,255,0.75)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {JSON.stringify(probe[key], null, 2)}
                  </pre>
                </div>
              ))}
              {probe.probeError && <div style={{ color: "rgba(255,80,80,0.9)" }}>PROBE ERROR: {probe.probeError}</div>}
            </div>
          )}

          {traceEvents.length > 0 && (
            <div>
              <div style={{ color: "rgba(250,200,50,0.8)", marginBottom: 6, fontWeight: 700 }}>— ENGINE TRACE ({traceEvents.length}) —</div>
              {traceEvents.map((ev, i) => (
                <div key={i} style={{
                  marginBottom: 4, padding: "4px 8px", borderRadius: 6,
                  background: ev.step?.includes("ERROR") || ev.step?.includes("FAIL") ? "rgba(255,80,80,0.1)" : "rgba(255,255,255,0.03)",
                  borderLeft: `2px solid ${ev.step?.includes("ERROR") || ev.step?.includes("FAIL") ? "rgba(255,80,80,0.5)" : ev.step?.includes("SUCCESS") ? "rgba(100,255,100,0.4)" : "rgba(255,255,255,0.1)"}`,
                }}>
                  <span style={{ color: "rgba(255,200,100,0.7)", marginRight: 6 }}>{new Date(ev.ts).toISOString().slice(11, 23)}</span>
                  <span style={{ color: "rgba(255,255,255,0.8)", marginRight: 6 }}>{ev.step}</span>
                  {Object.entries(ev).filter(([k]) => k !== "step" && k !== "ts").map(([k, v]) => (
                    <span key={k} style={{ color: "rgba(180,220,255,0.6)", marginRight: 6 }}>
                      {k}={typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}

          {traceEvents.length === 0 && !probe && (
            <div style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
              No trace events yet. Run a probe or attempt a create to see engine trace output.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PortfolioDevDiagnosticPanel;
