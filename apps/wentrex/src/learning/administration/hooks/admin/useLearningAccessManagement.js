import { useCallback, useEffect, useMemo, useState } from "react";
import { listLearningAccessController } from "@/learning/administration/controller/admin/listLearningAccess.controller";
import { grantLearningAccessController } from "@/learning/administration/controller/admin/grantLearningAccess.controller";
import { revokeLearningAccessController } from "@/learning/administration/controller/admin/revokeLearningAccess.controller";
import {
  createLearningViewCacheKey,
  readLearningViewCache,
  writeLearningViewCache,
} from "@/learning/administration/hooks/shared/learningViewCache";

export function useLearningAccessManagement({
  supabase,
  userId,
  actorId,
  enabled = true,
}) {
  const cacheKey = useMemo(
    () =>
      createLearningViewCacheKey("useLearningAccessManagement", [
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
        message: "useLearningAccessManagement requires supabase and actorId",
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
      const result = await listLearningAccessController({ supabase, userId, actorId });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load access records",
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
        message: err?.message ?? "Failed to load access records",
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

  const grantAccess = useCallback(
    async ({ targetActorId, notes = "" }) => {
      if (!supabase || !actorId || !targetActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message: "grantAccess requires supabase, actorId, and targetActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await grantLearningAccessController({
          supabase,
          userId,
          actorId,
          targetActorId,
          notes,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to grant access",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to grant access",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, actorId, reload],
  );

  const revokeAccess = useCallback(
    async ({ targetActorId, notes = "" }) => {
      if (!supabase || !actorId || !targetActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message: "revokeAccess requires supabase, actorId, and targetActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await revokeLearningAccessController({
          supabase,
          userId,
          actorId,
          targetActorId,
          notes,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to revoke access",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to revoke access",
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
    grantAccess,
    revokeAccess,
  };
}

export default useLearningAccessManagement;
