import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import "@/superadmin/superadmin.css";

export default function SuperAdminLoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If already signed in as platform owner, skip straight to dashboard
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!cancelled && data?.user) {
          navigate("/admin", { replace: true });
          return;
        }
      } catch {
        // not signed in — show login
      }
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) return;

      setLoading(true);
      setError("");

      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        navigate("/admin", { replace: true });
      } catch (err) {
        setError(err?.message ?? "Sign-in failed");
      } finally {
        setLoading(false);
      }
    },
    [email, password, navigate],
  );

  if (checking) {
    return (
      <div className="sa-login">
        <div className="sa-loading">
          <div className="sa-spinner" />
        </div>
      </div>
    );
  }

  const canSubmit = !loading && email.trim() && password.trim();

  return (
    <div className="sa-login">
      <div className="sa-login-card">
        <div className="sa-login-badge">Platform Owner</div>
        <h1 className="sa-login-title">Super Admin</h1>
        <p className="sa-login-subtitle">
          Sign in with your platform owner credentials to access tenant
          management and system administration.
        </p>

        {error && <div className="sa-error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="sa-field">
            <label className="sa-label" htmlFor="sa-email">
              Email
            </label>
            <input
              id="sa-email"
              className="sa-input"
              type="email"
              placeholder="admin@platform.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="sa-field">
            <label className="sa-label" htmlFor="sa-password">
              Password
            </label>
            <input
              id="sa-password"
              className="sa-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="sa-btn" disabled={!canSubmit}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
