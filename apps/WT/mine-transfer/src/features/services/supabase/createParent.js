import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import { supabase } from "@/services/supabase/supabaseClient";

function normalizeText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function createParent({
  organizationId,
  courseId,
  studentActorId,
  displayName,
  email,
  username = null,
  password = null,
  sendInvite = false,
}) {
  const normalizedOrganizationId = normalizeText(organizationId);
  const normalizedCourseId = normalizeText(courseId);
  const normalizedStudentActorId = normalizeText(studentActorId);
  const normalizedDisplayName = normalizeText(displayName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeText(username);

  if (!normalizedOrganizationId) {
    throw new Error("organizationId is required");
  }

  if (!normalizedCourseId) {
    throw new Error("courseId is required");
  }

  if (!normalizedStudentActorId) {
    throw new Error("studentActorId is required");
  }

  if (!normalizedDisplayName) {
    throw new Error("displayName is required");
  }

  if (!normalizedEmail) {
    throw new Error("email is required");
  }

  try {
    const { data, error } = await supabase.functions.invoke("create-parent", {
      body: {
        organizationId: normalizedOrganizationId,
        courseId: normalizedCourseId,
        studentActorId: normalizedStudentActorId,
        displayName: normalizedDisplayName,
        email: normalizedEmail,
        username: normalizedUsername,
        password: normalizeText(password),
        sendInvite,
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
          message: response?.error ?? "create-parent failed",
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

export default createParent;
