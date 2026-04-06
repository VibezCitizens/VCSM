import { useCallback, useEffect, useState } from "react";
import { getLearningHomeController } from "@/learning/administration/controller/shared/getLearningHome.controller";
import {
  createLearningError,
  withLearningErrorContext,
} from "@/learning/administration/utils/realmDebug";

export function useLearningHome({
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
      const nextError = createLearningError({
        code: "VALIDATION_ERROR",
        message: "useLearningHome requires supabase, actorId, and realmId",
        context: {
          layer: "hook",
          scope: "useLearningHome",
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
      const result = await getLearningHomeController({
        supabase,
        actorId,
        realmId,
      });

      if (!result?.ok) {
        const nextError = withLearningErrorContext(
          result?.error ??
            createLearningError({
              code: "UNKNOWN_ERROR",
              message: "Failed to load learning home",
            }),
          {
            scope: "useLearningHome",
            context: {
              layer: "hook",
              actorId,
              realmId,
            },
          },
        );

        setData(null);
        setError(nextError);
        return { ok: false, error: nextError };
      }

      setData(result.data);
      return result;
    } catch (err) {
      const nextError = withLearningErrorContext(err, {
        scope: "useLearningHome",
        code: "DB_ERROR",
        context: {
          layer: "hook",
          actorId,
          realmId,
        },
      });

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

  return {
    data,
    error,
    isLoading,
    reload,
  };
}

export default useLearningHome;
