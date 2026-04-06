import { useCallback, useEffect, useState } from "react";
import { getStudentCourseHomeController } from "@/learning/controller/students/getStudentCourseHome.controller";
import { getStudentProgressSummaryController } from "@/learning/controller/students/getStudentProgressSummary.controller";

function mapStudentCourseHomeResult(result) {
  return {
    ok: true,
    data: {
      scope: "course",
      course: result.data?.course ?? null,
      membership: result.data?.membership ?? null,
      totals: {
        lessons: result.data?.summary?.lessonCount ?? 0,
        completedLessons: result.data?.summary?.completedLessonCount ?? 0,
        inProgressLessons: result.data?.summary?.inProgressLessonCount ?? 0,
        notStartedLessons: result.data?.summary?.notStartedLessonCount ?? 0,
        assignments: result.data?.summary?.assignmentCount ?? 0,
        submittedAssignments: 0,
        gradedAssignments: 0,
        progressPercent: result.data?.summary?.progressPercent ?? 0,
        averageGradePercent: null,
      },
    },
  };
}

export function useStudentProgressSummary({
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
          "useStudentProgressSummary requires supabase, actorId, and realmId",
      };

      setData(null);
      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = courseId
        ? await getStudentCourseHomeController({
            supabase,
            actorId,
            realmId,
            courseId,
          }).then((courseHomeResult) =>
            courseHomeResult?.ok
              ? mapStudentCourseHomeResult(courseHomeResult)
              : courseHomeResult,
          )
        : await getStudentProgressSummaryController({
            supabase,
            actorId,
            realmId,
            courseId,
          });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load student progress summary",
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
        message: err?.message ?? "Failed to load student progress summary",
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

export default useStudentProgressSummary;
