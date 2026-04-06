import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { useWentrexActorId, useWentrexIdentity } from "@/features/identity/WentrexIdentityContext";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1px solid ${BORDER}`, fontSize: 15,
  background: "#fff", color: "#0f172a", boxSizing: "border-box",
};

export default function ChangePasswordScreen() {
  const navigate = useNavigate();
  const { actorId } = useWentrexActorId();
  const { loading: contextLoading, context } = useWentrexIdentity();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingChange, setAwaitingChange] = useState(false);

  const isLong = newPassword.length >= 8;
  const matches = newPassword === confirmPassword;
  const canSubmit = isLong && matches && !loading && !awaitingChange;

  // Navigate once context resolves after updateUser() fires SIGNED_IN
  useEffect(() => {
    if (!awaitingChange || contextLoading) return;

    // [BUGSBUNNY change-password] Navigate decision
    if (import.meta.env.DEV) {
      console.group('[BUGSBUNNY change-password] Navigate effect');
      console.log('awaitingChange:', awaitingChange);
      console.log('contextLoading:', contextLoading);
      console.log('context exists:', !!context);
      console.log('context.isSuspended:', context?.isSuspended);
      console.log('context.defaultDestination:', context?.defaultDestination);
      console.log('context.roleKeys:', context?.roleKeys);
      console.log('context.activeActor:', context?.activeActor?.actorId ?? 'NONE');
      console.groupEnd();
    }

    if (context) {
      setAwaitingChange(false);
      const dest = context.defaultDestination ?? "/student";
      if (import.meta.env.DEV) console.log('[BUGSBUNNY change-password] Navigating to:', dest);
      navigate(dest, { replace: true });
    }
  }, [awaitingChange, contextLoading, context, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      // [BUGSBUNNY change-password] Pre-update session state
      if (import.meta.env.DEV) {
        const preSession = await supabase.auth.getSession();
        console.group('[BUGSBUNNY change-password] PRE updateUser');
        console.log('session exists:', !!preSession.data?.session);
        console.log('access_token (last 8):', preSession.data?.session?.access_token?.slice(-8) ?? 'NONE');
        console.log('actorId:', actorId);
        console.log('context:', context);
        console.log('context.defaultDestination:', context?.defaultDestination);
        console.log('context.roleKeys:', context?.roleKeys);
        console.groupEnd();
      }

      // Update password via Supabase Auth.
      const { data: updateData, error: updateErr } = await supabase.auth.updateUser({ password: newPassword });

      // [BUGSBUNNY change-password] Post-update state
      if (import.meta.env.DEV) {
        const postSession = await supabase.auth.getSession();
        const postUser = await supabase.auth.getUser();
        console.group('[BUGSBUNNY change-password] POST updateUser');
        console.log('updateErr:', updateErr);
        console.log('updateData user id:', updateData?.user?.id ?? 'NONE');
        console.log('post session exists:', !!postSession.data?.session);
        console.log('post access_token (last 8):', postSession.data?.session?.access_token?.slice(-8) ?? 'NONE');
        console.log('post user id:', postUser.data?.user?.id ?? 'NONE');
        console.log('post user email:', postUser.data?.user?.email ?? 'NONE');
        console.groupEnd();
      }

      if (updateErr) {
        setError(updateErr.message);
        return;
      }

      // Clear must_change_password flag in learning schema
      if (actorId) {
        await supabase.schema("learning").from("actor_identities")
          .update({ must_change_password: false, updated_at: new Date().toISOString() })
          .eq("actor_id", actorId);
      }

      // [BUGSBUNNY change-password] Final state before awaiting context
      if (import.meta.env.DEV) {
        console.log('[BUGSBUNNY change-password] Setting awaitingChange=true, will navigate to:', context?.defaultDestination ?? '/student');
      }

      // Wait for WentrexIdentityContext to resolve after SIGNED_IN
      setAwaitingChange(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: PRIMARY,
            display: "inline-grid", placeItems: "center", color: "#fff",
            fontWeight: 800, fontSize: 22, marginBottom: 12,
          }}>L</div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Change Your Password</h1>
          <p style={{ margin: 0, fontSize: 14, color: MUTED }}>You must set a new password before continuing.</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
          padding: 28, display: "flex", flexDirection: "column", gap: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters" required autoFocus style={inputStyle} />
            {newPassword && !isLong && (
              <span style={{ fontSize: 12, color: "#dc2626" }}>Must be at least 8 characters</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password" required style={inputStyle} />
            {confirmPassword && !matches && (
              <span style={{ fontSize: 12, color: "#dc2626" }}>Passwords do not match</span>
            )}
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#7f1d1d", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={!canSubmit}
            style={{
              padding: "12px", borderRadius: 10, border: "none",
              background: !canSubmit ? MUTED : PRIMARY,
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: !canSubmit ? "default" : "pointer",
            }}>
            {loading ? "Saving..." : awaitingChange ? "Loading your dashboard..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
