import { useCallback, useEffect, useState } from "react";
import { listCourseAssignmentsController } from "@/learning/controller/shared/listCourseAssignments.controller";

export function useCourseAssignments({
  supabase,
  actorId,
  courseId,
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

    if (!supabase || !actorId || !courseId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "useCourseAssignments requires supabase, actorId, and courseId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listCourseAssignmentsController({
        supabase,
        actorId,
        courseId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load course assignments",
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
        message: err?.message ?? "Failed to load course assignments",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, courseId]);

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

export default useCourseAssignments;