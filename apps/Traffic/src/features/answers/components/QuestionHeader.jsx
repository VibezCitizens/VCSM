"use client";

import { useTrafficLanguage } from "@/lib/language";

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

function formatLocation(location) {
  return [location?.city, location?.region, location?.country].filter(Boolean).join(", ");
}

export function QuestionHeader({ question, topic, seo }) {
  const { lang, t } = useTrafficLanguage();

  if (!question) {
    return (
      <header className="question-header">
        <p className="question-header__eyebrow">{t("answers.brand")}</p>
        <h1>{t("answers.pageUnavailable")}</h1>
        <p>{t("answers.unpublishedBody")}</p>
      </header>
    );
  }

  const location = formatLocation(question.location);
  const eyebrow = `${t("answers.brand")}${topic?.name ? ` - ${topic.name}` : ""}`;

  return (
    <header className="question-header">
      <p className="question-header__eyebrow">{eyebrow}</p>
      <h1>{question.title}</h1>
      {question.body ? <p className="question-header__body">{question.body}</p> : null}
      <dl className="question-header__dates">
        <div>
          <dt>{t("answers.asked")}</dt>
          <dd>{formatDate(seo?.askedAt, lang) ?? t("common.notAvailable")}</dd>
        </div>
        <div>
          <dt>{t("answers.updated")}</dt>
          <dd>{formatDate(seo?.updatedAt, lang) ?? t("common.notAvailable")}</dd>
        </div>
        <div>
          <dt>{t("answers.answeredByExpert")}</dt>
          <dd>{formatDate(seo?.answeredAt, lang) ?? t("common.notAvailable")}</dd>
        </div>
      </dl>
      {location ? (
        <p className="question-header__location">
          {t("answers.serving", { place: location })}
        </p>
      ) : null}
    </header>
  );
}
