import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import { supabase } from "@/services/supabase/supabaseClient";

export async function createStudent({
  organizationId,
  courseIds,
  displayName,
  parentName = null,
  parentEmail = null,
  password = null,
}) {
  if (!organizationId) throw new Error("organizationId is required");
  if (!displayName?.trim()) throw new Error("displayName is required");

  try {
    const { data, error } = await supabase.functions.invoke("create-student", {
      body: {
        organizationId,
        courseIds: courseIds ?? [],
        displayName: displayName.trim(),
        parentName: parentName?.trim() || null,
        parentEmail: parentEmail?.trim().toLowerCase() || null,
        password: password?.trim() || null,
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
          message: response?.error ?? "create-student failed",
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

export default createStudent;
