import { useCallback, useEffect, useState } from "react";
import { getCourseRosterController } from "@/learning/administration/controller/admin/getCourseRoster.controller";
import { useCourseRosterActions } from "./useCourseRosterActions";
import { useCreateParentAction } from "./useCreateParentAction";

export function useCourseRoster({
  supabase,
  userId,
  actorId,
  realmId,
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
        userId,
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
  }, [enabled, supabase, userId, actorId, realmId, courseId]);

  const {
    isSaving,
    assignStudent,
    assignTeacher,
    assignObserver,
    linkParentToStudent,
  } = useCourseRosterActions({
    supabase,
    userId,
    actorId,
    realmId,
    courseId,
    reload,
    setError,
  });

  const { isCreatingParent, createParent } = useCreateParentAction({
    courseId,
    reload,
    setError,
  });

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    data,
    error,
    isLoading,
    isSaving: isSaving || isCreatingParent,
    reload,
    assignStudent,
    assignTeacher,
    assignObserver,
    linkParentToStudent,
    createParent,
  };
}

export default useCourseRoster;
