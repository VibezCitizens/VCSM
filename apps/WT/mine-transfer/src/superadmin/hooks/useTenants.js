import { useCallback, useEffect, useState } from "react";
import { listTenantsController } from "@/superadmin/controllers/listTenants.controller";
import { createTenantController } from "@/superadmin/controllers/createTenant.controller";

export function useTenants({ supabase, userId, actorId, enabled = true }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || !supabase || !actorId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listTenantsController({ supabase, userId, actorId });
      if (result?.ok) {
        setData(result.data);
      } else {
        setData(null);
        setError(result?.error ?? { code: "UNKNOWN_ERROR", message: "Failed to load tenants" });
      }
    } catch (err) {
      setData(null);
      setError({ code: "DB_ERROR", message: err?.message ?? "Failed to load tenants" });
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
        const err = { code: "VALIDATION_ERROR", message: "Not ready" };
        setError(err);
        return { ok: false, error: err };
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
          setError(result?.error ?? { code: "UNKNOWN_ERROR", message: "Failed to create tenant" });
          return result;
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = { code: "DB_ERROR", message: err?.message ?? "Failed to create tenant" };
        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, userId, actorId, reload],
  );

  return { data, error, isLoading, isSaving, reload, createTenant };
}
