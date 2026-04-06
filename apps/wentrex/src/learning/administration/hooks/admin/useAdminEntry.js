import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { resolveAdminEntryController } from "@/learning/administration/controller/admin/resolveAdminEntry.controller";
import { runAdminDiagnosticsController } from "@/learning/administration/controller/admin/runAdminDiagnostics.controller";

const DEBUG_PREFIX = "[useAdminEntry]";

export function useAdminEntry() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        console.log(`${DEBUG_PREFIX} loading admin entry state`);
        const result = await resolveAdminEntryController({ supabase });

        if (cancelled) {
          console.warn(`${DEBUG_PREFIX} load cancelled before state could be applied`);
          return;
        }

        const resolved = result?.ok ? result.data : null;

        if (resolved?.kind === "redirect" && resolved?.path) {
          console.log(`${DEBUG_PREFIX} navigating to resolved admin path`, {
            kind: resolved.kind,
            path: resolved.path,
          });
          navigate(resolved.path, { replace: true });
          return;
        }

        console.log(`${DEBUG_PREFIX} rendering fallback admin entry screen`, resolved);
        setData(resolved);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error(`${DEBUG_PREFIX} failed to load admin entry state`, err);
          setError(err);
          setData(null);
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const memberships = useMemo(() => data?.memberships ?? [], [data]);

  const title = useMemo(() => {
    if (data?.kind === "admin-pending") return "Administration";
    if (data?.kind === "authorized-no-admin-route") return "Workspace Access";
    return "Access";
  }, [data?.kind]);

  const message = useMemo(() => {
    if (data?.kind === "admin-pending") {
      return "Your admin access is active. We could not open a realm-specific dashboard yet, so this admin landing page is available while the learning workspace is being configured.";
    }
    if (data?.kind === "authorized-no-admin-route") {
      return "Your actor is authorized, but there is no routable admin workspace yet.";
    }
    return "Your access could not be resolved to an admin workspace.";
  }, [data?.kind]);

  return {
    isLoading,
    error,
    data,
    memberships,
    title,
    message,
  };
}

export function useAdminDiagnostics({ actorId }) {
  const [diag, setDiag] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const results = await runAdminDiagnosticsController({
        supabase,
        actorId,
      });
      setDiag(results);
    } catch (e) {
      setDiag({ _error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  return { diag, loading, run };
}

export default useAdminEntry;
