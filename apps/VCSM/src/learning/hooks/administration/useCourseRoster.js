import { useCallback, useEffect, useState } from "react";
import { getCourseRosterController } from "@/learning/controller/administration/getCourseRoster.controller";
import { assignStudentToCourseController } from "@/learning/controller/administration/assignStudentToCourse.controller";
import { assignTeacherToCourseController } from "@/learning/controller/administration/assignTeacherToCourse.controller";
import { assignObserverToCourseController } from "@/learning/controller/administration/assignObserverToCourse.controller";
import { linkParentToStudentController } from "@/learning/controller/administration/linkParentToStudent.controller";

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

  const assignStudent = useCallback(
    async ({ studentActorId, status = "active" }) => {
      if (!supabase || !actorId || !realmId || !courseId || !studentActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message:
            "assignStudent requires supabase, actorId, realmId, courseId, and studentActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await assignStudentToCourseController({
          supabase,
          actorId,
          realmId,
          courseId,
          studentActorId,
          status,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to assign student to course",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to assign student to course",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, actorId, realmId, courseId, reload]
  );

  const assignTeacher = useCallback(
    async ({ teacherActorId, role = "teacher", status = "active" }) => {
      if (!supabase || !actorId || !realmId || !courseId || !teacherActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message:
            "assignTeacher requires supabase, actorId, realmId, courseId, and teacherActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await assignTeacherToCourseController({
          supabase,
          actorId,
          realmId,
          courseId,
          teacherActorId,
          role,
          status,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to assign teacher to course",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to assign teacher to course",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, actorId, realmId, courseId, reload]
  );

  const assignObserver = useCallback(
    async ({ observerActorId, role = "parent", status = "active" }) => {
      if (!supabase || !actorId || !realmId || !courseId || !observerActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message:
            "assignObserver requires supabase, actorId, realmId, courseId, and observerActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await assignObserverToCourseController({
          supabase,
          actorId,
          realmId,
          courseId,
          observerActorId,
          role,
          status,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to assign observer to course",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to assign observer to course",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, actorId, realmId, courseId, reload]
  );

  const linkParentToStudent = useCallback(
    async ({ parentActorId, studentActorId }) => {
      if (
        !supabase ||
        !actorId ||
        !realmId ||
        !courseId ||
        !parentActorId ||
        !studentActorId
      ) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message:
            "linkParentToStudent requires supabase, actorId, realmId, courseId, parentActorId, and studentActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await linkParentToStudentController({
          supabase,
          actorId,
          realmId,
          courseId,
          parentActorId,
          studentActorId,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to link parent to student",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to link parent to student",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, actorId, realmId, courseId, reload]
  );

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
