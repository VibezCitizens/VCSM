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

function renderParagraphs(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>);
}

export function AnswerCard({ answer }) {
  const { lang, t } = useTrafficLanguage();

  if (!answer) {
    return (
      <section className="answer-card answer-card--pending" aria-label={t("answers.pendingAria")}>
        <p className="answer-card__eyebrow">{t("answers.pendingEyebrow")}</p>
        <h2>{t("answers.pendingTitle")}</h2>
        <p>{t("answers.pendingBody")}</p>
      </section>
    );
  }

  const answeredDate = formatDate(answer.answeredAt, lang);

  return (
    <section className="answer-card" aria-label={t("answers.answerAria")}>
      {answeredDate ? <p className="answer-card__eyebrow">{answeredDate}</p> : null}
      <h2>{answer.expert.displayName}</h2>
      {answer.expert.serviceLabel ? <p>{answer.expert.serviceLabel}</p> : null}
      <div className="answer-card__body">{renderParagraphs(answer.body)}</div>
    </section>
  );
}
