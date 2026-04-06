import { useCallback, useEffect, useState } from "react";
import { listOrganizationCoursesController } from "@/learning/controller/administration/listOrganizationCourses.controller";

export function useOrganizationCourses({
  supabase,
  actorId,
  realmId,
  organizationId,
  includeArchived = true,
  includeDrafts = true,
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

    if (!supabase || !actorId || !realmId || !organizationId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message:
          "useOrganizationCourses requires supabase, actorId, realmId, and organizationId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listOrganizationCoursesController({
        supabase,
        actorId,
        realmId,
        organizationId,
        includeArchived,
        includeDrafts,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load organization courses",
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
        message: err?.message ?? "Failed to load organization courses",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    supabase,
    actorId,
    realmId,
    organizationId,
    includeArchived,
    includeDrafts,
  ]);

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

export default useOrganizationCourses;