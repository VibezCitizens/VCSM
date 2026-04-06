import { useCallback, useEffect, useState } from "react";
import { getAssignmentSubmissionController } from "@/learning/controller/shared/getAssignmentSubmission.controller";
import { saveSubmissionDraftController } from "@/learning/controller/shared/saveSubmissionDraft.controller";
import { submitAssignmentController } from "@/learning/controller/shared/submitAssignment.controller";

export function useAssignmentSubmission({
  supabase,
  actorId,
  assignmentId,
  courseId = null,
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

    if (!supabase || !actorId || !assignmentId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "useAssignmentSubmission requires supabase, actorId, and assignmentId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getAssignmentSubmissionController({
        supabase,
        actorId,
        assignmentId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load assignment submission",
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
        message: err?.message ?? "Failed to load assignment submission",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, assignmentId]);

  const saveDraft = useCallback(
    async ({ submittedText = "", submittedUrl = null }) => {
      if (!supabase || !actorId || !assignmentId || !courseId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message:
            "saveDraft requires supabase, actorId, assignmentId, and courseId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await saveSubmissionDraftController({
          supabase,
          actorId,
          assignmentId,
          courseId,
          submittedText,
          submittedUrl,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to save submission draft",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to save submission draft",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, actorId, assignmentId, courseId, reload]
  );

  const submitAssignment = useCallback(async () => {
    if (!supabase || !actorId || !assignmentId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "submitAssignment requires supabase, actorId, and assignmentId",
      };

      setError(nextError);
      return { ok: false, error: nextError };
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await submitAssignmentController({
        supabase,
        actorId,
        assignmentId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to submit assignment",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      await reload();
      return result;
    } catch (err) {
      const nextError = {
        code: "DB_ERROR",
        message: err?.message ?? "Failed to submit assignment",
      };

      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsSaving(false);
    }
  }, [supabase, actorId, assignmentId, reload]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    saveDraft,
    submitAssignment,
  };
}

export default useAssignmentSubmission;