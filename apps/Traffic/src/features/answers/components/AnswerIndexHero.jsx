"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";

export function AnswerIndexHero() {
  const { t } = useTrafficLanguage();

  return (
    <header className="answers-index__hero">
      <p>{t("answers.brand")}</p>
      <h1>{t("answers.indexTitle")}</h1>
      <p>{t("answers.indexSubtitle")}</p>
      <Link href="/ask" aria-disabled="true">
        {t("answers.askSoon")}
      </Link>
    </header>
  );
}

export function AnswerIndexTopics({ topics }) {
  const { t } = useTrafficLanguage();

  if (!topics?.length) return null;

  return (
    <section className="answers-index__topics" aria-label={t("answers.topicsAria")}>
      <h2>{t("answers.topics")}</h2>
      <ul>
        {topics.map((topic) => (
          <li key={topic.id}>{topic.name}</li>
        ))}
      </ul>
    </section>
  );
}

export function AnswerIndexList({ pages }) {
  const { t } = useTrafficLanguage();

  return (
    <section className="answers-index__list" aria-label={t("answers.publishedAria")}>
      <h2>{t("answers.publishedAnswers")}</h2>
      {pages.length > 0 ? (
        <ul>
          {pages.map((page) => (
            <li key={page.question.id}>
              <Link href={page.seo.canonicalPath}>{page.question.title}</Link>
              <p>{page.seo.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("answers.emptyPublished")}</p>
      )}
    </section>
  );
}
