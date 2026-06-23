"use client";

import { useState } from "react";
import { submitAnswer as submitAnswerRequest } from "@/features/answers/controllers/submitAnswer.controller";

export function useSubmitAnswer() {
  const [state, setState] = useState({ status: "idle", errors: {} });

  async function submitAnswer(payload) {
    setState({ status: "submitting", errors: {} });

    try {
      const result = await submitAnswerRequest(payload);

      if (!result.ok) {
        setState({
          status: "error",
          errors: result.errors ?? { form: "Answer could not be submitted." }
        });
        return result;
      }

      setState({ status: "submitted", errors: {}, answer: result.answer });
      return result;
    } catch {
      const result = {
        ok: false,
        status: "failed",
        errors: { form: "Answer could not be submitted." }
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
    submitAnswer,
    reset
  };
}
