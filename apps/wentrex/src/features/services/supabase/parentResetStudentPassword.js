import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * Sends a secure password reset email for a linked student.
 * The reset email goes to the parent email on file — NOT the student.
 * No plaintext password is ever transmitted.
 */
export async function parentResetStudentPassword({ studentActorId }) {
  if (!studentActorId) throw new Error("studentActorId is required");

  try {
    const { data, error } = await supabase.functions.invoke("parent-reset-student-password", {
      body: { studentActorId },
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
          message: response?.error ?? "Password reset failed",
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

export default parentResetStudentPassword;
