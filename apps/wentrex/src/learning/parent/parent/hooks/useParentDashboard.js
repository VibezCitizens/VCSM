import { useCallback, useEffect, useState } from "react";
import { getParentDashboardController } from "@/learning/parent/controller/getParentDashboard.controller";
import { listObservedStudentsController } from "@/learning/parent/controller/listObservedStudents.controller";

export function useParentDashboard({
  supabase,
  actorId,
  realmId,
  enabled = true,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));

  const reload = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return { ok: false, error: { code: "DISABLED" } };
    }

    if (!supabase || !actorId || !realmId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message:
          "useParentDashboard requires supabase, actorId, and realmId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const [dashboardResult, observedStudentsResult] = await Promise.all([
        getParentDashboardController({
          supabase,
          actorId,
          realmId,
        }),
        listObservedStudentsController({
          supabase,
          actorId,
          realmId,
        }),
      ]);

      if (!dashboardResult?.ok) {
        const nextError = dashboardResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load parent dashboard",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      if (!observedStudentsResult?.ok) {
        const nextError = observedStudentsResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load observed students",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      const mergedData = {
        ...dashboardResult.data,
        observedStudents:
          observedStudentsResult.data?.observedStudents ??
          dashboardResult.data?.observedStudents ??
          [],
      };

      setData(mergedData);
      return {
        ok: true,
        data: mergedData,
      };
    } catch (err) {
      const nextError = {
        code: "DB_ERROR",
        message: err?.message ?? "Failed to load parent dashboard",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, realmId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    data,
    error,
    isLoading,
    reload,
  };
}

export default useParentDashboard;
