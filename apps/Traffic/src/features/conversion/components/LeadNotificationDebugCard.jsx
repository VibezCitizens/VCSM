"use client";

// ----------------------------------------------------------------------------
// Dev-only diagnostics card for the publish-lead-notification edge invoke.
//
// Traffic is a standalone, isolated app with no shared debugger infrastructure
// and must not import from the repo-root ZZnotforproduction/ debuggers
// (isolation rule). So this dev panel lives inside the conversion feature.
//
// It renders only in development: the `process.env.NODE_ENV` guard here (and at
// the call site) is dead-code-eliminated in production builds, so nothing ships.
// ----------------------------------------------------------------------------

const WRAP = {
  marginTop: 12,
  padding: "10px 12px",
  border: "1px dashed rgba(255,255,255,0.25)",
  borderRadius: 10,
  background: "rgba(0,0,0,0.35)",
  color: "rgba(255,255,255,0.85)",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word"
};
const TITLE = { fontWeight: 700, marginBottom: 6, letterSpacing: 0.4 };
const ROW = { display: "block" };

function fmt(value) {
  if (value === undefined || value === null) return "null";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function LeadNotificationDebugCard({ diagnostics }) {
  if (process.env.NODE_ENV === "production") return null;
  if (!diagnostics) return null;

  return (
    <section style={WRAP} aria-label="Lead notification debug">
      <div style={TITLE}>LEAD NOTIFICATION DEBUG</div>
      <span style={ROW}>fn: {fmt(diagnostics.fn)}</span>
      <span style={ROW}>leadId: {fmt(diagnostics.leadId)}</span>
      <span style={ROW}>ok: {fmt(diagnostics.ok)}</span>
      <span style={ROW}>status: {fmt(diagnostics.status)}</span>
      <span style={ROW}>error: {fmt(diagnostics.error)}</span>
      <span style={ROW}>data: {fmt(diagnostics.data)}</span>
    </section>
  );
}
