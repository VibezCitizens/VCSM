import { useCallback, useEffect, useState } from "react";
import { getObservedStudentProgressController } from "@/learning/parent/controller/getObservedStudentProgress.controller";
import { getObservedStudentAssignmentsController } from "@/learning/parent/controller/getObservedStudentAssignments.controller";

export function useObservedStudentProgress({
  supabase,
  actorId,
  realmId,
  courseId,
  studentActorId,
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

    if (!supabase || !actorId || !realmId || !courseId || !studentActorId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message:
          "useObservedStudentProgress requires supabase, actorId, realmId, courseId, and studentActorId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const [progressResult, assignmentsResult] = await Promise.all([
        getObservedStudentProgressController({
          supabase,
          actorId,
          realmId,
          courseId,
          studentActorId,
        }),
        getObservedStudentAssignmentsController({
          supabase,
          actorId,
          realmId,
          courseId,
          studentActorId,
        }),
      ]);

      if (!progressResult?.ok) {
        const nextError = progressResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load observed student progress",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      if (!assignmentsResult?.ok) {
        const nextError = assignmentsResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load observed student assignments",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      const mergedData = {
        ...progressResult.data,
        assignments: assignmentsResult.data?.assignments ?? [],
        assignmentSummary: assignmentsResult.data?.summary ?? null,
      };

      setData(mergedData);
      return {
        ok: true,
        data: mergedData,
      };
    } catch (err) {
      const nextError = {
        code: "DB_ERROR",
        message: err?.message ?? "Failed to load observed student progress",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, realmId, courseId, studentActorId]);

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

export default useObservedStudentProgress;