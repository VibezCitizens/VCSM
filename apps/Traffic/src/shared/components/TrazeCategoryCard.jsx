"use client";

import Link from "next/link";
import { Coins, Fuel, Key, Scissors, Store, Utensils } from "lucide-react";
import { withLocale } from "@/lib/i18n";

/**
 * Maps a category to an existing lucide icon (no new asset pipeline).
 * Falls back to a neutral storefront glyph for unknown / "other" categories.
 */
function categoryIcon(categoryKey) {
  const key = String(categoryKey ?? "").toLowerCase();
  if (key.includes("barber") || key.includes("hair")) return Scissors;
  if (key.includes("restaurant") || key.includes("food") || key.includes("dining")) return Utensils;
  if (key.includes("locksmith") || key.includes("lock")) return Key;
  if (key.includes("gas") || key.includes("fuel")) return Fuel;
  if (key.includes("exchange") || key.includes("money") || key.includes("currency") || key.includes("forex")) {
    return Coins;
  }
  return Store;
}

/**
 * TrazeCategoryCard — premium, fully-clickable category navigation tile.
 * Horizontal layout: icon on the left, category name on the right.
 * Props:
 *   categoryKey  string
 *   label        string
 *   isLive       boolean
 *   href         string
 *   lang         "en"|"es"
 */
export default function TrazeCategoryCard({ categoryKey, label, isLive, href, lang }) {
  const Icon = categoryIcon(categoryKey);

  const inner = (
    <>
      <span className="hp-cat-card-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <h3 className="hp-cat-card-name">{label}</h3>
    </>
  );

  if (!isLive) {
    return <article className="hp-cat-card hp-cat-card--inactive">{inner}</article>;
  }

  return (
    <Link className="hp-cat-card hp-cat-card--live" href={withLocale(href, lang)}>
      {inner}
    </Link>
  );
}
