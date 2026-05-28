"use client";

import { useTrafficLanguage } from "@/lib/language";

export function AnswersEmptyState({ isSearching = false }) {
  const { t } = useTrafficLanguage();

  if (isSearching) {
    return (
      <div className="answers-empty-state">
        <div className="answers-empty-state__header">
          <p className="answers-kicker">{t("answers.noSearchResults")}</p>
          <h3>{t("answers.noSearchResults")}</h3>
          <p>{t("answers.noSearchResultsBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="answers-empty-state">
      <div className="answers-empty-state__header">
        <p className="answers-kicker">{t("answers.editorialReviewKicker")}</p>
        <h3>{t("answers.noPublishedTitle")}</h3>
        <p>{t("answers.emptyPublished")}</p>
      </div>

      <ul className="answers-skeleton-list" aria-hidden="true">
        <li className="answers-skeleton-row">
          <span className="answers-skeleton-dot" />
          <div className="answers-skeleton-body">
            <span className="answers-skeleton-tag" />
            <span className="answers-skeleton-title" />
            <span className="answers-skeleton-desc" />
          </div>
        </li>
        <li className="answers-skeleton-row">
          <span className="answers-skeleton-dot" />
          <div className="answers-skeleton-body">
            <span className="answers-skeleton-tag" />
            <span className="answers-skeleton-title" style={{ width: "58%" }} />
            <span className="answers-skeleton-desc" style={{ width: "80%" }} />
          </div>
        </li>
        <li className="answers-skeleton-row">
          <span className="answers-skeleton-dot" />
          <div className="answers-skeleton-body">
            <span className="answers-skeleton-tag" />
            <span className="answers-skeleton-title" style={{ width: "65%" }} />
            <span className="answers-skeleton-desc" style={{ width: "85%" }} />
          </div>
        </li>
      </ul>
    </div>
  );
}
