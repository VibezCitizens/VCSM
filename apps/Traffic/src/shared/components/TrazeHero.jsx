"use client";

import { useTrafficLanguage } from "@/lib/language";

/**
 * TrazeHero — shared hero card for directory/hub/category/top-provider pages.
 * Uses .traze-hero-card from traze-public-system.css.
 *
 * Props:
 *   eyebrowEn / eyebrowEs  — optional uppercase pill label
 *   titleEn   / titleEs    — required h1/h2 text
 *   subtitleEn / subtitleEs — optional paragraph
 *   stats                  — optional ReactNode (stat pills row)
 *   children               — optional slot (search bar, extra content)
 */
export function TrazeHero({
  eyebrowEn,
  eyebrowEs,
  titleEn,
  titleEs,
  subtitleEn,
  subtitleEs,
  stats,
  children
}) {
  const { lang } = useTrafficLanguage();

  const eyebrow  = lang === "es" ? (eyebrowEs  ?? eyebrowEn)  : eyebrowEn;
  const title    = lang === "es" ? (titleEs    ?? titleEn)    : titleEn;
  const subtitle = lang === "es" ? (subtitleEs ?? subtitleEn) : subtitleEn;

  return (
    <section className="traze-hero-card traze-page-hero">
      {eyebrow && (
        <span className="traze-eyebrow">{eyebrow}</span>
      )}

      {title && (
        <h1 className="traze-hero-title">{title}</h1>
      )}

      {subtitle && (
        <p className="traze-hero-sub">{subtitle}</p>
      )}

      {stats && (
        <div className="traze-stats-row">{stats}</div>
      )}

      {children}
    </section>
  );
}
