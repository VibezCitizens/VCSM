import { useCallback, useState } from "react";
import { gradeSubmissionController } from "@/learning/teacher/controller/gradeSubmission.controller";

export function useGradeSubmission({
  supabase,
  actorId,
  realmId,
  courseId,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const gradeSubmission = useCallback(
    async ({
      submissionId,
      score,
      feedbackText = "",
      feedbackPrivate = "",
      rubricGrades = [],
      status = "graded",
    }) => {
      if (!supabase || !actorId || !realmId || !courseId || !submissionId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message:
            "useGradeSubmission requires supabase, actorId, realmId, courseId, and submissionId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await gradeSubmissionController({
          supabase,
          actorId,
          realmId,
          courseId,
          submissionId,
          score,
          feedbackText,
          feedbackPrivate,
          rubricGrades,
          status,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to grade submission",
          };

          setData(null);
          setError(nextError);
          return { ok: false, error: nextError };
        }

        setData(result.data ?? null);
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to grade submission",
        };

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, actorId, realmId, courseId],
  );

  return {
    data,
    error,
    isSaving,
    gradeSubmission,
  };
}

export default useGradeSubmission;