import { useCallback, useEffect, useState } from "react";
import { listOrganizationMembersController } from "@/learning/controller/administration/listOrganizationMembers.controller";
import { assignOrganizationMemberController } from "@/learning/controller/administration/assignOrganizationMember.controller";

export function useOrganizationMembers({
  supabase,
  actorId,
  realmId,
  organizationId,
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

    if (!supabase || !actorId || !realmId || !organizationId) {
      const nextError = {
        code: "VALIDATION_ERROR",
        message:
          "useOrganizationMembers requires supabase, actorId, realmId, and organizationId",
      };

      setError(nextError);
      setIsLoading(false);
      return { ok: false, error: nextError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await listOrganizationMembersController({
        supabase,
        actorId,
        realmId,
        organizationId,
      });

      if (!result?.ok) {
        const nextError = result?.error ?? {
          code: "UNKNOWN_ERROR",
          message: "Failed to load organization members",
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
        message: err?.message ?? "Failed to load organization members",
      };

      setData(null);
      setError(nextError);
      return { ok: false, error: nextError };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, supabase, actorId, realmId, organizationId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const assignMember = useCallback(
    async ({ memberActorId, role = "staff", status = "active" }) => {
      if (!supabase || !actorId || !realmId || !organizationId || !memberActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message:
            "assignMember requires supabase, actorId, realmId, organizationId, and memberActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await assignOrganizationMemberController({
          supabase,
          actorId,
          realmId,
          organizationId,
          memberActorId,
          role,
          status,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to assign organization member",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "DB_ERROR",
          message: err?.message ?? "Failed to assign organization member",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsSaving(false);
      }
    },
    [supabase, actorId, realmId, organizationId, reload],
  );

  return {
    data,
    error,
    isLoading,
    isSaving,
    reload,
    assignMember,
  };
}

export default useOrganizationMembers;
