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

export function AnswersFeaturedList({ pages = [], isSearching = false }) {
  const { t } = useTrafficLanguage();

  return (
    <section className="answers-featured-list" aria-label={t("answers.publishedAria")}>
      <div className="answers-section-heading">
        <p>{t("answers.publishedEyebrow")}</p>
        <h2>{t("answers.publishedAnswers")}</h2>
      </div>

      {pages.length > 0 ? (
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
        </ul>
      ) : (
        <AnswersEmptyState isSearching={isSearching} />
      )}
    </section>
  );
}
