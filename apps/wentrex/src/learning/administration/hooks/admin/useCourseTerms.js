import { useCallback, useEffect, useState } from "react";
import { listCourseTermsController } from "@/learning/administration/controller/admin/listCourseTerms.controller";
import { createCourseTermController } from "@/learning/administration/controller/admin/createCourseTerm.controller";
import { updateCourseTermController } from "@/learning/administration/controller/admin/updateCourseTerm.controller";

export function useCourseTerms({
  supabase,
  userId,
  actorId,
  realmId,
  organizationId,
  enabled = true,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return { ok: false, error: { code: "DISABLED" } };
    }

    if (!supabase || !actorId || !realmId || !organizationId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "useCourseTerms requires supabase, actorId, realmId, and organizationId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listCourseTermsController({
        supabase,
        userId,
        actorId,
        realmId,
        organizationId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load course terms",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      setData(result.data);
      return result;
    } catch (err) {
      const nextError = {
        code: "DB_ERROR",
        message: err?.message ?? "Failed to load course terms",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, userId, actorId, realmId, organizationId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createTerm = useCallback(
    async ({ name, startsOn = null, endsOn = null, isActive = true }) => {
      if (!supabase || !actorId || !realmId || !organizationId || !name) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message: "createTerm requires supabase, actorId, realmId, organizationId, and name",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await createCourseTermController({
          supabase,
          userId,
          actorId,
          realmId,
          organizationId,
          name,
          startsOn,
          endsOn,
          isActive,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to create course term",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to create course term",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, actorId, realmId, organizationId, reload],
  );

  const updateTerm = useCallback(
    async ({ termId, name, startsOn, endsOn, isActive }) => {
      if (!supabase || !actorId || !realmId || !termId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message: "updateTerm requires supabase, actorId, realmId, and termId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await updateCourseTermController({
          supabase,
          userId,
          actorId,
          realmId,
          termId,
          name,
          startsOn,
          endsOn,
          isActive,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to update course term",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to update course term",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, actorId, realmId, reload],
  );

  return {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    createTerm,
    updateTerm,
  };
}

export default useCourseTerms;
