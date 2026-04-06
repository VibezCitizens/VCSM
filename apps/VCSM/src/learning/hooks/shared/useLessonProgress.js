import { useCallback, useState } from "react";
import { markLessonCompleteController } from "@/learning/controller/shared/markLessonComplete.controller";

export function useLessonProgress({
  supabase,
  actorId,
  lessonId,
}) {
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const markComplete = useCallback(async () => {
    if (!supabase || !actorId || !lessonId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "useLessonProgress requires supabase, actorId, and lessonId",
      };

      setError(nextError);
      return { ok: false, error: nextError };
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await markLessonCompleteController({
        supabase,
        actorId,
        lessonId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to mark lesson complete",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      return result;
    } catch (err) {
      const nextError = {
        code: "DB_ERROR",
        message: err?.message ?? "Failed to mark lesson complete",
      };

      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsSaving(false);
    }
  }, [supabase, actorId, lessonId]);

  return {
    error,
    isSaving,
    markComplete,
  };
}

export default useLessonProgress;