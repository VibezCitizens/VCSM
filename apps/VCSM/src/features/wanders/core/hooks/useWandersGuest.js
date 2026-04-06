// src/features/wanders/core/hooks/useWandersGuest.js
// ============================================================================
// WANDERS HOOK — GUEST USER (CORE)
// Contract: UI lifecycle only. Calls ensureGuestUser. No Supabase/DAL directly.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";

export default function useWandersGuest(input = {}) {
  const { auto = true } = input;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(auto));
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await ensureGuestUser();
      if (!mountedRef.current) return null;
      setUser(res);
      return res;
    } catch (e) {
      if (!mountedRef.current) return null;
      setError(e);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    refresh();
  }, [auto, refresh]);

  return {
    user,
    userId: user?.id ?? null,
    loading,
    error,
    refresh,
    ensureUser: refresh,
  };
}

export { useWandersGuest };
