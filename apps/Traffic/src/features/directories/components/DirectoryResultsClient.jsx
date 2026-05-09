"use client";

import { useTrafficLanguage } from "@/lib/language";

export function DirectoryResultsClient({ providerCount, serviceLabel }) {
  const { t } = useTrafficLanguage();

  const sectionTitle = t("directory.availableProviders");
  const resultLabel =
    providerCount === 1
      ? t("directory.oneResult")
      : t("directory.results", { count: providerCount });

  return (
    <header className="dir-results-header">
      <h2 className="dir-results-title">{sectionTitle}</h2>
      <p className="dir-results-subtitle">{resultLabel}</p>
    </header>
  );
}

export function DirectoryEmptyStateClient({ serviceLabel }) {
  const { t } = useTrafficLanguage();

  return (
    <div className="dir-empty-state">
      <p className="dir-empty-title">
        {t("directory.emptyAreaTitle")}
      </p>
      <p className="dir-empty-copy">
        {t("directory.emptyAreaBody", { service: serviceLabel.toLowerCase() })}
      </p>
    </div>
  );
}
