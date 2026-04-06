import { useCallback, useEffect, useState } from "react";
import { listOrganizationCoursesController } from "@/learning/administration/controller/admin/listOrganizationCourses.controller";
import { createCourseController } from "@/learning/administration/controller/admin/createCourse.controller";

export function useOrganizationCourses({
  supabase,
  userId,
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
        userId,
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
    userId,
    actorId,
    realmId,
    organizationId,
    includeArchived,
    includeDrafts,
  ]);

  useEffect(() => {
    reload();
  }, [reload]);

  const [isSaving, setIsSaving] = useState(false);

  const createCourse = useCallback(
    async ({ title, code, description, visibility, termId, coverImageUrl }) => {
      if (!supabase || !actorId || !realmId || !organizationId) {
        return { ok: false, error: { code: "VALIDATION_ERROR" } };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await createCourseController({
          supabase,
          userId,
          actorId,
          realmId,
          organizationId,
          title,
          code,
          description,
          visibility,
          termId,
          coverImageUrl,
        });

        if (!result?.ok) {
          setError(result?.error ?? { code: "UNKNOWN_ERROR" });
          return result;
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = { code: "DB_ERROR", message: err?.message ?? "Failed to create course" };
        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, actorId, realmId, organizationId, reload],
  );

  return {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    createCourse,
  };
}

export default useOrganizationCourses;