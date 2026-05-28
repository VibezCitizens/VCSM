"use client";

import { useEffect } from "react";
import { trackAnswerRead } from "@/lib/analytics";

export function AnswerReadTracker({ answerSlug, topicSlug }) {
  useEffect(() => {
    if (!answerSlug) return;
    trackAnswerRead({ answerSlug, topicSlug });
  }, [answerSlug, topicSlug]);

  return null;
}
