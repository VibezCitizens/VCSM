// debuggers/lead-notification/LeadNotificationDebugPanel.jsx
// ----------------------------------------------------------------------------
// Dev-only panel that surfaces the structured result returned by the
// publish-lead-notification edge invoke, so we can see WHY a submitted lead did
// or did not create a notification.events row (CORS / auth / runtime / RPC).
//
// Never ships: the @debuggers alias resolves to a no-op stub in production
// builds, and the call site is additionally gated by import.meta.env.DEV.
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
  wordBreak: "break-word",
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

export default function LeadNotificationDebugPanel({ diagnostics }) {
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
