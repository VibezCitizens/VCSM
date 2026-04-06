import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { useWentrexIdentity } from "@/features/identity/WentrexIdentityContext";

const PRIMARY = "#0f4a72";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1px solid ${BORDER}`, fontSize: 15,
  background: "#fff", color: "#0f172a", boxSizing: "border-box",
};

export default function StudentLoginScreen() {
  const navigate = useNavigate();
  const { loading: contextLoading, context, error: contextError } = useWentrexIdentity();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingLogin, setAwaitingLogin] = useState(false);

  // Navigate once WentrexIdentityContext resolves after setSession() → SIGNED_IN
  useEffect(() => {
    if (!awaitingLogin || contextLoading) return;

    if (context) {
      setAwaitingLogin(false);
      if (context.isSuspended) {
        navigate("/suspended", { replace: true });
      } else {
        navigate(context.defaultDestination ?? "/unauthorized", { replace: true });
      }
    } else if (contextError) {
      setAwaitingLogin(false);
      if (contextError?.code === "NO_LEARNING_ACTOR") {
        navigate("/unauthorized", { replace: true, state: { reason: "no_learning_actor" } });
      } else if (contextError?.code === "ACCESS_DENIED") {
        const reason = contextError.accessStatus === "none" ? "access_not_granted" : "access_revoked";
        navigate("/unauthorized", { replace: true, state: { reason } });
      } else {
        setError("Unable to load your account. Please try again.");
      }
    }
  }, [awaitingLogin, contextLoading, context, contextError, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!loginId.trim() || !password) return;

    setLoading(true);
    setError("");

    try {
      // Call server-side Edge Function — login_id lookup happens on the server
      const { data, error: fnErr } = await supabase.functions.invoke("student-login", {
        body: { loginId: loginId.trim(), password },
      });

      if (fnErr || !data?.session) {
        setError(data?.error || "Invalid login ID or password.");
        return;
      }

      // Set the session from the server-returned tokens.
      // This fires SIGNED_IN → WentrexIdentityContext will provision and resolve context.
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionErr) {
        setError("Failed to establish session. Please try again.");
        return;
      }

      // must_change_password: student must set a new password before continuing.
      // Navigate immediately — provision will complete in background via SIGNED_IN.
      if (data.must_change_password) {
        navigate("/change-password", { replace: true });
        return;
      }

      // Session is live. Wait for WentrexIdentityContext to finish provisioning.
      setAwaitingLogin(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isWorking = loading || (awaitingLogin && contextLoading);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo / header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: PRIMARY,
            display: "inline-grid", placeItems: "center", color: "#fff",
            fontWeight: 800, fontSize: 22, marginBottom: 12,
          }}>L</div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Student Login</h1>
          <p style={{ margin: 0, fontSize: 14, color: MUTED }}>Enter your Student ID and password</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
          padding: 28, display: "flex", flexDirection: "column", gap: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Student ID</label>
            <input
              type="text"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              placeholder="e.g. 2026012"
              required
              autoComplete="username"
              autoFocus
              style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: 1 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#7f1d1d", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={isWorking || !loginId.trim() || !password}
            style={{
              padding: "12px", borderRadius: 10, border: "none",
              background: (!loginId.trim() || !password) ? MUTED : PRIMARY,
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: isWorking ? "default" : "pointer",
            }}>
            {loading ? "Signing in..." : (awaitingLogin && contextLoading) ? "Loading your dashboard..." : "Sign In"}
          </button>
        </form>

        {/* Links */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: MUTED }}>
          <span>Not a student? </span>
          <a href="/login" style={{ color: PRIMARY, fontWeight: 600, textDecoration: "none" }}>Staff & Parent Login</a>
        </div>
      </div>
    </div>
  );
}
