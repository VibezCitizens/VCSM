import { useCallback, useEffect, useState } from "react";
import { listTenantsController } from "@/learning/superadmin/controller/listTenants.controller";
import { createTenantController } from "@/learning/superadmin/controller/createTenant.controller";

export function useTenants({ supabase, userId, actorId, enabled = true }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return { ok: false, error: { code: "DISABLED" } };
    }

    if (!supabase || !actorId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message: "useTenants requires supabase and actorId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listTenantsController({ supabase, userId, actorId });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load tenants",
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
        message: err?.message ?? "Failed to load tenants",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, userId, actorId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createTenant = useCallback(
    async ({ principalEmail, schoolName, schoolSlug, primaryColor }) => {
      if (!supabase || !actorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message: "createTenant requires supabase and actorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await createTenantController({
          supabase,
          userId,
          actorId,
          principalEmail,
          schoolName,
          schoolSlug,
          primaryColor,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to create tenant",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to create tenant",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, actorId, reload],
  );

  return {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    createTenant,
  };
}

export default useTenants;
