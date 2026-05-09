import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

export async function createTenantBootstrap({
  supabase,
  principalEmail,
  schoolName,
  schoolSlug = null,
  primaryColor = "#0f4a72",
}) {
  try {
    const { data, error } = await supabase.functions.invoke("create-tenant", {
      body: {
        principalEmail: principalEmail.trim().toLowerCase(),
        schoolName: schoolName.trim(),
        schoolSlug: schoolSlug?.trim() || null,
        primaryColor: primaryColor?.trim() || "#0f4a72",
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
          code: response?.code ?? "FUNCTION_HTTP_ERROR",
          status: error.context.status,
          message: response?.error ?? "create-tenant failed",
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
      error: {
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
