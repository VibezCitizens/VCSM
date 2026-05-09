"use client";

import { useTrafficLanguage } from "@/lib/language";

export function DirectoryHeroClient({
  compareSubject,
  compareSubjectEs,
  providerCount,
  placeLabel,
  placeLabelEs,
  priceParts = []
}) {
  const { lang, t } = useTrafficLanguage();

  const providerLabel =
    providerCount === 1
      ? `1 ${t("common.provider")}`
      : `${providerCount} ${t("common.providers")}`;

  const subject = lang === "es" ? (compareSubjectEs || compareSubject) : compareSubject;
  const compareCopy = t("directory.compareCopy", { subject });

  const place = lang === "es" ? (placeLabelEs || placeLabel) : placeLabel;
  const scopeLabel = t("directory.scope", { place });

  return (
    <>
      <p className="dir-hero-copy">{compareCopy}</p>
      <div className="dir-hero-stats">
        <span className="pill">{providerLabel}</span>
        <span className="pill pill--ghost">
          {t("directory.liveDirectory")}
        </span>
      </div>
      <div className="dir-hero-meta" aria-label={t("directory.directoryDetails")}>
        <span className="dir-hero-meta-item">{scopeLabel}</span>
        {priceParts.slice(0, 2).map((part) => (
          <span key={part} className="dir-hero-meta-item">{part}</span>
        ))}
      </div>
    </>
  );
}
