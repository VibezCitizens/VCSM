"use client";

import { useState } from "react";
import { requestQuestionRemoval as requestQuestionRemovalRequest } from "@/features/answers/controllers/requestQuestionRemoval.controller";

// Mirrors useSubmitQuestion's shape. Terminal "requested" state is generic and
// identical whether or not the email matched a question.
export function useRequestQuestionRemoval() {
  const [state, setState] = useState({ status: "idle", errors: {} });

  async function requestRemoval(payload) {
    setState({ status: "submitting", errors: {} });

    try {
      const result = await requestQuestionRemovalRequest(payload);

      if (!result.ok) {
        setState({ status: "error", errors: result.errors ?? {} });
        return result;
      }

      setState({ status: "requested", errors: {} });
      return result;
    } catch {
      // Even on an unexpected throw, fall through to the generic requested state
      // so the UI never exposes a different outcome.
      setState({ status: "requested", errors: {} });
      return { ok: true, status: "requested", errors: {} };
    }
  }

  function reset() {
    setState({ status: "idle", errors: {} });
  }

  return {
    ...state,
    isSubmitting: state.status === "submitting",
    requestRemoval,
    reset
  };
}
