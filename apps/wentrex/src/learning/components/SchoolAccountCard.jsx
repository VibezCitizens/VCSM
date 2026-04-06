import React, { useState } from "react";
import ResetPasswordModal from "@/learning/administration/components/ResetPasswordModal";
import { parentResetStudentPassword } from "@/features/services/supabase/parentResetStudentPassword";

const MUTED = "#64748b";
const BORDER = "#e2e8f0";

/**
 * School Account card — shows login identity info and optional password reset.
 *
 * Data mapping:
 *   identity.login_id          → from learning.actor_identities.login_id
 *   identity.is_school_managed → from learning.actor_identities.is_school_managed
 *   identity.must_change_password → from learning.actor_identities.must_change_password
 *   actorId                    → learning.actors.id (used for password reset target)
 *   studentName                → display name for confirmation UI
 *
 * The password reset does NOT touch actor_identities directly.
 * It calls the edge function which:
 *   1. Looks up learning.actors.user_id from actorId
 *   2. Calls supabase.auth.admin.updateUserById(user_id, {password})
 *   3. Then updates actor_identities.must_change_password flag
 */
export default function SchoolAccountCard({ identity, actorId, studentName, canResetPassword = false, canParentReset = false, onRefresh }) {
  const [showReset, setShowReset] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>School Account</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {canResetPassword && actorId && (
            <button onClick={() => setShowReset(true)}
              style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid #fecaca`, background: "#fff", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Reset Password
            </button>
          )}
          {canParentReset && actorId && (
            <button
              onClick={async () => {
                setSendingReset(true); setResetResult(null);
                const res = await parentResetStudentPassword({ studentActorId: actorId });
                setSendingReset(false);
                if (res.ok) {
                  setResetResult({
                    ok: true,
                    loginId: res.data?.loginId,
                    temporaryPassword: res.data?.temporaryPassword,
                  });
                } else {
                  setResetResult({ ok: false, message: res.error?.message ?? "Failed to reset password." });
                }
                onRefresh?.();
              }}
              disabled={sendingReset}
              style={{
                padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
                background: "#fff", color: "#0f4a72", fontSize: 13, fontWeight: 600, cursor: sendingReset ? "default" : "pointer",
              }}>
              {sendingReset ? "Resetting..." : "Reset Student Password"}
            </button>
          )}
        </div>
      </div>

      {resetResult && !resetResult.ok && (
        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13, background: "#fef2f2", color: "#7f1d1d" }}>
          {resetResult.message}
        </div>
      )}

      {resetResult?.ok && (
        <div style={{ padding: "16px 20px", borderRadius: 10, marginBottom: 12, background: "#dcfce7", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#166534", marginBottom: 10 }}>Password Reset Successful</div>
          <div style={{
            background: "#fff", border: "1px solid #bbf7d0", borderRadius: 8,
            padding: "14px 18px", fontFamily: "monospace", fontSize: 14, lineHeight: 2,
            color: "#166534", userSelect: "all",
          }}>
            <div>Student ID: <strong>{resetResult.loginId}</strong></div>
            <div>Temporary Password: <strong>{resetResult.temporaryPassword}</strong></div>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#166534" }}>
            Write this down. The student must change their password on next login. This password will not be shown again.
          </p>
          <button onClick={() => setResetResult(null)} style={{
            marginTop: 8, padding: "5px 14px", borderRadius: 6, border: "1px solid #bbf7d0",
            background: "#fff", color: "#166534", fontSize: 12, cursor: "pointer",
          }}>
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
        <div>
          <span style={{ color: MUTED }}>Login ID</span>
          <div style={{ fontWeight: 600, fontFamily: "monospace", color: "#0f172a", marginTop: 2 }}>
            {identity?.login_id ?? "—"}
          </div>
        </div>
        <div>
          <span style={{ color: MUTED }}>School Managed</span>
          <div style={{ marginTop: 2 }}>{identity?.is_school_managed ? "Yes" : "No"}</div>
        </div>
        <div>
          <span style={{ color: MUTED }}>Must Change Password</span>
          <div style={{
            marginTop: 2, fontWeight: 600,
            color: identity?.must_change_password ? "#dc2626" : "#166534",
          }}>
            {identity?.must_change_password ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {showReset && (
        <ResetPasswordModal
          actorId={actorId}
          studentName={studentName}
          loginId={identity?.login_id}
          onClose={() => setShowReset(false)}
          onSuccess={() => {
            setShowReset(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
