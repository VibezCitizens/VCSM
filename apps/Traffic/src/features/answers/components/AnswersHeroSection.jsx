"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";

export function AnswersHeroSection() {
  const { t } = useTrafficLanguage();

  return (
    <header className="answers-hero-section">
      <div className="answers-hero-section__copy">
        <p className="answers-kicker">{t("answers.brand")}</p>
        <h1>{t("answers.indexTitle")}</h1>
        <p className="answers-hero-section__meta">{t("answers.heroMeta")}</p>
        <p>{t("answers.indexSubtitle")}</p>
      </div>

      <div className="answers-hero-section__actions" aria-label={t("answers.heroActionsAria")}>
        <Link className="btn btn--primary" href="#answers-search">
          {t("answers.searchAnswersCta")}
        </Link>
        <Link className="btn btn--ghost" href="#ask-question">
          {t("answers.askQuestionCta")}
        </Link>
      </div>
    </header>
  );
}
