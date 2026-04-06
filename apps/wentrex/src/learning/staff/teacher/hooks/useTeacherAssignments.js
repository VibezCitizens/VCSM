import { useCallback, useEffect, useState } from "react";
import { listTeacherAssignmentsController } from "@/learning/teacher/controller/listTeacherAssignments.controller";

export function useTeacherAssignments({
  supabase,
  actorId,
  realmId,
  courseId = null,
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
          "useTeacherAssignments requires supabase, actorId, and realmId",
      };

      setData(null);
      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listTeacherAssignmentsController({
        supabase,
        actorId,
        realmId,
        courseId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load teacher assignments",
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
        message: err?.message ?? "Failed to load teacher assignments",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, realmId, courseId]);

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

export default useTeacherAssignments;