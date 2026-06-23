"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";
import { AnswersEmptyState } from "@/features/answers/components/AnswersEmptyState";
import { trackAnswerRead } from "@/lib/analytics";

function formatMetadata(page, fallback) {
  const parts = [
    page.topic?.name,
    page.question?.location?.city,
    page.question?.serviceKey
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : fallback;
}

function formatQuestionMetadata(question, fallback) {
  const place = [question.city, question.region, question.country].filter(Boolean).join(", ");
  const parts = [question.serviceKey, place].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : fallback;
}

function formatPublishedDate(value, lang) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "es" ? "es" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function buildPreview(text, max = 160) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export function AnswersFeaturedList({ pages = [], questions = [], isSearching = false }) {
  const { lang, t } = useTrafficLanguage();

  // A question that already has a build-time answer page is rendered via `pages`;
  // don't duplicate it from the runtime published-questions list.
  const pageSlugs = new Set(pages.map((page) => page.question?.slug).filter(Boolean));
  const extraQuestions = questions.filter((question) => question.slug && !pageSlugs.has(question.slug));
  const hasContent = pages.length > 0 || extraQuestions.length > 0;

  return (
    <section className="answers-featured-list" aria-label={t("answers.publishedAria")}>
      <div className="answers-section-heading">
        <p>{t("answers.publishedEyebrow")}</p>
        <h2>{t("answers.publishedAnswers")}</h2>
      </div>

      {hasContent ? (
        <ul>
          {pages.map((page) => (
            <li key={page.question.id} className="answers-preview-card">
              <span className="answers-preview-card__marker" aria-hidden="true" />
              <div>
                <span className="answers-preview-card__meta">
                  {formatMetadata(page, t("answers.localExpertise"))}
                </span>
                <h3>
                  <Link
                    href={page.seo.canonicalPath}
                    onClick={() =>
                      trackAnswerRead({
                        answerSlug: page.question.slug,
                        topicSlug: page.topic?.slug
                      })
                    }
                  >
                    {page.question.title}
                  </Link>
                </h3>
                <p>{page.seo.description}</p>
              </div>
              <Link
                className="answers-preview-card__cta"
                href={page.seo.canonicalPath}
                onClick={() =>
                  trackAnswerRead({
                    answerSlug: page.question.slug,
                    topicSlug: page.topic?.slug
                  })
                }
              >
                {t("answers.readAnswer")}
              </Link>
            </li>
          ))}

          {extraQuestions.map((question) => {
            const publishedDate = formatPublishedDate(question.publishedAt, lang);
            const meta = formatQuestionMetadata(question, t("answers.localExpertise"));
            const href = `/answers/${question.slug}`;
            return (
              <li key={question.id} className="answers-preview-card">
                <span className="answers-preview-card__marker" aria-hidden="true" />
                <div>
                  <span className="answers-preview-card__meta">
                    {publishedDate ? `${meta} · ${publishedDate}` : meta}
                  </span>
                  <h3>
                    <Link
                      href={href}
                      onClick={() => trackAnswerRead({ answerSlug: question.slug })}
                    >
                      {question.title}
                    </Link>
                  </h3>
                  <p>{buildPreview(question.body)}</p>
                </div>
                <Link
                  className="answers-preview-card__cta"
                  href={href}
                  onClick={() => trackAnswerRead({ answerSlug: question.slug })}
                >
                  {t("answers.readAnswer")}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <AnswersEmptyState isSearching={isSearching} />
      )}
    </section>
  );
}
