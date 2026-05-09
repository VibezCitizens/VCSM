import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import "@/superadmin/superadmin.css";

const EMPTY_CTX = { supabase: null, actorId: null, user: null, isLoading: false };

export function useSuperAdminContext() {
  return useOutletContext() ?? EMPTY_CTX;
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
      if (!sessionUser) {
        if (!cancelled) {
          setUser(null);
          setActorId(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: actor } = await supabase
          .schema("learning")
          .from("actors")
          .select("id")
          .eq("user_id", sessionUser.id)
          .eq("is_active", true)
          .maybeSingle();

        if (!cancelled) {
          setUser(sessionUser);
          setActorId(actor?.id ?? null);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setUser(sessionUser);
          setActorId(null);
          setIsLoading(false);
        }
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        if (!data?.user) {
          navigate("/admin/login", { replace: true });
          return;
        }
        resolve(data.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (_event === "SIGNED_OUT") {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (_event === "SIGNED_IN") {
        resolve(session?.user ?? null);
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe?.();
    };
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/admin/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="sa-shell">
        <div className="sa-loading" style={{ minHeight: "100vh" }}>
          <div className="sa-spinner" />
          <span>Loading admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-shell">
      <header className="sa-header">
        <div className="sa-header-brand">
          <span className="sa-header-tag">Owner</span>
          <h1 className="sa-header-title">Super Admin</h1>
        </div>
        <div className="sa-header-meta">
          {user?.email && (
            <span className="sa-header-email">{user.email}</span>
          )}
          <button
            type="button"
            className="sa-btn-ghost"
            onClick={handleSignOut}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Sign out"}
          </button>
        </div>
      </header>
      <main className="sa-content">
        <Outlet context={{ supabase, actorId, user, isLoading }} />
      </main>
    </div>
  );
}
