import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import { supabase } from "@/services/supabase/supabaseClient";

const ALLOWED_ROLES = new Set(["owner", "admin", "staff", "teacher"]);

/*
Example direct invoke:

const { data, error } = await supabase.functions.invoke("create-org-member", {
  body: {
    organizationId,
    displayName,
    email,
    username,
    role,
    status,
  },
});
*/

function normalizeText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function createOrgMember({
  organizationId,
  displayName,
  email,
  username = null,
  role = "staff",
  status = "active",
}) {
  const normalizedOrganizationId = normalizeText(organizationId);
  const normalizedDisplayName = normalizeText(displayName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeText(username);
  const normalizedRole = (normalizeText(role) ?? "staff").toLowerCase();
  const normalizedStatus = normalizeText(status) ?? "active";

  if (!normalizedOrganizationId) {
    throw new Error("organizationId is required");
  }

  if (!normalizedDisplayName) {
    throw new Error("displayName is required");
  }

  if (!normalizedEmail) {
    throw new Error("email is required");
  }

  if (!ALLOWED_ROLES.has(normalizedRole)) {
    throw new Error("role must be owner, admin, staff, or teacher");
  }

  try {
    const { data, error } = await supabase.functions.invoke("create-org-member", {
      body: {
        organizationId: normalizedOrganizationId,
        displayName: normalizedDisplayName,
        email: normalizedEmail,
        username: normalizedUsername,
        role: normalizedRole,
        status: normalizedStatus,
      },
    });

    if (error) {
      throw error;
    }

    return {
      ok: true,
      data,
    };
  } catch (error) {
    if (error instanceof FunctionsHttpError) {
      const response = await error.context.json().catch(() => null);

      return {
        ok: false,
        error: {
          code: "FUNCTION_HTTP_ERROR",
          status: error.context.status,
          message: response?.error ?? "create-org-member failed",
          details: response?.details ?? null,
        },
      };
    }

    if (error instanceof FunctionsRelayError) {
      return {
        ok: false,
        error: {
          code: "FUNCTION_RELAY_ERROR",
          message: error.message,
        },
      };
    }

    if (error instanceof FunctionsFetchError) {
      return {
        ok: false,
        error: {
          code: "FUNCTION_FETCH_ERROR",
          message: error.message,
        },
      };
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

export default createOrgMember;
