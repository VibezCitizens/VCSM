"use client";

import Link from "next/link";
import { getPlatformOrigin } from "@/lib/env";
import { useTrafficLanguage } from "@/lib/language";
import { withLocale } from "@/lib/i18n";

/**
 * Global public footer for every public Traze page.
 *
 * Mounted once in the root layout (inside <main>) so it renders exactly once
 * per page and inherits the page content width. Intentionally does NOT contain
 * the "publicly available sources" listing disclaimer — that copy lives only on
 * provider profile pages via <ProviderDataDisclaimer>.
 */
function buildPlatformLink(path) {
  try {
    const url = new URL(path, getPlatformOrigin());
    url.searchParams.set("source", "traffic");
    url.searchParams.set("surface", "footer");
    return url.toString();
  } catch {
    return path;
  }
}

export default function TrazePublicFooter() {
  const { lang, t } = useTrafficLanguage();

  const mainPlatformHref = buildPlatformLink("/");

  return (
    <footer className="homepage-footer">
      <div className="homepage-footer-top">
        <div className="homepage-footer-brand">
          <p className="homepage-footer-name">TRAZE</p>
          <p className="homepage-footer-powered">{t("homepage.poweredByVc")}</p>
        </div>

        <nav className="homepage-footer-links" aria-label="Footer">
          <a className="homepage-footer-link" href={mainPlatformHref} target="_blank" rel="noreferrer">
            Vibez Citizens
          </a>
          <Link className="homepage-footer-link" href={withLocale("/directory", lang)}>
            {t("shell.nav.directory")}
          </Link>
          <Link className="homepage-footer-link" href="/sitemap-index.xml">
            Sitemap
          </Link>
          <Link className="homepage-footer-link" href={withLocale("/terms", lang)}>
            {t("homepage.terms")}
          </Link>
          <Link className="homepage-footer-link" href={withLocale("/privacy", lang)}>
            {t("homepage.privacy")}
          </Link>
          <Link className="homepage-footer-link" href={withLocale("/contact", lang)}>
            {t("homepage.contact")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
