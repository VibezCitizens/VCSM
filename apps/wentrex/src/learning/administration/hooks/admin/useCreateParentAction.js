import { useCallback, useState } from "react";
import { createParentMemberController } from "@/learning/administration/controller/admin/createParentMember.controller";

export function useCreateParentAction({
  courseId,
  reload,
  setError,
}) {
  const [isCreatingParent, setIsCreatingParent] = useState(false);

  const createParent = useCallback(
    async ({ organizationId, displayName, email, studentActorId, sendInvite = false }) => {
      if (!courseId || !organizationId || !displayName || !email || !studentActorId) {
        const nextError = {
          code: "VALIDATION_ERROR",
          message:
            "createParent requires courseId, organizationId, displayName, email, and studentActorId",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      }

      setIsCreatingParent(true);
      setError(null);

      try {
        const result = await createParentMemberController({
          organizationId,
          courseId,
          studentActorId,
          displayName,
          email,
          sendInvite,
        });

        if (!result?.ok) {
          const nextError = result?.error ?? {
            code: "UNKNOWN_ERROR",
            message: "Failed to create parent",
          };

          setError(nextError);
          return { ok: false, error: nextError };
        }

        await reload();
        return result;
      } catch (err) {
        const nextError = {
          code: "CREATE_PARENT_ERROR",
          message: err?.message ?? "Failed to create parent",
        };

        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsCreatingParent(false);
      }
    },
    [courseId, reload, setError]
  );

  return {
    isCreatingParent,
    createParent,
  };
}

export default useCreateParentAction;
