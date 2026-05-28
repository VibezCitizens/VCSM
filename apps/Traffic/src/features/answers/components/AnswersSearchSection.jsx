"use client";

import { useTrafficLanguage } from "@/lib/language";

const QUICK_SEARCH_CHIPS = [
  "Pricing",
  "Best barber near me",
  "Emergency locksmith",
  "Restaurant recommendations",
];

export function AnswersSearchSection({ query, onQueryChange }) {
  const { t } = useTrafficLanguage();

  return (
    <section id="answers-search" className="answers-search-section" aria-label={t("answers.searchAria")}>
      <p className="answers-search-section__eyebrow">{t("answers.searchKicker")}</p>

      <label className="answers-search-box">
        <span className="answers-search-box__icon" aria-hidden="true" />
        <span className="answers-search-box__sr">{t("answers.searchLabel")}</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("answers.searchPlaceholder")}
        />
        <span className="answers-search-box__kbd" aria-hidden="true">⌘K</span>
      </label>

      <div className="answers-search-chips">
        {QUICK_SEARCH_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="answers-search-chip"
            onClick={() => onQueryChange(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
}
