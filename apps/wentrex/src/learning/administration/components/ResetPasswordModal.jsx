import React, { useState } from "react";
import { resetStudentPassword } from "@/features/services/supabase/resetStudentPassword";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${BORDER}`, fontSize: 14,
  background: "#fff", color: "#0f172a", boxSizing: "border-box",
};

/**
 * Modal for resetting a student's password.
 *
 * Props:
 *   actorId       — learning.actors.id (NOT auth.users.id)
 *   studentName   — display name for confirmation
 *   loginId       — student login ID for reference
 *   onClose       — close handler
 *   onSuccess     — called after successful reset
 */
export default function ResetPasswordModal({ actorId, studentName, loginId, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requireChange, setRequireChange] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const isLongEnough = newPassword.length >= 8;
  const canSubmit = newPassword && confirmPassword && passwordsMatch && isLongEnough && !saving;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");

    const res = await resetStudentPassword({
      actorId,
      newPassword,
      requirePasswordChange: requireChange,
    });

    setSaving(false);

    if (res.ok) {
      setSuccess(true);
      onSuccess?.();
    } else {
      setError(res.error?.message ?? "Failed to reset password.");
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        role="dialog" aria-modal="true" aria-label="Reset Student Password"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Reset Password</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>
              {studentName}{loginId ? ` (ID: ${loginId})` : ""}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {success ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "14px 18px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontSize: 14 }}>
              Password reset successfully.{requireChange ? " Student must change password on next login." : ""}
            </div>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: PRIMARY, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", alignSelf: "flex-end" }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef9c3", color: "#854d0e", fontSize: 13, lineHeight: 1.5 }}>
              This will change the student's authentication password. The student will need the new password to log in.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters" minLength={8} required style={inputStyle} />
              {newPassword && !isLongEnough && (
                <span style={{ fontSize: 12, color: "#dc2626" }}>Must be at least 8 characters</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password" required style={inputStyle} />
              {confirmPassword && !passwordsMatch && (
                <span style={{ fontSize: 12, color: "#dc2626" }}>Passwords do not match</span>
              )}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={requireChange} onChange={e => setRequireChange(e.target.checked)} style={{ width: 16, height: 16 }} />
              Require password change on next login
            </label>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#7f1d1d", fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", color: "#334155", fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={!canSubmit} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: !canSubmit ? MUTED : "#dc2626", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: !canSubmit ? "default" : "pointer",
              }}>
                {saving ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
