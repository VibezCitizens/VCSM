"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";
import { useQuestionAnswers } from "@/features/answers/hooks/useQuestionAnswers";
import { AnswerSubmitForm } from "@/features/answers/components/AnswerSubmitForm";
import { AnswerDetailNotFound } from "@/features/answers/components/AnswerDetailNotFound";
import { QuestionRemovalRequestPanel } from "@/features/answers/components/QuestionRemovalRequestPanel";

function formatDate(value, lang) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "es" ? "es" : "en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function QuestionPanel({ question, lang, t }) {
  const location = [question.city, question.region, question.country].filter(Boolean).join(", ");
  const published = formatDate(question.publishedAt, lang);

  return (
    <header className="question-header">
      <p className="question-header__eyebrow">{t("answers.brand")}</p>
      <h1>{question.title}</h1>
      {question.body ? <p className="question-header__body">{question.body}</p> : null}
      <dl className="question-header__dates">
        {question.serviceKey ? (
          <div>
            <dt>{t("answers.serviceLabel")}</dt>
            <dd>{question.serviceKey}</dd>
          </div>
        ) : null}
        {location ? (
          <div>
            <dt>{t("answers.locationLabel")}</dt>
            <dd>{location}</dd>
          </div>
        ) : null}
        <div>
          <dt>{t("answers.published")}</dt>
          <dd>{published ?? t("common.notAvailable")}</dd>
        </div>
      </dl>
    </header>
  );
}

// TODO(seo-provider-links): When answer text references a provider by name, link
// it to the provider's /pro/<slug> page and/or render a related-provider card.
// This requires structured provider-mention metadata on answers.answers (the body
// is free text today). Do not auto-link by name-matching — it risks wrong/legal
// mismatches. Add the relation field first, then surface links here.
function PublishedAnswer({ answer, lang, t }) {
  const published = formatDate(answer.publishedAt, lang);
  const initial = String(answer.expertDisplayName || "?").trim().charAt(0).toUpperCase() || "?";
  const metaParts = [answer.expertProfileSlug, answer.expertServiceLabel, published].filter(Boolean);
  const paragraphs = String(answer.body || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="published-answer" aria-label={t("answers.answerAria")}>
      <header className="published-answer__head">
        <div className="published-answer__expert">
          <span className="published-answer__avatar" aria-hidden="true">{initial}</span>
          <div className="published-answer__identity">
            <h3 className="published-answer__name">{answer.expertDisplayName}</h3>
            {metaParts.length > 0 ? (
              <p className="published-answer__meta">{metaParts.join(" · ")}</p>
            ) : null}
          </div>
        </div>
        {answer.isAccepted ? (
          <span className="published-answer__accepted">{t("answers.acceptedBadge")}</span>
        ) : null}
      </header>

      <div className="published-answer__body">
        {paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

export function QuestionAnswerWorkspace({
  slug,
  initialQuestion = null,
  initialAnswers = [],
  showQuestionFallback = false
}) {
  const { lang, t } = useTrafficLanguage();
  const { question, questionStatus, answers } = useQuestionAnswers({
    slug,
    initialQuestion,
    initialAnswers,
    fetchQuestion: showQuestionFallback
  });

  // In fallback mode the question must resolve before we show the form/answers.
  const questionResolved = !showQuestionFallback || Boolean(question);

  // Show the Expert answers section whenever there are published answers, or in
  // community-question mode (where this is the only answer surface). On build-time
  // SEO answer pages with no runtime answers, the AnswerCard above already covers
  // the empty/pending state, so the section is omitted to avoid duplication.
  const showAnswersSection = questionResolved && (answers.length > 0 || showQuestionFallback);

  return (
    <section className="answers-detail__workspace">
      {showQuestionFallback ? (
        questionStatus === "loading" ? (
          <p className="answers-detail__loading">{t("answers.loadingQuestion")}</p>
        ) : question ? (
          <QuestionPanel question={question} lang={lang} t={t} />
        ) : (
          <AnswerDetailNotFound />
        )
      ) : null}

      {showAnswersSection ? (
        <section className="answers-detail__answers" aria-label={t("answers.expertAnswers")}>
          <div className="answers-section-heading">
            <p>{t("answers.publishedEyebrow")}</p>
            <h2>{t("answers.expertAnswers")}</h2>
          </div>
          {answers.length > 0 ? (
            answers.map((answer) => (
              <PublishedAnswer key={answer.id} answer={answer} lang={lang} t={t} />
            ))
          ) : (
            <p className="answers-detail__answers-empty">{t("answers.noAnswersTitle")}</p>
          )}
        </section>
      ) : null}

      {questionResolved ? <AnswerSubmitForm questionSlug={slug} /> : null}

      {/* Creator self-removal is offered only for community questions (those
          submitted through Traffic, which carry a stored asker email). The
          actual authorization happens server-side via the emailed token. */}
      {showQuestionFallback && question ? (
        <QuestionRemovalRequestPanel slug={slug} />
      ) : null}

      <div className="answers-detail__back">
        <Link href="/answers">{t("answers.backToAnswers")}</Link>
      </div>
    </section>
  );
}
