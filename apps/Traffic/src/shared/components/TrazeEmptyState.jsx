"use client";

import { useTrafficLanguage } from "@/lib/language";

/**
 * TrazeEmptyState — shared empty/no-results state for directory pages.
 *
 * Props:
 *   titleEn    / titleEs    — heading text
 *   subtitleEn / subtitleEs — body text
 */
export function TrazeEmptyState({ titleEn, titleEs, subtitleEn, subtitleEs }) {
  const { lang } = useTrafficLanguage();
  const title    = lang === "es" ? (titleEs    ?? titleEn)    : titleEn;
  const subtitle = lang === "es" ? (subtitleEs ?? subtitleEn) : subtitleEn;

  return (
    <div className="traze-empty-state">
      {title    && <p className="traze-empty-title">{title}</p>}
      {subtitle && <p className="traze-empty-sub">{subtitle}</p>}
    </div>
  );
}
