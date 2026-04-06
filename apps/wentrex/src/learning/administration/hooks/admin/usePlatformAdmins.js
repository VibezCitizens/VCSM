import { useCallback, useEffect, useMemo, useState } from "react";
import { listPlatformAdminsController } from "@/learning/administration/controller/admin/listPlatformAdmins.controller";
import { addPlatformAdminController } from "@/learning/administration/controller/admin/addPlatformAdmin.controller";
import { removePlatformAdminController } from "@/learning/administration/controller/admin/removePlatformAdmin.controller";
import {
  createLearningViewCacheKey,
  readLearningViewCache,
  writeLearningViewCache,
} from "@/learning/administration/hooks/shared/learningViewCache";

export function usePlatformAdmins({ supabase, userId, actorId, enabled = true }) {
  const cacheKey = useMemo(
    () =>
      createLearningViewCacheKey("usePlatformAdmins", [
        userId ?? null,
        actorId ?? null,
      ]),
    [userId, actorId],
  );
  const cachedEntry = useMemo(() => readLearningViewCache(cacheKey), [cacheKey]);

  const [data, setData] = useState(() => cachedEntry?.data ?? null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && !cachedEntry?.data));
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async ({ background = false } = {}) => {
    if (!enabled) {
      setIsLoading(false);
      return { ok: false, error: { code: "DISABLED" } };
    }

    if (!supabase || !actorId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "usePlatformAdmins requires supabase and actorId",
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
      const result = await listPlatformAdminsController({ supabase, userId, actorId });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load platform admins",
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
        message: err?.message ?? "Failed to load platform admins",
      };

      if (!background) {
        setData(null);
      }
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, userId, actorId, cacheKey]);

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

  const addAdmin = useCallback(
    async ({ targetActorId }) => {
      if (!supabase || !actorId || !targetActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message: "addAdmin requires supabase, actorId, and targetActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await addPlatformAdminController({
          supabase,
          userId,
          actorId,
          targetActorId,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to add platform admin",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to add platform admin",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, actorId, reload],
  );

  const removeAdmin = useCallback(
    async ({ targetActorId }) => {
      if (!supabase || !actorId || !targetActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message: "removeAdmin requires supabase, actorId, and targetActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await removePlatformAdminController({
          supabase,
          userId,
          actorId,
          targetActorId,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to remove platform admin",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to remove platform admin",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, actorId, reload],
  );

  return {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    addAdmin,
    removeAdmin,
  };
}

export default usePlatformAdmins;
