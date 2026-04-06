import { useCallback, useEffect, useMemo, useState } from "react";
import { getLearningHomeController } from "@/learning/controller/shared/getLearningHome.controller";
import { getStudentDashboardController } from "@/learning/controller/students/getStudentDashboard.controller";
import { getStudentProgressSummaryController } from "@/learning/controller/students/getStudentProgressSummary.controller";

function normalizeStudentCourses(courses = []) {
  return courses.map((courseEntry) => {
    const {
      membership = null,
      lessonCount = 0,
      assignmentCount = 0,
      completedLessons = 0,
      inProgressLessons = 0,
      notStartedLessons = 0,
      progressPercent = 0,
      ...course
    } = courseEntry ?? {};

    return {
      course,
      membership,
      summary: {
        lessonCount,
        assignmentCount,
        completedLessons,
        inProgressLessons,
        notStartedLessons,
        progressPercent,
      },
    };
  });
}

export function useStudentDashboard({
  supabase,
  actorId,
  realmId,
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
        message: "useStudentDashboard requires supabase, actorId, and realmId",
      };

      setData(null);
      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const [homeResult, dashboardResult, progressResult] = await Promise.all([
        getLearningHomeController({
          supabase,
          actorId,
          realmId,
        }),
        getStudentDashboardController({
          supabase,
          actorId,
          realmId,
        }),
        getStudentProgressSummaryController({
          supabase,
          actorId,
          realmId,
        }),
      ]);

      if (!homeResult?.ok) {
        const nextError = homeResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load learning home",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      if (!dashboardResult?.ok) {
        const nextError = dashboardResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load student dashboard",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      if (!progressResult?.ok) {
        const nextError = progressResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load student progress summary",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      const courses = normalizeStudentCourses(
        dashboardResult.data?.courses ?? [],
      );

      const mergedData = {
        realm: homeResult.data?.realm ?? null,
        organizations: homeResult.data?.organizations ?? [],
        learningHome: homeResult.data ?? null,
        courses,
        progress: progressResult.data ?? null,
        summary: {
          courseCount: courses.length,
          totalLessons: progressResult.data?.totals?.lessons ?? 0,
          completedLessons: progressResult.data?.totals?.completedLessons ?? 0,
          inProgressLessons: progressResult.data?.totals?.inProgressLessons ?? 0,
          notStartedLessons: progressResult.data?.totals?.notStartedLessons ?? 0,
          totalAssignments: progressResult.data?.totals?.assignments ?? 0,
          submittedAssignments:
            progressResult.data?.totals?.submittedAssignments ?? 0,
          gradedAssignments: progressResult.data?.totals?.gradedAssignments ?? 0,
          progressPercent: progressResult.data?.totals?.progressPercent ?? 0,
          averageGradePercent:
            progressResult.data?.totals?.averageGradePercent ?? null,
        },
      };

      setData(mergedData);
      return {
        ok: true,
        data: mergedData,
      };
    } catch (err) {
      const nextError = {
        code: "DB_ERROR",
        message: err?.message ?? "Failed to load student dashboard",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, realmId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const studentCourses = useMemo(() => data?.courses ?? [], [data]);

  return {
    data,
    error,
    isLoading,
    reload,
    studentCourses,
  };
}

export default useStudentDashboard;
