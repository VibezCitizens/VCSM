"use client";

import Link from "next/link";
import { withLocale } from "@/lib/i18n";
import { translate } from "@/i18n";

/**
 * TrazeCategoryCard — shared category card for directory pages.
 * Props:
 *   categoryKey  string
 *   label        string
 *   description  string|null
 *   isLive       boolean
 *   href         string
 *   pills        string[]    — service sub-label chips
 *   lang         "en"|"es"
 */
export default function TrazeCategoryCard({ categoryKey, label, description, isLive, href, pills = [], lang }) {
  return (
    <article
      key={categoryKey}
      className={`hp-cat-card${isLive ? " hp-cat-card--live" : " hp-cat-card--inactive"}`}
    >
      <div className="hp-cat-card-body">
        <div className="hp-cat-card-top">
          <h3 className="hp-cat-card-name">{label}</h3>
        </div>

        {description && (
          <p className="hp-cat-card-desc">{description}</p>
        )}

        {pills.length > 0 && (
          <div className="hp-cat-service-list">
            {pills.map((pillLabel, i) => (
              <span key={i} className="hp-cat-service-pill">{pillLabel}</span>
            ))}
          </div>
        )}

        <Link className="hp-cat-card-cta" href={withLocale(href, lang)}>
          {translate("common.explore", lang)}
        </Link>
      </div>
    </article>
  );
}
