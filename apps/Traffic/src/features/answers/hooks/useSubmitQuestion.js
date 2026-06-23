"use client";

import { useState } from "react";
import { trackQuestionSubmitted } from "@/lib/analytics";
import { submitQuestion as submitQuestionRequest } from "@/features/answers/controllers/submitQuestion.controller";

export function useSubmitQuestion() {
  const [state, setState] = useState({
    status: "idle",
    errors: {}
  });

  async function submitQuestion(payload) {
    setState({ status: "submitting", errors: {} });

    try {
      // Static export has no server route — submit runs in the browser via the
      // anon Supabase client and the answers.submit_question RPC.
      const result = await submitQuestionRequest(payload);

      if (!result.ok) {
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
