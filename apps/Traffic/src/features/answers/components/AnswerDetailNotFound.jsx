"use client";

import { useTrafficLanguage } from "@/lib/language";

export function AnswerDetailNotFound() {
  const { t } = useTrafficLanguage();

  return (
    <section className="answers-detail__empty">
      <h2>{t("answers.notFoundTitle")}</h2>
      <p>{t("answers.notFoundBody")}</p>
      <a href="/answers">{t("answers.browseAnswers")}</a>
    </section>
  );
}
