import { useCallback, useState } from "react";
import { assignStudentToCourseController } from "@/learning/administration/controller/admin/assignStudentToCourse.controller";
import { assignTeacherToCourseController } from "@/learning/administration/controller/admin/assignTeacherToCourse.controller";
import { assignObserverToCourseController } from "@/learning/administration/controller/admin/assignObserverToCourse.controller";
import { linkParentToStudentController } from "@/learning/administration/controller/admin/linkParentToStudent.controller";

/**
 * Roster mutation actions extracted from useCourseRoster.
 *
 * @param {Object} deps
 * @param {Object} deps.supabase
 * @param {string} deps.userId
 * @param {string} deps.actorId
 * @param {string} deps.realmId
 * @param {string} deps.courseId
 * @param {Function} deps.reload - Reload the roster after a mutation.
 * @param {Function} deps.setError - Propagate errors to parent state.
 */
export function useCourseRosterActions({
  supabase,
  userId,
  actorId,
  realmId,
  courseId,
  reload,
  setError,
}) {
  const [isSaving, setIsSaving] = useState(false);

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
          userId,
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
    [supabase, userId, actorId, realmId, courseId, reload, setError]
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
          userId,
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
    [supabase, userId, actorId, realmId, courseId, reload, setError]
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
          userId,
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
    [supabase, userId, actorId, realmId, courseId, reload, setError]
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
          userId,
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
    [supabase, userId, actorId, realmId, courseId, reload, setError]
  );

  return {
    isSaving,
    assignStudent,
    assignTeacher,
    assignObserver,
    linkParentToStudent,
  };
}

export default useCourseRosterActions;
