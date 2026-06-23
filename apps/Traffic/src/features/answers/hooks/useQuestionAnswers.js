"use client";

import { useEffect, useState } from "react";
import { getPublishedQuestion, listPublishedAnswersForQuestion } from "@/features/answers/dal/answerDetail.read.dal";
import { mapPublishedQuestionRow } from "@/features/answers/models/publishedQuestion.model";
import { mapPublishedAnswerRow } from "@/features/answers/models/publishedAnswer.model";

// Client-side detail data. When `fetchQuestion` is true (community question with
// no build-time answer page), the question is loaded by slug. Published answers
// are always loaded. All failures degrade quietly — the page never crashes.
export function useQuestionAnswers({ slug, initialQuestion = null, initialAnswers = [], fetchQuestion = false }) {
  const [question, setQuestion] = useState(initialQuestion);
  const [questionStatus, setQuestionStatus] = useState(
    initialQuestion ? "ready" : fetchQuestion ? "loading" : "idle"
  );
  // Seed with server-rendered answers so hydration matches the prerendered HTML.
  const [answers, setAnswers] = useState(initialAnswers);

  useEffect(() => {
    let active = true;

    if (fetchQuestion && !initialQuestion) {
      getPublishedQuestion(slug).then(({ data }) => {
        if (!active) return;
        setQuestion(data ? mapPublishedQuestionRow(data) : null);
        setQuestionStatus(data ? "ready" : "not_found");
      });
    }

    listPublishedAnswersForQuestion(slug).then(({ data }) => {
      if (!active) return;
      const mapped = (data ?? []).map(mapPublishedAnswerRow);
      // Only replace the server-seeded answers when the runtime read returns
      // some, so a transient empty/error read never blanks out crawlable content.
      if (mapped.length > 0) setAnswers(mapped);
    });

    return () => {
      active = false;
    };
  }, [slug, fetchQuestion, initialQuestion]);

  return { question, questionStatus, answers };
}
