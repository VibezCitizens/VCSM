import { useCallback, useEffect, useMemo, useState } from "react";
import { getLearningHomeController } from "@/learning/controller/shared/getLearningHome.controller";
import { getStudentDashboardController } from "@/learning/student/controller/getStudentDashboard.controller";
import { getStudentProgressSummaryController } from "@/learning/student/controller/getStudentProgressSummary.controller";
import {
  createLearningError,
  withLearningErrorContext,
} from "@/learning/utils/realmDebug";

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

  const buildHookError = useCallback(
    (errorValue, segment) =>
      withLearningErrorContext(errorValue, {
        scope: "useStudentDashboard",
        context: {
          layer: "hook",
          segment,
          actorId,
          realmId,
        },
      }),
    [actorId, realmId],
  );

  const reload = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return { ok: false, error: { code: "DISABLED" } };
    }

    if (!supabase || !actorId || !realmId) {
      const nextError = createLearningError({
        code: "VALIDATION_ERROR",
        message: "useStudentDashboard requires supabase, actorId, and realmId",
        context: {
          layer: "hook",
          scope: "useStudentDashboard",
          hasSupabase: Boolean(supabase),
          actorId,
          realmId,
        },
      });

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

      const failedResults = [
        {
          segment: "learningHome",
          fallbackMessage: "Failed to load learning home",
          result: homeResult,
        },
        {
          segment: "studentDashboard",
          fallbackMessage: "Failed to load student dashboard",
          result: dashboardResult,
        },
        {
          segment: "studentProgressSummary",
          fallbackMessage: "Failed to load student progress summary",
          result: progressResult,
        },
      ].filter((entry) => !entry.result?.ok);

      if (failedResults.length > 0) {
        const [primaryFailure, ...otherFailures] = failedResults;
        const nextError = buildHookError(
          primaryFailure.result?.error ??
            createLearningError({
              code: "UNKNOWN_ERROR",
              message: primaryFailure.fallbackMessage,
            }),
          primaryFailure.segment,
        );

        if (otherFailures.length > 0) {
          nextError.relatedErrors = otherFailures.map((entry) =>
            buildHookError(
              entry.result?.error ??
                createLearningError({
                  code: "UNKNOWN_ERROR",
                  message: entry.fallbackMessage,
                }),
              entry.segment,
            ),
          );
        }

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
      const nextError = withLearningErrorContext(err, {
        scope: "useStudentDashboard",
        code: "DB_ERROR",
        context: {
          layer: "hook",
          actorId,
          realmId,
          segment: "reload",
        },
      });

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, realmId, buildHookError]);

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
