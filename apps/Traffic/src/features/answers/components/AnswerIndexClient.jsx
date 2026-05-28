"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeSlug } from "@/lib/slugs";
import { AskQuestionForm } from "@/features/answers/components/AskQuestionForm";
import { AnswersFeaturedList } from "@/features/answers/components/AnswersFeaturedList";
import { AnswersHeroSection } from "@/features/answers/components/AnswersHeroSection";
import { AnswersSearchSection } from "@/features/answers/components/AnswersSearchSection";
import { AnswersTopicGrid } from "@/features/answers/components/AnswersTopicGrid";
import { trackAnswerSearch } from "@/lib/analytics";

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

export function AnswerIndexClient({ pages = [], topics = [] }) {
  const [query, setQuery] = useState("");
  const filteredPages = useMemo(() => filterPages(pages, query), [pages, query]);

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
      <div className="answers-discovery-flow">
        <AnswersSearchSection query={query} onQueryChange={setQuery} />
        <AnswersTopicGrid topics={topics} />
      </div>
      <AnswersFeaturedList pages={filteredPages} isSearching={Boolean(query)} />
      <AskQuestionForm />
    </section>
  );
}
