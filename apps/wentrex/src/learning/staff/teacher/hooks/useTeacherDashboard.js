import { useCallback, useEffect, useMemo, useState } from "react";
import { getTeacherDashboardController } from "@/learning/teacher/controller/getTeacherDashboard.controller";
import { listTeacherCoursesController } from "@/learning/teacher/controller/listTeacherCourses.controller";
import { listTeacherAssignmentsController } from "@/learning/teacher/controller/listTeacherAssignments.controller";

export function useTeacherDashboard({
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
        message: "useTeacherDashboard requires supabase, actorId, and realmId",
      };

      setData(null);
      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const [dashboardResult, coursesResult, assignmentsResult] =
        await Promise.all([
          getTeacherDashboardController({
            supabase,
            actorId,
            realmId,
          }),
          listTeacherCoursesController({
            supabase,
            actorId,
            realmId,
          }),
          listTeacherAssignmentsController({
            supabase,
            actorId,
            realmId,
          }),
        ]);

      if (!dashboardResult?.ok) {
        const nextError = dashboardResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load teacher dashboard",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      if (!coursesResult?.ok) {
        const nextError = coursesResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load teacher courses",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      if (!assignmentsResult?.ok) {
        const nextError = assignmentsResult?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load teacher assignments",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      const mergedData = {
        dashboard: dashboardResult.data ?? null,
        courses: coursesResult.data?.courses ?? [],
        assignments: assignmentsResult.data?.assignments ?? [],
        summary: {
          ...(dashboardResult.data?.summary ?? {}),
          courseCount:
            dashboardResult.data?.summary?.courseCount ??
            coursesResult.data?.courses?.length ??
            0,
          assignmentCount:
            dashboardResult.data?.summary?.assignmentCount ??
            assignmentsResult.data?.assignments?.length ??
            0,
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
        message: err?.message ?? "Failed to load teacher dashboard",
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

  const teacherCourses = useMemo(() => data?.courses ?? [], [data]);
  const teacherAssignments = useMemo(() => data?.assignments ?? [], [data]);

  return {
    data,
    error,
    isLoading,
    reload,
    teacherCourses,
    teacherAssignments,
  };
}

export default useTeacherDashboard;