"use client";

import { useTrafficLanguage } from "@/lib/language";

export function DirectoryTitleClient({ titleEn, titleEs, className = "dir-hero-title" }) {
  const { lang } = useTrafficLanguage();
  return (
    <h1 className={className}>
      {lang === "es" ? titleEs : titleEn}
    </h1>
  );
}
