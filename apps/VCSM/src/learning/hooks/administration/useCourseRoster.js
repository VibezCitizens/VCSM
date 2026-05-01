import { useCallback, useEffect, useState } from "react";
import { getCourseRosterController } from "@/learning/controller/administration/getCourseRoster.controller";
import { useCourseRosterMutations } from "@/learning/hooks/administration/useCourseRosterMutations";

export function useCourseRoster({
  supabase,
  actorId,
  realmId,
  courseId,
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

    if (!supabase || !actorId || !realmId || !courseId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "useCourseRoster requires supabase, actorId, realmId, and courseId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getCourseRosterController({
        supabase,
        actorId,
        realmId,
        courseId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load course roster",
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
        message: err?.message ?? "Failed to load course roster",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, realmId, courseId]);

  const { assignStudent, assignTeacher, assignObserver, linkParentToStudent } =
    useCourseRosterMutations({ supabase, actorId, realmId, courseId, reload, setIsSaving, setError });

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    assignStudent,
    assignTeacher,
    assignObserver,
    linkParentToStudent,
  };
}

export default useCourseRoster;
