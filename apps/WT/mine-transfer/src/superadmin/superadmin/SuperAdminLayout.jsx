import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { signOut } from "@/auth/controllers/login.controller";
import { resolveLearningActor } from "@/learning/adapters/actor.adapter";
import { supabase } from "@/services/supabase/supabaseClient";
import "@/learning/styles/learning.css";

const EMPTY_SUPER_ADMIN_CONTEXT = {
  supabase: null,
  actorId: null,
  user: null,
  isLoading: false,
};

export function useSuperAdminContext() {
  return useOutletContext() ?? EMPTY_SUPER_ADMIN_CONTEXT;
}

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [actorId, setActorId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolve(sessionUser) {
      const resolvedUser = sessionUser ?? null;

      if (!resolvedUser) {
        if (!cancelled) {
          setUser(null);
          setActorId(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const result = await resolveLearningActor({ supabase, user: resolvedUser });
        if (!cancelled) {
          setUser(resolvedUser);
          setActorId(result?.ok ? result.data.actorId : null);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setUser(resolvedUser);
          setActorId(null);
          setIsLoading(false);
        }
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) resolve(data?.user ?? null);
    });

    const sub = supabase?.auth?.onAuthStateChange?.((_event, session) => {
      if (!cancelled) resolve(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }, [navigate]);

  const context = { supabase, actorId, user, isLoading };

  return (
    <div className="learning-theme learning-shell">
      <header className="learning-shell-header">
        <div className="learning-shell-hero">
          <div className="learning-shell-brand">
            <span className="learning-shell-eyebrow">Super Admin</span>
            <h1 className="learning-title">Tenant Management</h1>
          </div>

          <div className="learning-shell-meta">
            {user?.email && (
              <span className="learning-badge">{user.email}</span>
            )}
            <button
              type="button"
              className="learning-shell-action"
              onClick={handleSignOut}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      </header>

      <main className="learning-shell-content">
        <Outlet context={context} />
      </main>
    </div>
  );
}
