import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Resets a student's auth password via the secure edge function.
 *
 * IMPORTANT: This does NOT update a password field in learning tables.
 * It calls Supabase Auth admin API to change the real auth.users password.
 *
 * Mapping:
 *   actorId → learning.actors.id
 *   learning.actors.user_id → auth.users.id (target for password change)
 *   learning.actor_identities.must_change_password → UI flag only
 */
export async function resetStudentPassword({
  actorId,
  newPassword,
  requirePasswordChange = true,
}) {
  if (!actorId) throw new Error("actorId is required");
  if (!newPassword || newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  try {
    const { data, error } = await supabase.functions.invoke("reset-student-password", {
      body: {
        actorId,
        newPassword,
        requirePasswordChange,
      },
    });

    if (error) throw error;
    return { ok: true, data };
  } catch (error) {
    if (error instanceof FunctionsHttpError) {
      const response = await error.context.json().catch(() => null);
      return {
        ok: false,
        error: {
          code: "FUNCTION_HTTP_ERROR",
          status: error.context.status,
          message: response?.error ?? "Password reset failed",
          details: response?.details ?? null,
        },
      };
    }
    if (error instanceof FunctionsRelayError) {
      return { ok: false, error: { code: "FUNCTION_RELAY_ERROR", message: error.message } };
    }
    if (error instanceof FunctionsFetchError) {
      return { ok: false, error: { code: "FUNCTION_FETCH_ERROR", message: error.message } };
    }
    return {
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

export default resetStudentPassword;
