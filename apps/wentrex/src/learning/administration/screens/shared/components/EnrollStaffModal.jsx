import { useState } from "react";
import { createOrgMember } from "@/features/services/supabase/createOrgMember";

export default function EnrollStaffModal({ organizations, onClose }) {
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!orgId) {
      setFeedback({ ok: false, message: "No active organization selected." });
      return;
    }
    if (!displayName.trim() || !email.trim()) return;

    const payload = {
      organizationId: orgId,
      displayName: displayName.trim(),
      email: email.trim(),
      role,
    };
    console.log("[EnrollStaff] organizationId:", orgId, "payload:", payload);

    setSaving(true);
    setFeedback(null);
    try {
      const res = await createOrgMember(payload);
      if (res.ok) {
        setFeedback({ ok: true, message: `${displayName.trim()} enrolled as ${role}.` });
        setTimeout(onClose, 1500);
      } else {
        setFeedback({ ok: false, message: res.error?.message ?? "Enrollment failed." });
      }
    } catch (err) {
      setFeedback({ ok: false, message: err?.message ?? "Unexpected error." });
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--learning-border)",
    fontSize: 14,
    background: "var(--learning-surface)",
    color: "var(--learning-text)",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--learning-surface)",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Enroll Staff"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Enroll Staff</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--learning-muted-text)",
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {organizations.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--learning-text)" }}>
                Organization
              </label>
              <select value={orgId} onChange={(e) => setOrgId(e.target.value)} style={inputStyle} required>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name ?? org.id}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--learning-text)" }}>
              Full Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jane Smith"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--learning-text)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--learning-text)" }}>
              Role
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {feedback && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: feedback.ok ? "#dcfce7" : "#fef2f2",
                color: feedback.ok ? "#166534" : "#7f1d1d",
                fontSize: 14,
              }}
            >
              {feedback.message}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="learning-button learning-button-secondary">
              {feedback?.ok ? "Done" : "Cancel"}
            </button>
            {!feedback?.ok && (
              <button
                type="submit"
                disabled={saving || !displayName.trim() || !email.trim()}
                className="learning-button learning-button-primary"
              >
                {saving ? "Enrolling..." : "Enroll"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
