import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminDashboardController } from "@/learning/administration/controller/admin/getAdminDashboard.controller";
import {
  createLearningViewCacheKey,
  readLearningViewCache,
  writeLearningViewCache,
} from "@/learning/administration/hooks/shared/learningViewCache";

export function useAdminDashboard({
  supabase,
  userId,
  actorId,
  realmId,
  enabled = true,
}) {
  const cacheKey = useMemo(
    () =>
      createLearningViewCacheKey("useAdminDashboard", [
        userId ?? null,
        actorId ?? null,
        realmId ?? null,
      ]),
    [userId, actorId, realmId],
  );
  const cachedEntry = useMemo(() => readLearningViewCache(cacheKey), [cacheKey]);

  const [data, setData] = useState(() => cachedEntry?.data ?? null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && !cachedEntry?.data));

  const reload = useCallback(async ({ background = false } = {}) => {
    if (!enabled) {
      setIsLoading(false);
      return { ok: false, error: { code: "DISABLED" } };
    }

    if (!supabase || !actorId || !realmId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "useAdminDashboard requires supabase, actorId, and realmId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    if (!background) {
      setIsLoading(true);
    }

    setError(null);

    try {
      const result = await getAdminDashboardController({
        supabase,
        userId,
        actorId,
        realmId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load admin dashboard",
        };

        if (!background) {
          setData(null);
        }
        setError(nextError);
        return { ok: false, error: nextError };
      }

      setData(result.data);
      writeLearningViewCache(cacheKey, result.data);
      return result;
    } catch (err) {
      const nextError = {
        code: "DB_ERROR",
        message: err?.message ?? "Failed to load admin dashboard",
      };

      if (!background) {
        setData(null);
      }
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, userId, actorId, realmId, cacheKey]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const nextCachedEntry = readLearningViewCache(cacheKey);

    if (nextCachedEntry?.data) {
      setData(nextCachedEntry.data);
      setError(null);
      setIsLoading(false);
      reload({ background: true });
      return;
    }

    reload();
  }, [enabled, cacheKey, reload]);

  return {
    data,
    error,
    isLoading,
    reload,
  };
}

export default useAdminDashboard;
