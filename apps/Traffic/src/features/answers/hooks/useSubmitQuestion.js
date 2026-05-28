"use client";

import { useState } from "react";
import { trackQuestionSubmitted } from "@/lib/analytics";

export function useSubmitQuestion() {
  const [state, setState] = useState({
    status: "idle",
    errors: {}
  });

  async function submitQuestion(payload) {
    setState({ status: "submitting", errors: {} });

    try {
      const response = await fetch("/api/answers/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setState({
          status: "error",
          errors: result.errors ?? { form: "Question could not be submitted." }
        });
        return result;
      }

      setState({ status: "submitted", errors: {}, question: result.question });
      trackQuestionSubmitted({ hasBody: Boolean(payload?.body) });
      return result;
    } catch {
      const result = {
        ok: false,
        status: "failed",
        errors: { form: "Question could not be submitted." }
      };
      setState({ status: "error", errors: result.errors });
      return result;
    }
  }

  function reset() {
    setState({ status: "idle", errors: {} });
  }

  return {
    ...state,
    isSubmitting: state.status === "submitting",
    submitQuestion,
    reset
  };
}
