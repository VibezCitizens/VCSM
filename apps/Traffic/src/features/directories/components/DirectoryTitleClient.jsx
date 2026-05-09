"use client";

import { useTrafficLanguage } from "@/lib/language";

export function DirectoryTitleClient({ titleEn, titleEs }) {
  const { lang } = useTrafficLanguage();
  return (
    <h1 className="dir-hero-title">
      {lang === "es" ? titleEs : titleEn}
    </h1>
  );
}
