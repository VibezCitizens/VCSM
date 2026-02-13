// src/features/wanders/core/hooks/useWandersHomeExperience.hook.js
// ============================================================================
// WANDERS HOOK — HOME EXPERIENCE
// Contract: timing/orchestration (guest ensure) for the Home screen.
// - may call controllers (none here)
// - may call other hooks
// - no Supabase, no DAL
// ============================================================================

import { useEffect, useState } from "react";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";

export function useWandersHomeExperience() {
  const { ensureUser } = useWandersGuest();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.resolve(ensureUser?.());
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureUser]);

  return { loading, error };
}

export default useWandersHomeExperience;
