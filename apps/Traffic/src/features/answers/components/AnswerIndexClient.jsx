"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeSlug } from "@/lib/slugs";
import { AskQuestionForm } from "@/features/answers/components/AskQuestionForm";
import { AnswersFeaturedList } from "@/features/answers/components/AnswersFeaturedList";
import { AnswersHeroSection } from "@/features/answers/components/AnswersHeroSection";
import { AnswersSearchSection } from "@/features/answers/components/AnswersSearchSection";
import { AnswersTopicGrid } from "@/features/answers/components/AnswersTopicGrid";
import { usePublishedQuestions } from "@/features/answers/hooks/usePublishedQuestions";
import { trackAnswerSearch } from "@/lib/analytics";

// Hidden until there's enough published Q&A content to search.
// Flip back to true to restore the "Local Expert Search" box.
const SHOW_ANSWERS_SEARCH = false;

// Hidden until there's enough published Q&A content to browse.
// Flip back to true to restore the "Browse by Need / Topics" box.
const SHOW_ANSWERS_TOPICS = false;

// The discovery card wraps the search + topics sections. It renders in
// development only (never in production builds) and only when at least one of
// its sections is enabled, so it never appears as an empty card. Next.js
// statically inlines process.env.NODE_ENV at build time, so this is safe in a
// client component.
const SHOW_ANSWERS_DISCOVERY_PANEL =
  process.env.NODE_ENV !== "production" && (SHOW_ANSWERS_SEARCH || SHOW_ANSWERS_TOPICS);

function buildSearchText(page) {
  return [
    page.question?.title,
    page.question?.body,
    page.topic?.name,
    page.seo?.description
  ]
    .filter(Boolean)
    .join(" ");
}

function filterPages(pages, query) {
  const needle = normalizeSlug(query);
  if (!needle) return pages;

  return pages.filter((page) => normalizeSlug(buildSearchText(page)).includes(needle));
}

function buildQuestionSearchText(question) {
  return [question.title, question.body, question.serviceKey, question.city, question.region, question.country]
    .filter(Boolean)
    .join(" ");
}

function filterQuestions(questions, query) {
  const needle = normalizeSlug(query);
  if (!needle) return questions;

  return questions.filter((question) => normalizeSlug(buildQuestionSearchText(question)).includes(needle));
}

export function AnswerIndexClient({ pages = [], topics = [] }) {
  const [query, setQuery] = useState("");
  const { questions: publishedQuestions } = usePublishedQuestions();
  const filteredPages = useMemo(() => filterPages(pages, query), [pages, query]);
  const filteredQuestions = useMemo(
    () => filterQuestions(publishedQuestions, query),
    [publishedQuestions, query]
  );

  useEffect(() => {
    if (!query.trim()) return undefined;
    const timeout = window.setTimeout(() => {
      trackAnswerSearch({ query });
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <section className="answers-index">
      <AnswersHeroSection />
      {SHOW_ANSWERS_DISCOVERY_PANEL ? (
        <div className="answers-discovery-flow">
          {SHOW_ANSWERS_SEARCH ? (
            <AnswersSearchSection query={query} onQueryChange={setQuery} />
          ) : null}
          {SHOW_ANSWERS_TOPICS ? <AnswersTopicGrid topics={topics} /> : null}
        </div>
      ) : null}
      <AnswersFeaturedList
        pages={filteredPages}
        questions={filteredQuestions}
        isSearching={Boolean(query)}
      />
      <AskQuestionForm />
    </section>
  );
}
