"use client";

import { useEffect, useState } from "react";
import { listPublishedQuestions } from "@/features/answers/dal/publishedQuestions.read.dal";
import { mapPublishedQuestionRow } from "@/features/answers/models/publishedQuestion.model";

// Client-side fetch of approved + published questions. Static export cannot
// prerender these (they change after build), so the public page loads them in
// the browser. Failures degrade to an empty list — the page never crashes.
export function usePublishedQuestions() {
  const [state, setState] = useState({ status: "loading", questions: [], error: null });

  useEffect(() => {
    let active = true;

    listPublishedQuestions().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setState({ status: "error", questions: [], error });
        return;
      }
      setState({ status: "ready", questions: data.map(mapPublishedQuestionRow), error: null });
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
